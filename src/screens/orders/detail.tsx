import { useOrder, useUpdateOrderStatus } from "@/hooks/db/useOrders";
import { usePaymentStatus } from "@/hooks/db/usePaymentStatus";
import type { Alignment } from "@haroldtran/react-native-thermal-printer";
import { BLEPrinter, COMMANDS, NetPrinter } from "@haroldtran/react-native-thermal-printer";
import {
  extractPaymentDetailsRows,
  extractPaymentExpiry,
  extractPaymentQrUrl,
  isExpired,
} from "@/api/mappers/checkout";
import {
  extractCustomerName,
  extractNumber,
  extractOrderItems,
  extractPaymentName,
  extractStatusColor,
  extractStatusLabel,
  extractTableName,
} from "@/api/mappers/order";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import Countdown from "@/components/common/Countdown";
import { usePrinterStore } from "@/stores/usePrinterStore";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/ApiError";
import { Ionicons } from "@expo/vector-icons";
import { Button, Chip, Dialog, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { useState } from "react";

const PRINTER_PORT = "9100";

type PromptState = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

const paperWidthConfig = {
  "58mm": {
    dottedLine: COMMANDS.HORIZONTAL_LINE.HR3_58MM.slice(0, 32),
    billColumnWidth: [20, 12] as [number, number],
  },
  "80mm": {
    dottedLine: COMMANDS.HORIZONTAL_LINE.HR3_80MM.slice(0, 46),
    billColumnWidth: [30, 16] as [number, number],
  },
};

function getBluetoothPermissions() {
  if (Platform.OS !== "android") return [];

  if (Number(Platform.Version) >= 31) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ];
  }

  return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

async function requestBluetoothPermissions(): Promise<{ granted: boolean; blocked: boolean }> {
  const permissions = getBluetoothPermissions();
  if (permissions.length === 0) return { granted: true, blocked: false };

  const results = await PermissionsAndroid.requestMultiple(permissions);
  const granted = permissions.every(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
  );
  const blocked = permissions.some(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
  );

  return { granted, blocked };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [themeColorForeground, themeColorMuted, themeColorDanger] = useThemeColor([
    "foreground",
    "muted",
    "danger",
  ]);

  const printerSettings = usePrinterStore((s) => s.settings);
  const receiptSettings = useReceiptStore((s) => s.settings);
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const paymentStatus = usePaymentStatus(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) return <LoadingState message="Loading order…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3">
        <Ionicons name="receipt-outline" size={40} color={themeColorMuted} />
        <Typography className="text-sm text-muted-foreground">Order not found</Typography>
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <Typography className="text-sm text-primary">← Back</Typography>
        </Pressable>
      </View>
    );
  }

  const statusLabel = extractStatusLabel(order.order_status);
  const statusColor = extractStatusColor(order.order_status);
  const statusCode = statusLabel.toLowerCase();
  const paymentStatusLabel = extractStatusLabel(order.payment_status);
  const paymentStatusColor = extractStatusColor(order.payment_status);
  const customerName = extractCustomerName(order.customer);
  const paymentName = extractPaymentName(order.payment);
  const paymentDetailsRows = extractPaymentDetailsRows(order.payment_details);
  const paymentExpiresAt = extractPaymentExpiry(order.payment_details);
  const paymentQrUrl = extractPaymentQrUrl({
    payment_details: order.payment_details,
    payment: order.payment,
  });
  const paymentExpired = isExpired(paymentExpiresAt);
  const isQrisPayment = paymentName.toLowerCase().includes("qris") || !!paymentQrUrl;
  const canShowQr = !!paymentQrUrl && !paymentExpired && isQrisPayment;
  const tableName = extractTableName(order.orderable);
  const items = extractOrderItems(order.products);
  const feeAmount = extractNumber(order.payment_fee);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const openBluetoothSettings = async () => {
    if (Platform.OS === "android") {
      try {
        const IntentLauncher =
          require("expo-intent-launcher") as typeof import("expo-intent-launcher");
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS);
        return;
      } catch {
        await Linking.openSettings();
        return;
      }
    }

    await Linking.openSettings();
  };

  const promptPrinterSettings = () => {
    setPrompt({
      title: "Printer not configured",
      message: "Configure and test your printer before printing receipts.",
      actionLabel: "Open Settings",
      onAction: () => router.push("/settings/printer"),
    });
  };

  const handlePrintReceipt = async () => {
    setIsPrintingReceipt(true);

    try {
      const PrinterDriver = printerSettings.connection === "bluetooth" ? BLEPrinter : NetPrinter;

      if (printerSettings.connection === "bluetooth") {
        const address = printerSettings.macAddress || printerSettings.selectedDeviceId;
        if (!address) {
          promptPrinterSettings();
          return;
        }

        const permission = await requestBluetoothPermissions();
        if (!permission.granted) {
          setPrompt({
            title: "Bluetooth permission required",
            message: permission.blocked
              ? "Bluetooth printer access is blocked. Enable Bluetooth permissions in system settings."
              : "Bluetooth printer access is required to print receipts.",
            actionLabel: "Open Settings",
            onAction: () => Linking.openSettings(),
          });
          return;
        }

        await BLEPrinter.init();
        await BLEPrinter.connectPrinter(address);
      } else {
        const host = printerSettings.ipAddress.trim();
        const port = Number(printerSettings.port || PRINTER_PORT);

        if (!host) {
          promptPrinterSettings();
          return;
        }

        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error("Printer port must be between 1 and 65535.");
        }

        await NetPrinter.init();
        await NetPrinter.connectPrinter(host, port);
      }

      const boldOn = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
      const boldOff = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
      const center = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
      const left = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
      const size2h = COMMANDS.TEXT_FORMAT.TXT_2HEIGHT;
      const sizeNormal = COMMANDS.TEXT_FORMAT.TXT_NORMAL;
      const paperConfig = paperWidthConfig[printerSettings.paperWidth];
      const columnAlign: Alignment[] = ["left", "right"];
      const reportPrintError = (printError: Error) => {
        setPrompt({ title: "Print failed", message: printError.message });
      };

      const storeName = receiptSettings.storeName || "SOEAT POS";
      const addressLines = [
        receiptSettings.storeAddress1,
        receiptSettings.storeAddress2,
        receiptSettings.storePhone,
      ].filter(Boolean);

      PrinterDriver.printText(`${center}${boldOn}${size2h}${storeName}${sizeNormal}${boldOff}\n`, {
        onError: reportPrintError,
      });
      for (const line of addressLines) {
        PrinterDriver.printText(`${center}${line}`, { onError: reportPrintError });
      }
      PrinterDriver.printText(`${center}${paperConfig.dottedLine}`, { onError: reportPrintError });
      PrinterDriver.printText(`${left}Order       : ${order.code}`, { onError: reportPrintError });
      PrinterDriver.printText(`Tanggal     : ${formatDateTime(order.created_at)}`, {
        onError: reportPrintError,
      });
      PrinterDriver.printText(
        `Tipe        : ${order.order_type === "dine-in" ? "Dine-in" : "Takeaway"}`,
        { onError: reportPrintError }
      );
      if (tableName) {
        PrinterDriver.printText(`Table       : ${tableName}`, { onError: reportPrintError });
      }
      if (receiptSettings.printCustomerName) {
        PrinterDriver.printText(`Pelanggan   : ${customerName ?? "Walk-in"}`, {
          onError: reportPrintError,
        });
      }
      PrinterDriver.printText(`Pembayaran  : ${paymentName}`, { onError: reportPrintError });
      PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });

      for (const item of items) {
        PrinterDriver.printText(item.name, { onError: reportPrintError });
        PrinterDriver.printColumnsText(
          [`${item.qty} x ${formatRupiah(item.price)}`, formatRupiah(item.price * item.qty)],
          paperConfig.billColumnWidth,
          columnAlign,
          ["", ""],
          { onError: reportPrintError }
        );
      }

      PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });
      PrinterDriver.printColumnsText(
        ["Subtotal", formatRupiah(order.subtotal)],
        paperConfig.billColumnWidth,
        columnAlign,
        ["", ""],
        { onError: reportPrintError }
      );
      if (feeAmount > 0) {
        PrinterDriver.printColumnsText(
          ["Payment fee", formatRupiah(feeAmount)],
          paperConfig.billColumnWidth,
          columnAlign,
          ["", ""],
          { onError: reportPrintError }
        );
      }
      if (receiptSettings.showTotalQuantity) {
        PrinterDriver.printText(`Item = ${items.length} - Qty = ${totalQty}`, {
          onError: reportPrintError,
        });
      }
      PrinterDriver.printText("TOTAL", { onError: reportPrintError });
      PrinterDriver.printText(
        `${boldOn}${size2h}${formatRupiah(order.total)}${sizeNormal}${boldOff}\n`,
        {
          onError: reportPrintError,
        }
      );
      if (order.notes) {
        PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });
        PrinterDriver.printText(`Catatan: ${order.notes}`, { onError: reportPrintError });
      }
      if (receiptSettings.footer) {
        PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });
        PrinterDriver.printText(`${center}${receiptSettings.footer}`, {
          onError: reportPrintError,
        });
      }
      if (printerSettings.openDrawer) {
        PrinterDriver.printText(COMMANDS.CASH_DRAWER.CD_KICK_2, { onError: reportPrintError });
      }
      PrinterDriver.printBill("", {
        cut: printerSettings.cutReceipt,
        beep: true,
        onError: reportPrintError,
      });

      setPrompt({
        title: "Sent to printer",
        message: `Receipt ${order.code} was sent to the printer.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not print the receipt.";
      const canOpenBluetoothSettings =
        printerSettings.connection === "bluetooth" && /bluetooth/i.test(message);

      setPrompt({
        title: "Print failed",
        message,
        actionLabel: canOpenBluetoothSettings
          ? Platform.OS === "android"
            ? "Open Bluetooth Settings"
            : "Open Settings"
          : undefined,
        onAction: canOpenBluetoothSettings ? openBluetoothSettings : undefined,
      });
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const handlePromptAction = async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4 pb-10">
        {/* ── Header ── */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Typography className="text-xl font-bold text-foreground font-mono">
              {order.code}
            </Typography>
            <Chip color={statusColor} size="sm" variant="soft">
              <Chip.Label>{statusLabel}</Chip.Label>
            </Chip>
          </View>
          <Typography className="text-xs text-muted-foreground">
            {formatDateTime(order.created_at)}
          </Typography>
        </View>

        {/* ── Order info ── */}
        <Surface className="w-full overflow-hidden">
          <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
            <Ionicons
              name={order.order_type === "dine-in" ? "restaurant-outline" : "bag-outline"}
              size={16}
              color={themeColorMuted}
            />
            <View className="flex-1">
              <Typography className="text-xs text-muted-foreground">Order type</Typography>
              <Typography className="text-sm font-semibold text-foreground capitalize">
                {order.order_type === "dine-in" ? "Dine-in" : "Takeaway"}
              </Typography>
            </View>
          </View>

          {tableName && (
            <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
              <Ionicons name="grid-outline" size={16} color={themeColorMuted} />
              <View className="flex-1">
                <Typography className="text-xs text-muted-foreground">Table</Typography>
                <Typography className="text-sm font-semibold text-foreground">
                  {tableName}
                </Typography>
              </View>
            </View>
          )}

          <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
            <Ionicons name="card-outline" size={16} color={themeColorMuted} />
            <View className="flex-1">
              <Typography className="text-xs text-muted-foreground">Payment</Typography>
              <Typography className="text-sm font-semibold text-foreground">
                {paymentName}
              </Typography>
            </View>
            <Chip color={paymentStatusColor} size="sm" variant="soft">
              <Chip.Label>{paymentStatusLabel}</Chip.Label>
            </Chip>
          </View>

          <View className="flex-row items-center gap-3 px-4 py-3">
            <Ionicons name="person-outline" size={16} color={themeColorMuted} />
            <View className="flex-1">
              <Typography className="text-xs text-muted-foreground">Customer</Typography>
              <Typography className="text-sm font-semibold text-foreground">
                {customerName ?? "Walk-in"}
              </Typography>
            </View>
          </View>
        </Surface>

        {/* ── Order items ── */}
        <View className="gap-2">
          <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Order Items
          </Typography>
          <Surface className="w-full overflow-hidden">
            {items.map((item, index) => (
              <View
                key={index}
                className={`flex-row items-center justify-between px-4 py-3 ${index < items.length - 1 ? "border-b border-border" : ""}`}
              >
                <View className="flex-1 gap-0.5">
                  <Typography className="text-sm font-medium text-foreground" numberOfLines={1}>
                    {item.name}
                  </Typography>
                  <Typography className="text-xs text-muted-foreground">
                    {item.qty} × {formatRupiah(item.price)}
                  </Typography>
                </View>
                <Typography className="text-sm font-semibold text-foreground">
                  {formatRupiah(item.price * item.qty)}
                </Typography>
              </View>
            ))}
          </Surface>
        </View>

        {/* ── Pricing summary ── */}
        <View className="gap-2">
          <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Summary
          </Typography>
          <Surface className="w-full overflow-hidden">
            <View className="flex-row justify-between px-4 py-3 border-b border-border">
              <Typography className="text-sm text-muted-foreground">Subtotal</Typography>
              <Typography className="text-sm text-foreground">
                {formatRupiah(order.subtotal)}
              </Typography>
            </View>
            {feeAmount > 0 && (
              <View className="flex-row justify-between px-4 py-3 border-b border-border">
                <Typography className="text-sm text-muted-foreground">Payment fee</Typography>
                <Typography className="text-sm text-foreground">
                  {formatRupiah(feeAmount)}
                </Typography>
              </View>
            )}
            <View className="flex-row justify-between px-4 py-3">
              <Typography className="text-sm font-bold text-foreground">Total</Typography>
              <Typography className="text-sm font-bold text-foreground">
                {formatRupiah(order.total)}
              </Typography>
            </View>
          </Surface>
        </View>

        {/* ── Notes ── */}
        {order.notes && (
          <View className="gap-2">
            <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </Typography>
            <Surface className="w-full px-4 py-3">
              <Typography className="text-sm text-foreground italic">{order.notes}</Typography>
            </Surface>
          </View>
        )}

        {/* ── Payment details ── */}
        {(paymentDetailsRows.length > 0 || canShowQr) && (
          <View className="gap-2">
            <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Details
            </Typography>
            <Surface className="w-full overflow-hidden">
              {paymentDetailsRows.map((row, index) => (
                <View
                  key={`${row.label}-${index}`}
                  className={`flex-row justify-between gap-4 px-4 py-3 ${index < paymentDetailsRows.length - 1 || canShowQr ? "border-b border-border" : ""}`}
                >
                  <Typography className="text-sm text-muted-foreground">{row.label}</Typography>
                  <Typography className="text-sm font-semibold text-foreground text-right flex-1">
                    {row.value}
                  </Typography>
                </View>
              ))}
              {paymentExpiresAt && !paymentExpired && (
                <View className={`px-4 py-3 ${canShowQr ? "border-b border-border" : ""}`}>
                  <Countdown
                    expiresAt={paymentExpiresAt}
                    prefix="Payment expires in"
                    className="text-xs text-warning font-semibold"
                  />
                </View>
              )}
              {canShowQr && (
                <View className="px-4 py-3">
                  <Button variant="outline" onPress={() => setIsQrOpen(true)}>
                    <Ionicons name="qr-code-outline" size={16} color={themeColorForeground} />
                    <Button.Label className="ml-1.5">Show QRIS QR</Button.Label>
                  </Button>
                </View>
              )}
            </Surface>
          </View>
        )}

        {/* ── Status actions ── */}
        {/* cancelled is not a merchant-settable transition via this endpoint
                    (it's system/customer-initiated) — display only, no action. */}
        {(statusCode === "new" || statusCode === "process") && (
          <View className="gap-2">
            <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Update Status
            </Typography>
            <View className="flex-row gap-3">
              {statusCode === "new" && (
                <Button
                  className="flex-1 bg-green-500 border-green-500"
                  onPress={() => updateStatus.mutate({ id: order.id, status: "process" })}
                  isDisabled={updateStatus.isPending}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                  <Button.Label className="ml-1.5">Accept</Button.Label>
                </Button>
              )}
              {statusCode === "process" && (
                <Button
                  className="flex-1 bg-green-500 border-green-500"
                  onPress={() => updateStatus.mutate({ id: order.id, status: "completed" })}
                  isDisabled={updateStatus.isPending}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                  <Button.Label className="ml-1.5">Mark Completed</Button.Label>
                </Button>
              )}
              <Button
                variant="outline"
                className="border-danger"
                onPress={() => updateStatus.mutate({ id: order.id, status: "rejected" })}
                isDisabled={updateStatus.isPending}
              >
                <Ionicons name="close-circle-outline" size={16} color={themeColorDanger} />
                <Button.Label className="ml-1.5 text-danger">Reject</Button.Label>
              </Button>
            </View>
            {updateStatus.isError && (
              <Typography className="text-xs text-danger">
                {getErrorMessage(updateStatus.error)}
              </Typography>
            )}
            {updateStatus.isSuccess && (
              <Typography className="text-xs text-success">Order status updated.</Typography>
            )}
          </View>
        )}

        {/* ── Payment status refresh ── */}
        <View className="gap-2">
          <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Payment status
          </Typography>
          <Button
            variant="outline"
            onPress={() => paymentStatus.mutate()}
            isDisabled={paymentStatus.isPending}
          >
            {paymentStatus.isPending ? (
              <ActivityIndicator />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color={themeColorForeground} />
                <Button.Label className="ml-1.5">Refresh payment status</Button.Label>
              </>
            )}
          </Button>
          {paymentStatus.isError && (
            <Typography className="text-xs text-danger">
              {getErrorMessage(paymentStatus.error)}
            </Typography>
          )}
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View className="flex-row gap-3 bg-surface p-4 border-t border-border">
        <Button
          variant="outline"
          className="flex-1"
          onPress={handlePrintReceipt}
          isDisabled={isPrintingReceipt}
        >
          {isPrintingReceipt ? (
            <ActivityIndicator />
          ) : (
            <Ionicons name="print-outline" size={16} color={themeColorForeground} />
          )}
          <Button.Label className="ml-1.5">
            {isPrintingReceipt ? "Printing…" : "Print Receipt"}
          </Button.Label>
        </Button>
        <Button variant="outline" onPress={() => router.back()}>
          Close
        </Button>
      </View>

      <Dialog isOpen={isQrOpen && canShowQr} onOpenChange={setIsQrOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            isSwipeable={false}
            className="w-full max-w-md self-center bg-background p-0 overflow-hidden"
          >
            <View className="flex-row justify-between gap-4 bg-surface p-4">
              <View className="gap-0.5">
                <Dialog.Title>QRIS Payment</Dialog.Title>
                <Typography className="text-sm text-muted-foreground">{order.code}</Typography>
              </View>
              <Dialog.Close />
            </View>
            <Separator />
            <View className="items-center gap-3 p-6">
              <View className="w-64 h-64 bg-white rounded-lg border border-border items-center justify-center">
                <Image source={{ uri: paymentQrUrl! }} className="w-60 h-60" resizeMode="contain" />
              </View>
              <Typography className="text-base font-semibold text-foreground">
                {formatRupiah(order.total)}
              </Typography>
              <Countdown
                expiresAt={paymentExpiresAt}
                prefix="QR berlaku"
                className="text-xs text-warning font-semibold"
                onExpire={() => setIsQrOpen(false)}
              />
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={prompt !== null} onOpenChange={(open) => !open && setPrompt(null)}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
            <Dialog.Close variant="ghost" />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>{prompt?.title}</Dialog.Title>
              {prompt?.message ? <Dialog.Description>{prompt.message}</Dialog.Description> : null}
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setPrompt(null)}>
                <Button.Label>{prompt?.actionLabel ? "Cancel" : "Close"}</Button.Label>
              </Button>
              {prompt?.actionLabel ? (
                <Button size="sm" onPress={handlePromptAction}>
                  <Button.Label>{prompt.actionLabel}</Button.Label>
                </Button>
              ) : null}
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}

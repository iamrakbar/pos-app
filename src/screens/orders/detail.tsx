import { useOrder, useUpdateOrderStatus } from "@/hooks/db/useOrders";
import { usePaymentStatus } from "@/hooks/db/usePaymentStatus";
import { useTables } from "@/hooks/db/useTables";
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
  extractTableName,
  getOrderStatus,
  getPaymentStatus,
} from "@/api/mappers/order";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import Countdown from "@/components/common/Countdown";
import QrUrlDisclosure from "@/components/common/QrUrlDisclosure";
import DialogCloseButton from "@/components/common/DialogCloseButton";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { getToolbarIcon } from "@/utils/toolbarIcons";
import { useNavigationTheme } from "@/utils/navigationTheme";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/ApiError";
import { Ionicons } from "@expo/vector-icons";
import { Button, Chip, Dialog, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Image, View, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import Constants from "expo-constants";

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

function formatPickupTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const time = /^(\d{2}):(\d{2})/.exec(value);
  return time ? `${time[1]}:${time[2]}` : value;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography type="body-sm" weight="semibold">
      {children}
    </Typography>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Typography type="body-sm" color="muted">
        {label}
      </Typography>
      <Typography type="body-sm" weight="medium" className="flex-1 text-right">
        {value}
      </Typography>
    </View>
  );
}

function MoneyRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Typography
        type={emphasized ? "body" : "body-sm"}
        weight={emphasized ? "bold" : undefined}
        color={emphasized ? undefined : "muted"}
      >
        {label}
      </Typography>
      <Typography
        type={emphasized ? "body" : "body-sm"}
        weight={emphasized ? "bold" : "medium"}
        className="tabular-nums"
      >
        {formatRupiah(value)}
      </Typography>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigationTheme = useNavigationTheme();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [themeColorForeground, themeColorMuted] = useThemeColor(["foreground", "muted"]);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const { data: tables } = useTables();
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

  const orderStatus = getOrderStatus(order.order_status);
  const paymentStatusPresentation = getPaymentStatus(order.payment_status);
  const statusCode = orderStatus.value;
  const customerName = extractCustomerName(order.customer);
  const paymentName = extractPaymentName(order.payment);
  const paymentCode = order.payment.code?.toLowerCase() ?? "";
  const paymentGroup = order.payment.group_type?.toLowerCase() ?? "";
  const normalizedPaymentName = paymentName.toLowerCase();
  const isCashPayment =
    paymentCode.includes("cash") ||
    paymentGroup.includes("cash") ||
    normalizedPaymentName.includes("cash");
  const isQrisPayment =
    paymentCode.includes("qris") ||
    paymentGroup.includes("qris") ||
    normalizedPaymentName.includes("qris");
  const paymentDetailsRows = isCashPayment ? [] : extractPaymentDetailsRows(order.payment_details);
  const paymentExpiresAt = extractPaymentExpiry(order.payment_details);
  const paymentQrUrl = extractPaymentQrUrl({
    payment_details: order.payment_details,
    payment: order.payment,
  });
  const buildVariant = Constants.expoConfig?.extra?.buildVariant;
  const hasQrImageUrl = !!paymentQrUrl && /^https?:\/\//i.test(paymentQrUrl);
  const showQrUrl =
    (buildVariant === "development" || buildVariant === "preview") &&
    hasQrImageUrl &&
    isQrisPayment;
  const visiblePaymentDetailsRows = paymentDetailsRows.filter(
    (row) => !hasQrImageUrl || row.value !== paymentQrUrl
  );
  const paymentExpired = isExpired(paymentExpiresAt);
  const canShowQr = !!paymentQrUrl && !paymentExpired && isQrisPayment;
  const tableName = extractTableName(order.orderable);
  const orderAreaName =
    order.orderable && "area_name" in order.orderable
      ? String((order.orderable as unknown as Record<string, unknown>).area_name ?? "") || null
      : null;
  const matchedTable = tables?.find((table) => table.id === order.orderable?.table_id);
  const areaName = orderAreaName ?? matchedTable?.area_name ?? null;
  const pickupTime = formatPickupTime(order.orderable?.pickup_time);
  const items = extractOrderItems(order.products);
  const feeAmount = extractNumber(order.payment_fee);
  const canRefreshPayment = !isCashPayment && !!paymentExpiresAt && !paymentExpired;

  const handlePrintReceipt = async () => {
    await printReceipt(order, "reprint");
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          {...getToolbarIcon("printer")}
          tintColor={navigationTheme.foreground}
          accessibilityLabel={isPrinting ? "Printing receipt" : "Print receipt"}
          disabled={isPrinting}
          onPress={handlePrintReceipt}
        />
      </Stack.Toolbar>

      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          <View className="w-full max-w-3xl self-center gap-5">
            <Surface className="w-full p-5">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Typography type="h4" weight="bold" className="font-mono tabular-nums">
                      {order.code}
                    </Typography>
                    <Chip color={orderStatus.color} size="sm" variant="soft">
                      <Chip.Label>{orderStatus.label}</Chip.Label>
                    </Chip>
                  </View>
                  <Typography type="body-sm" color="muted">
                    {formatDateTime(order.created_at)}
                  </Typography>
                </View>
                <View className="items-end gap-3">
                  <Typography type="body-xs" color="muted">
                    Total
                  </Typography>
                  <Typography type="h4" weight="bold" className="tabular-nums">
                    {formatRupiah(order.total)}
                  </Typography>
                </View>
              </View>
            </Surface>

            <View className="gap-2">
              <SectionTitle>Order Type</SectionTitle>
              <Surface className="w-full p-4 gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
                    <Ionicons
                      name={
                        order.order_type === "dine-in" ? "restaurant-outline" : "bag-handle-outline"
                      }
                      size={20}
                      color={themeColorForeground}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Typography type="body" weight="semibold">
                      {order.order_type === "dine-in" ? "Dine-in" : "Takeaway"}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {order.order_type === "dine-in"
                        ? [areaName, tableName].filter(Boolean).join(" · ") || "Table not assigned"
                        : pickupTime
                          ? `Pickup at ${pickupTime}`
                          : "Pickup time not specified"}
                    </Typography>
                  </View>
                </View>
                <DetailRow label="Customer" value={customerName ?? "Walk-in"} />
              </Surface>
            </View>

            <View className="gap-5">
              <View className="flex-1 gap-4">
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <SectionTitle>Order Items</SectionTitle>
                    <Typography type="body-xs" color="muted">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </Typography>
                  </View>
                  <Surface className="w-full overflow-hidden">
                    {items.map((item, index) => (
                      <View
                        key={`${order.products[index]?.product_id}-${item.name}-${item.subtotal}`}
                        className={`gap-2 px-4 py-3.5 ${index < items.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <View className="flex-row items-start justify-between gap-4">
                          <View className="flex-1 gap-0.5">
                            <Typography type="body-sm" weight="semibold">
                              {item.name}
                            </Typography>
                            <View className="flex-row items-center gap-1.5">
                              <Typography type="body-xs" color="muted" className="tabular-nums">
                                {item.qty} x {formatRupiah(item.price)}
                              </Typography>
                              {item.originalPrice !== null ? (
                                <Typography
                                  type="body-xs"
                                  color="muted"
                                  className="line-through tabular-nums"
                                >
                                  {formatRupiah(item.originalPrice)}
                                </Typography>
                              ) : null}
                            </View>
                          </View>
                          <Typography type="body-sm" weight="semibold" className="tabular-nums">
                            {formatRupiah(item.subtotal)}
                          </Typography>
                        </View>
                        {item.addOns.flatMap((addOn) =>
                          addOn.options.map((option, optionIndex) => (
                            <View
                              key={`${addOn.name}-${option.name}-${optionIndex}`}
                              className="flex-row items-start justify-between gap-3 pl-2"
                            >
                              <Typography type="body-xs" color="muted" className="flex-1">
                                + {addOn.name}: {option.name}
                              </Typography>
                              {option.price > 0 ? (
                                <Typography type="body-xs" color="muted" className="tabular-nums">
                                  {formatRupiah(option.price)}
                                </Typography>
                              ) : null}
                            </View>
                          ))
                        )}
                        {order.products[index]?.notes ? (
                          <Typography type="body-xs" color="muted" className="italic">
                            Note: {order.products[index].notes}
                          </Typography>
                        ) : null}
                      </View>
                    ))}
                  </Surface>
                </View>

                {order.notes ? (
                  <View className="gap-2">
                    <SectionTitle>Order Notes</SectionTitle>
                    <Surface className="w-full p-4">
                      <Typography type="body-sm">{order.notes}</Typography>
                    </Surface>
                  </View>
                ) : null}
              </View>

              <View className="gap-4">
                <View className="gap-2">
                  <View className="flex-row items-center justify-between gap-3">
                    <SectionTitle>Payment</SectionTitle>
                    <Chip color={paymentStatusPresentation.color} size="sm" variant="soft">
                      <Chip.Label>{paymentStatusPresentation.label}</Chip.Label>
                    </Chip>
                  </View>
                  <Surface className="w-full p-4 gap-3">
                    <DetailRow label="Method" value={paymentName} />
                    {visiblePaymentDetailsRows.map((row) => (
                      <DetailRow key={row.label} label={row.label} value={row.value} />
                    ))}
                    {showQrUrl ? <QrUrlDisclosure url={paymentQrUrl} /> : null}
                    {canRefreshPayment ? (
                      <Countdown
                        expiresAt={paymentExpiresAt}
                        prefix="Expires in"
                        className="text-sm text-warning font-semibold"
                      />
                    ) : null}
                    {canShowQr ? (
                      <Button variant="outline" onPress={() => setIsQrOpen(true)}>
                        <Ionicons name="qr-code-outline" size={16} color={themeColorForeground} />
                        <Button.Label>Show QRIS</Button.Label>
                      </Button>
                    ) : null}
                    {canRefreshPayment ? (
                      <Button
                        variant="ghost"
                        onPress={() => paymentStatus.mutate()}
                        isDisabled={paymentStatus.isPending}
                      >
                        {paymentStatus.isPending ? (
                          <ActivityIndicator />
                        ) : (
                          <Ionicons name="refresh-outline" size={16} color={themeColorForeground} />
                        )}
                        <Button.Label>Refresh Status</Button.Label>
                      </Button>
                    ) : null}
                    {paymentStatus.isError ? (
                      <Typography type="body-xs" className="text-danger">
                        {getErrorMessage(paymentStatus.error)}
                      </Typography>
                    ) : null}
                  </Surface>
                </View>

                <View className="gap-2">
                  <SectionTitle>Summary</SectionTitle>
                  <Surface className="w-full p-4 gap-3">
                    <MoneyRow label="Subtotal" value={order.subtotal} />
                    {feeAmount > 0 ? <MoneyRow label="Payment fee" value={feeAmount} /> : null}
                    <Separator />
                    <MoneyRow label="Total" value={order.total} emphasized />
                  </Surface>
                </View>

                {/* ── Status actions ── */}
                {/* cancelled is not a merchant-settable transition via this endpoint
                    (it's system/customer-initiated) — display only, no action. */}
                {(statusCode === "new" || statusCode === "process") && (
                  <View className="gap-2">
                    <SectionTitle>Update Status</SectionTitle>
                    <View className="flex-row gap-3">
                      {statusCode === "new" && (
                        <Button
                          className="flex-1"
                          onPress={() => updateStatus.mutate({ id: order.id, status: "process" })}
                          isDisabled={updateStatus.isPending}
                        >
                          <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                          <Button.Label className="ml-1.5">Accept</Button.Label>
                        </Button>
                      )}
                      {statusCode === "process" && (
                        <Button
                          className="flex-1"
                          onPress={() => updateStatus.mutate({ id: order.id, status: "completed" })}
                          isDisabled={updateStatus.isPending}
                        >
                          <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                          <Button.Label className="ml-1.5">Mark Completed</Button.Label>
                        </Button>
                      )}
                      {/* Reject remains a supported status transition, but its interaction is
                        intentionally hidden until the rejection flow is ready to expose. */}
                    </View>
                    {updateStatus.isError && (
                      <Typography className="text-xs text-danger">
                        {getErrorMessage(updateStatus.error)}
                      </Typography>
                    )}
                    {updateStatus.isSuccess && (
                      <Typography className="text-xs text-success">
                        Order status updated.
                      </Typography>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <Dialog isOpen={isQrOpen && canShowQr} onOpenChange={setIsQrOpen}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content
              isSwipeable={false}
              className="w-full max-w-md self-center bg-background p-0 overflow-hidden"
            >
              <DialogCloseButton />
              <View className="bg-surface p-4 pr-14">
                <View className="gap-0.5">
                  <Dialog.Title>QRIS Payment</Dialog.Title>
                  <Typography className="text-sm text-muted-foreground">{order.code}</Typography>
                </View>
              </View>
              <Separator />
              <View className="items-center gap-3 p-6">
                <View className="w-64 h-64 bg-white rounded-lg border border-border items-center justify-center">
                  <Image
                    source={{ uri: paymentQrUrl! }}
                    className="w-60 h-60"
                    resizeMode="contain"
                  />
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
              <DialogCloseButton />
              <View className="mb-5 gap-1.5 pr-10">
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
    </>
  );
}

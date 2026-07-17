import { useOrder, useUpdateOrderStatus } from "@/hooks/db/useOrders";
import { usePaymentStatus } from "@/hooks/db/usePaymentStatus";
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
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/ApiError";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Chip,
  Dialog,
  Separator,
  Spinner,
  Surface,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";

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
  const [isQrOpen, setIsQrOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [themeColorForeground, themeColorMuted, themeColorDanger] = useThemeColor([
    "foreground",
    "muted",
    "danger",
  ]);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

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

  const handlePrintReceipt = async () => {
    await printReceipt(order, "reprint");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
        <View className="w-full max-w-6xl self-center gap-4">
          <Surface className="w-full p-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Typography type="h4" weight="bold" className="font-mono tabular-nums">
                    {order.code}
                  </Typography>
                  <Chip color={statusColor} size="sm" variant="soft">
                    <Chip.Label>{statusLabel}</Chip.Label>
                  </Chip>
                </View>
                <Typography type="body-sm" color="muted">
                  {formatDateTime(order.created_at)}
                </Typography>
              </View>
              <View className="items-end gap-1">
                <Typography type="body-xs" color="muted">
                  Total
                </Typography>
                <Typography type="h4" weight="bold" className="tabular-nums">
                  {formatRupiah(order.total)}
                </Typography>
              </View>
            </View>
          </Surface>

          <View className={isWide ? "flex-row items-start gap-4" : "gap-4"}>
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
                          <Typography type="body-xs" color="muted" className="tabular-nums">
                            {item.qty} x {formatRupiah(item.price)}
                          </Typography>
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

            <View className={isWide ? "w-96 gap-4" : "gap-4"}>
              <View className="gap-2">
                <SectionTitle>Order Information</SectionTitle>
                <Surface className="w-full p-4 gap-3">
                  <DetailRow
                    label="Type"
                    value={order.order_type === "dine-in" ? "Dine-in" : "Takeaway"}
                  />
                  {tableName ? <DetailRow label="Table" value={tableName} /> : null}
                  <DetailRow label="Customer" value={customerName ?? "Walk-in"} />
                </Surface>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between gap-3">
                  <SectionTitle>Payment</SectionTitle>
                  <Chip color={paymentStatusColor} size="sm" variant="soft">
                    <Chip.Label>{paymentStatusLabel}</Chip.Label>
                  </Chip>
                </View>
                <Surface className="w-full p-4 gap-3">
                  <DetailRow label="Method" value={paymentName} />
                  {paymentDetailsRows.map((row) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} />
                  ))}
                  {paymentExpiresAt && !paymentExpired ? (
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
                    <Button
                      variant="danger-soft"
                      onPress={() => updateStatus.mutate({ id: order.id, status: "rejected" })}
                      isDisabled={updateStatus.isPending}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={themeColorDanger} />
                      <Button.Label>Reject</Button.Label>
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
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View className="bg-surface p-4 border-t border-border">
        <Button
          className="w-full max-w-6xl self-center"
          onPress={handlePrintReceipt}
          isDisabled={isPrinting}
        >
          {isPrinting ? (
            <Spinner size="sm" />
          ) : (
            <Ionicons name="print-outline" size={16} color={themeColorForeground} />
          )}
          <Button.Label className="ml-1.5">{isPrinting ? "Printing…" : "Reprint"}</Button.Label>
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

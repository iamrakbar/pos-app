import { useOrder, useUpdateOrderStatus } from "@/hooks/db/use-orders";
import { usePaymentStatus } from "@/hooks/db/use-payment-status";
import { useTables } from "@/hooks/db/use-tables";
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
import LoadingState from "@/components/common/loading-state";
import ErrorState from "@/components/common/error-state";
import Countdown from "@/components/common/countdown";
import QrUrlDisclosure from "@/components/common/qr-url-disclosure";
import ActionDialog from "@/components/common/action-dialog";
import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import { useReceiptPrinter, type PrinterPrompt } from "@/hooks/printer/use-receipt-printer";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/api-error";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "heroui-native-pro";
import { Button, Chip, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useState } from "react";
import Constants from "expo-constants";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getLocaleTag, type TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

function formatDateTime(iso: string, localeTag: string): string {
  const d = new Date(iso);
  return d.toLocaleString(localeTag, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPickupTime(value: string | null | undefined, localeTag: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return date.toLocaleString(localeTag, {
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

function OrderStatusActions({
  status,
  orderId,
  isPending,
  error,
  isSuccess,
  onUpdate,
}: {
  status: string;
  orderId: string;
  isPending: boolean;
  error: unknown;
  isSuccess: boolean;
  onUpdate: (input: { id: string; status: "process" | "completed" }) => void;
}) {
  const { t } = useTranslation();
  if (status !== "new" && status !== "process") return null;

  return (
    <View className="gap-2">
      <SectionTitle>{t("orders.detail.updateStatus")}</SectionTitle>
      <View className="flex-row gap-3">
        <Button
          className="flex-1"
          onPress={() =>
            onUpdate({ id: orderId, status: status === "new" ? "process" : "completed" })
          }
          isDisabled={isPending}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="white" />
          <Button.Label className="ml-1.5">
            {status === "new" ? t("orders.detail.accept") : t("orders.detail.markCompleted")}
          </Button.Label>
        </Button>
      </View>
      {error ? (
        <Typography className="text-xs text-danger">{getErrorMessage(error)}</Typography>
      ) : null}
      {isSuccess ? (
        <Typography className="text-xs text-success">{t("orders.detail.statusUpdated")}</Typography>
      ) : null}
    </View>
  );
}

function PaymentQrDialog({
  isOpen,
  onOpenChange,
  code,
  qrUrl,
  total,
  expiresAt,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  code: string;
  qrUrl: string;
  total: number;
  expiresAt: string | null | undefined;
}) {
  const { t } = useTranslation();
  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("orders.detail.qrisPayment")}
      description={code}
    >
      <Separator />
      <View className="items-center gap-3 p-6">
        <View className="h-64 w-64 items-center justify-center rounded-lg border border-border bg-white">
          <Image source={{ uri: qrUrl }} style={{ width: 240, height: 240 }} contentFit="contain" />
        </View>
        <Typography className="text-base font-semibold text-foreground">
          {formatRupiah(total)}
        </Typography>
        <Countdown
          expiresAt={expiresAt}
          prefix={t("orders.detail.qrValidFor")}
          className="text-xs font-semibold text-warning"
          onExpire={() => onOpenChange(false)}
        />
      </View>
    </AdaptiveFormOverlay>
  );
}

function PrinterPromptDialog({
  prompt,
  onClose,
  onAction,
}: {
  prompt: PrinterPrompt | null;
  onClose: () => void;
  onAction: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  return (
    <ActionDialog
      isOpen={prompt !== null}
      onOpenChange={(open) => !open && onClose()}
      title={prompt?.title}
      description={prompt?.message}
      cancelLabel={prompt?.actionLabel ? t("common.cancel") : t("common.close")}
      actionLabel={prompt?.actionLabel}
      onAction={onAction}
    />
  );
}

function OrderNotFound({ iconColor, onBack }: { iconColor: string; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-center bg-background">
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Ionicons name="receipt-outline" size={20} color={iconColor} />
          </EmptyState.Media>
          <EmptyState.Title>{t("orders.detail.notFound")}</EmptyState.Title>
          <EmptyState.Description>{t("orders.detail.notFoundDescription")}</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button size="sm" variant="outline" onPress={onBack}>
            <Button.Label>{t("common.goBack")}</Button.Label>
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </View>
  );
}

function PrintReceiptToolbar({
  color,
  isPrinting,
  onPrint,
}: {
  color: string;
  isPrinting: boolean;
  onPrint: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        {...getToolbarIcon("printer")}
        tintColor={color}
        accessibilityLabel={
          isPrinting ? t("orders.detail.printingReceipt") : t("orders.detail.printReceipt")
        }
        disabled={isPrinting}
        onPress={onPrint}
      />
    </Stack.Toolbar>
  );
}

function OrderOverview({
  order,
  localeTag,
  isCompact,
  foregroundColor,
  areaName,
  tableName,
  pickupTime,
  customerName,
}: {
  order: App.Data.Merchant.Order.OrderData;
  localeTag: string;
  isCompact: boolean;
  foregroundColor: string;
  areaName: string | null;
  tableName: string | null;
  pickupTime: string | null;
  customerName: string | null;
}) {
  const { t } = useTranslation();
  const orderStatus = getOrderStatus(order.order_status);

  return (
    <>
      <Surface className="w-full p-5">
        <View className={`gap-4 ${isCompact ? "" : "flex-row items-start justify-between"}`}>
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Typography type="h4" weight="bold" className="font-mono tabular-nums">
                {order.code}
              </Typography>
              <Chip color={orderStatus.color} size="sm" variant="soft">
                <Chip.Label>{t(`orders.status.${orderStatus.value}` as TranslationKey)}</Chip.Label>
              </Chip>
            </View>
            <Typography type="body-sm" color="muted">
              {formatDateTime(order.created_at, localeTag)}
            </Typography>
          </View>
          <View className={`${isCompact ? "items-start" : "items-end"} gap-1`}>
            <Typography type="body-xs" color="muted">
              {t("common.total")}
            </Typography>
            <Typography type="h4" weight="bold" className="tabular-nums">
              {formatRupiah(order.total)}
            </Typography>
          </View>
        </View>
      </Surface>

      <View className="gap-2">
        <SectionTitle>{t("orders.detail.orderType")}</SectionTitle>
        <Surface className="w-full p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
              <Ionicons
                name={order.order_type === "dine-in" ? "restaurant-outline" : "bag-handle-outline"}
                size={20}
                color={foregroundColor}
              />
            </View>
            <View className="flex-1 gap-0.5">
              <Typography type="body" weight="semibold">
                {order.order_type === "dine-in" ? t("orders.dineIn") : t("orders.takeaway")}
              </Typography>
              <Typography type="body-xs" color="muted">
                {order.order_type === "dine-in"
                  ? [areaName, tableName].filter(Boolean).join(" · ") ||
                    t("orders.detail.tableNotAssigned")
                  : pickupTime
                    ? t("orders.detail.pickupAt", { time: pickupTime })
                    : t("orders.detail.pickupNotSpecified")}
              </Typography>
            </View>
          </View>
          <DetailRow
            label={t("orders.detail.customer")}
            value={customerName ?? t("orders.detail.walkIn")}
          />
        </Surface>
      </View>
    </>
  );
}

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeColorMuted = useThemeColor("muted");
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);

  if (isLoading) return <LoadingState message={t("orders.detail.loading")} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!order) {
    return <OrderNotFound iconColor={themeColorMuted} onBack={() => router.back()} />;
  }

  return <OrderDetailContent order={order} />;
}

function OrderDetailContent({ order }: { order: App.Data.Merchant.Order.OrderData }) {
  const { locale, t } = useTranslation();
  const localeTag = getLocaleTag(locale);
  const { isCompact } = useResponsiveLayout();
  const navigationTheme = useNavigationTheme();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const themeColorForeground = useThemeColor("foreground");
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const { data: tables } = useTables();
  const paymentStatus = usePaymentStatus(order.id);
  const updateStatus = useUpdateOrderStatus();

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
  const pickupTime = formatPickupTime(order.orderable?.pickup_time, localeTag);
  const items = extractOrderItems(order.products);
  const feeAmount = extractNumber(order.payment_fee);
  const canRefreshPayment = !isCashPayment && !!paymentExpiresAt && !paymentExpired;

  return (
    <>
      <PrintReceiptToolbar
        color={navigationTheme.foreground}
        isPrinting={isPrinting}
        onPrint={() => void printReceipt(order, "reprint")}
      />

      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 pb-10 md:px-6">
          <View className="w-full max-w-3xl self-center gap-5">
            <OrderOverview
              order={order}
              localeTag={localeTag}
              isCompact={isCompact}
              foregroundColor={themeColorForeground}
              areaName={areaName}
              tableName={tableName}
              pickupTime={pickupTime}
              customerName={customerName}
            />

            <View className="gap-5">
              <View className="flex-1 gap-4">
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <SectionTitle>{t("orders.detail.orderItems")}</SectionTitle>
                    <Typography type="body-xs" color="muted">
                      {t(items.length === 1 ? "orders.itemOne" : "orders.itemOther", {
                        count: items.length,
                      })}
                    </Typography>
                  </View>
                  <Surface className="w-full overflow-hidden">
                    {items.map((item, index) => (
                      <View
                        key={`${order.products[index]?.product_id}-${item.name}-${item.subtotal}`}
                        className={`gap-2 px-4 py-3.5 ${index < items.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <View
                          className={`gap-2 ${isCompact ? "" : "flex-row items-start justify-between"}`}
                        >
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
                            {t("orders.detail.note", { note: order.products[index].notes ?? "" })}
                          </Typography>
                        ) : null}
                      </View>
                    ))}
                  </Surface>
                </View>

                {order.notes ? (
                  <View className="gap-2">
                    <SectionTitle>{t("orders.detail.orderNotes")}</SectionTitle>
                    <Surface className="w-full p-4">
                      <Typography type="body-sm">{order.notes}</Typography>
                    </Surface>
                  </View>
                ) : null}
              </View>

              <View className="gap-4">
                <View className="gap-2">
                  <View className="flex-row items-center justify-between gap-3">
                    <SectionTitle>{t("orders.detail.payment")}</SectionTitle>
                    <Chip color={paymentStatusPresentation.color} size="sm" variant="soft">
                      <Chip.Label>
                        {t(
                          `orders.paymentStatus.${paymentStatusPresentation.value}` as TranslationKey
                        )}
                      </Chip.Label>
                    </Chip>
                  </View>
                  <Surface className="w-full p-4 gap-3">
                    <DetailRow label={t("orders.detail.method")} value={paymentName} />
                    {visiblePaymentDetailsRows.map((row) => (
                      <DetailRow key={row.label} label={row.label} value={row.value} />
                    ))}
                    {showQrUrl ? <QrUrlDisclosure url={paymentQrUrl} /> : null}
                    {canRefreshPayment ? (
                      <Countdown
                        expiresAt={paymentExpiresAt}
                        prefix={t("orders.detail.expiresIn")}
                        className="text-sm text-warning font-semibold"
                      />
                    ) : null}
                    {canShowQr ? (
                      <Button variant="outline" onPress={() => setIsQrOpen(true)}>
                        <Ionicons name="qr-code-outline" size={16} color={themeColorForeground} />
                        <Button.Label>{t("orders.detail.showQris")}</Button.Label>
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
                        <Button.Label>{t("orders.detail.refreshStatus")}</Button.Label>
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
                  <SectionTitle>{t("orders.detail.summary")}</SectionTitle>
                  <Surface className="w-full p-4 gap-3">
                    <MoneyRow label={t("common.subtotal")} value={order.subtotal} />
                    {feeAmount > 0 ? (
                      <MoneyRow label={t("orders.detail.paymentFee")} value={feeAmount} />
                    ) : null}
                    <Separator />
                    <MoneyRow label={t("common.total")} value={order.total} emphasized />
                  </Surface>
                </View>

                <OrderStatusActions
                  status={statusCode}
                  orderId={order.id}
                  isPending={updateStatus.isPending}
                  error={updateStatus.isError ? updateStatus.error : null}
                  isSuccess={updateStatus.isSuccess}
                  onUpdate={updateStatus.mutate}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <PaymentQrDialog
          isOpen={isQrOpen && canShowQr}
          onOpenChange={setIsQrOpen}
          code={order.code}
          qrUrl={paymentQrUrl ?? ""}
          total={order.total}
          expiresAt={paymentExpiresAt}
        />
        <PrinterPromptDialog
          prompt={prompt}
          onClose={() => setPrompt(null)}
          onAction={handlePromptAction}
        />
      </View>
    </>
  );
}

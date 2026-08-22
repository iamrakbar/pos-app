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
import { ReceiptPaper } from "@/components/receipt/receipt-paper";
import { useReceiptPrinter, type PrinterPrompt } from "@/hooks/printer/use-receipt-printer";
import { toReceiptData } from "@/services/printer/receipt-data";
import {
  captureReceiptPng,
  ReceiptExportError,
  saveReceiptImage,
  shareReceiptImage,
  type ReceiptExportResult,
} from "@/services/receipt/receipt-export";
import { useReceiptStore } from "@/stores/use-receipt-store";
import { usePrinterStore } from "@/stores/use-printer-store";
import { formatDateTime, formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/api-error";
import AppIcon from "@/components/common/app-icon";
import { EmptyState } from "heroui-native-pro";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  Button,
  Chip,
  Separator,
  Surface,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ActivityIndicator, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useEffect, useRef, useState } from "react";
import type { View as ViewType } from "react-native";
import Constants from "expo-constants";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

function formatPickupTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return formatDateTime(date, {
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
          <AppIcon name="checkmark-circle-outline" size={16} color="white" />
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

function ReceiptPreviewSheet({
  order,
  isOpen,
  onOpenChange,
  onPrint,
}: {
  order: App.Data.Merchant.Order.OrderData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void | Promise<void>;
}) {
  type ReceiptSheetLifecycle = "closed" | "presenting" | "presented" | "dismissing";

  const { t } = useTranslation();
  const { toast } = useToast();
  const receiptSettings = useReceiptStore((state) => state.settings);
  const printerSettings = usePrinterStore((state) => state.settings);
  const themeColorForeground = useThemeColor("foreground");
  const sheetRef = useRef<TrueSheet | null>(null);
  const sheetLifecycle = useRef<ReceiptSheetLifecycle>("closed");
  const receiptRef = useRef<ViewType | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const cachedExport = useRef<{ fingerprint: string; result: ReceiptExportResult } | null>(null);
  const data = toReceiptData(order);
  const paperWidth = printerSettings.paperWidth;
  const columns = printerSettings.charactersPerLine;
  const exportWidth = paperWidth === "80mm" ? 576 : 384;
  const fingerprint = JSON.stringify({
    orderId: order.id,
    settings: receiptSettings,
    paperWidth,
    columns,
    logoWidthDots: printerSettings.logoWidthDots,
  });

  const dismissSheet = () => {
    if (sheetLifecycle.current === "closed" || sheetLifecycle.current === "dismissing") return;
    sheetLifecycle.current = "dismissing";
    void sheetRef.current?.dismiss();
  };

  useEffect(() => {
    if (!isOpen) {
      if (sheetLifecycle.current === "presenting" || sheetLifecycle.current === "presented") {
        dismissSheet();
      }
      return;
    }

    if (sheetLifecycle.current === "presented") {
      void sheetRef.current?.resize(0);
      return;
    }
    if (sheetLifecycle.current !== "closed") return;

    sheetLifecycle.current = "presenting";
    void sheetRef.current?.present(0).catch(() => {
      sheetLifecycle.current = "closed";
      onOpenChange(false);
    });
  }, [isOpen, onOpenChange]);

  const ensureExport = async () => {
    if (cachedExport.current?.fingerprint === fingerprint) return cachedExport.current.result;
    if (!receiptRef.current) throw new Error(t("orders.detail.receiptExportFailed"));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const result = await captureReceiptPng(receiptRef, order.code, exportWidth);
    cachedExport.current = { fingerprint, result };
    return result;
  };

  const runExportAction = async (
    action: (result: ReceiptExportResult) => Promise<void>,
    success: string
  ) => {
    setIsBusy(true);
    try {
      await action(await ensureExport());
      toast.show({ variant: "success", label: success });
    } catch (error) {
      const code = error instanceof ReceiptExportError ? error.code : "CAPTURE_FAILED";
      const key =
        code === "PERMISSION_DENIED"
          ? "orders.detail.receiptPermissionDenied"
          : code === "MEDIA_LIBRARY_UNAVAILABLE"
            ? "orders.detail.receiptSaveUnavailable"
            : code === "SHARING_UNAVAILABLE"
              ? "orders.detail.receiptSharingUnavailable"
              : "orders.detail.receiptExportFailed";
      toast.show({
        variant: "danger",
        label: t(key),
        description: error instanceof Error ? error.message : undefined,
      });
    }
    setIsBusy(false);
  };

  const handlePrint = async () => {
    dismissSheet();
    await onPrint();
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.84, 1]}
      presentation="page"
      maxContentWidth={720}
      scrollable
      grabber
      cornerRadius={24}
      onDidPresent={() => {
        sheetLifecycle.current = "presented";
      }}
      onWillDismiss={() => {
        sheetLifecycle.current = "dismissing";
      }}
      onDidDismiss={() => {
        sheetLifecycle.current = "closed";
        onOpenChange(false);
      }}
      header={
        <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
          <Typography type="h4" weight="semibold">
            {t("orders.detail.previewReceipt")}
          </Typography>
          <Typography type="body-sm" color="muted">
            {order.code}
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="absolute right-3 top-3"
            onPress={dismissSheet}
            accessibilityLabel={t("common.close")}
          >
            <AppIcon name="close-outline" size={20} color={themeColorForeground} />
          </Button>
        </View>
      }
      footer={
        <View className="flex-row gap-2 bg-surface border-t border-border px-4 pb-safe pt-3">
          <Button
            size="sm"
            className="min-w-0 flex-1 px-1"
            variant="outline"
            isDisabled={isBusy}
            onPress={() => void runExportAction(saveReceiptImage, t("orders.detail.receiptSaved"))}
          >
            <AppIcon name="download-outline" size={16} color={themeColorForeground} />
            <Button.Label numberOfLines={1}>{t("common.save")}</Button.Label>
          </Button>
          <Button
            size="sm"
            className="min-w-0 flex-1 px-1"
            variant="outline"
            isDisabled={isBusy}
            onPress={() =>
              void runExportAction(
                (result) => shareReceiptImage(result, order.code),
                t("orders.detail.receiptShared")
              )
            }
          >
            <AppIcon name="share-outline" size={16} color={themeColorForeground} />
            <Button.Label numberOfLines={1}>{t("orders.detail.shareReceipt")}</Button.Label>
          </Button>
          <Button
            size="sm"
            className="min-w-0 flex-1 px-1"
            variant="ghost"
            isDisabled={isBusy}
            onPress={() => void handlePrint()}
          >
            <AppIcon name="print-outline" size={16} color={themeColorForeground} />
            <Button.Label numberOfLines={1}>{t("orders.detail.printReceipt")}</Button.Label>
          </Button>
        </View>
      }
    >
      <ScrollView
        className="flex-1 bg-surface-secondary"
        contentContainerClassName="items-center px-4 py-5"
        showsVerticalScrollIndicator={false}
      >
        <ReceiptPaper
          ref={receiptRef}
          settings={receiptSettings}
          data={data}
          paperWidth={paperWidth}
          charactersPerLine={columns}
          logoWidthDots={printerSettings.logoWidthDots}
        />
      </ScrollView>
    </TrueSheet>
  );
}

function OrderNotFound({ iconColor, onBack }: { iconColor: string; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-center bg-background">
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <AppIcon name="receipt-outline" size={20} color={iconColor} />
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

function OrderOverview({
  order,
  isCompact,
  foregroundColor,
  areaName,
  tableName,
  pickupTime,
  customerName,
}: {
  order: App.Data.Merchant.Order.OrderData;
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
              {formatDateTime(order.created_at)}
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
              <AppIcon
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
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
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
  const pickupTime = formatPickupTime(order.orderable?.pickup_time);
  const items = extractOrderItems(order.products);
  const feeAmount = extractNumber(order.payment_fee);
  const canRefreshPayment = !isCashPayment && !!paymentExpiresAt && !paymentExpired;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="ghost"
              isIconOnly
              onPress={() => setIsReceiptPreviewOpen(true)}
              accessibilityLabel={t("orders.detail.previewReceipt")}
            >
              <AppIcon name="receipt-outline" size={21} color={themeColorForeground} />
            </Button>
          ),
        }}
      />
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 pb-10 md:px-6">
          <View className="w-full max-w-3xl self-center gap-5">
            <OrderOverview
              order={order}
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
                        <AppIcon name="qr-code-outline" size={16} color={themeColorForeground} />
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
                          <AppIcon name="refresh-outline" size={16} color={themeColorForeground} />
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
                    {order.tax && (order.tax.amount ?? 0) > 0 ? (
                      <MoneyRow
                        label={order.tax.name || t("orders.detail.tax")}
                        value={order.tax.amount ?? 0}
                      />
                    ) : null}
                    {order.payment_fee.charged_to_customer && feeAmount > 0 ? (
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

                <Button
                  variant="outline"
                  isDisabled={isPrinting}
                  onPress={() => void printReceipt(order, "reprint")}
                >
                  {isPrinting ? (
                    <ActivityIndicator />
                  ) : (
                    <AppIcon name="print-outline" size={18} color={themeColorForeground} />
                  )}
                  <Button.Label>
                    {isPrinting
                      ? t("orders.detail.printingReceipt")
                      : t("orders.detail.printReceipt")}
                  </Button.Label>
                </Button>
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
        <ReceiptPreviewSheet
          order={order}
          isOpen={isReceiptPreviewOpen}
          onOpenChange={setIsReceiptPreviewOpen}
          onPrint={async () => {
            await printReceipt(order, "reprint");
          }}
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

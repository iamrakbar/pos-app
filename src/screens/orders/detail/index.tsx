import { statusChipVariant } from "@/utils/status-chip-variant";
import {
  Surface,
  Typography,
  Separator,
  Button as PanelDialogButton,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Accordion,
  Button as PanelButton,
  Countdown,
  Dialog as PanelDialog,
  Textarea as PanelTextarea,
  Typography as PanelTypography,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  EmptyState,
  cn,
  Chip as PanelChip,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { useOrder, useUpdateOrderStatus } from "@/hooks/db/use-orders";
import { usePaymentStatus } from "@/hooks/db/use-payment-status";
import { useTables } from "@/hooks/db/use-tables";
import {
  extractPaymentDetailsRows,
  extractPaymentExpiry,
  extractPaymentLink,
  extractPaymentQrUrl,
} from "@/api/mappers/checkout";
import {
  extractCustomerName,
  extractNumber,
  extractOrderItems,
  extractPaymentName,
  extractTableName,
  getOrderStatus,
  getPaymentStatus,
  isPaymentExpired,
  normalizeStatusColor,
} from "@/api/mappers/order";
import { countdownTimestamp, useCountdownLabel } from "@/hooks/use-countdown-label";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
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
import { AppIcons } from "@/components/common/app-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ActivityIndicator, Linking, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useEffect, useRef, useState } from "react";
import type { View as ViewType } from "react-native";
import Constants from "expo-constants";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { useAuth } from "@/stores/use-auth";
import { hasMerchantFeature } from "@/utils/merchant-features";

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
      <Typography type="body-sm" muted>
        {label}
      </Typography>
      <Typography type="body-sm" weight="medium" className="flex-1" align="right">
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
        muted={!emphasized}
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

function OrderCancelAction({
  status,
  orderId,
  isPending,
  error,
  canCancel,
  onUpdate,
}: {
  status: string;
  orderId: string;
  isPending: boolean;
  error: unknown;
  canCancel: boolean;
  onUpdate: (input: {
    id: string;
    status: "completed" | "cancelled";
    reason?: string | null;
  }) => void;
}) {
  const { t } = useTranslation();
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelReasonInvalid, setIsCancelReasonInvalid] = useState(false);
  const themeColorDanger = useCSSVariable("--color-destructive") as string;
  if (status !== "open" || !canCancel) return null;

  const handleCancel = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setIsCancelReasonInvalid(true);
      return;
    }

    onUpdate({ id: orderId, status: "cancelled", reason });
    setIsCancelOpen(false);
    setCancelReason("");
    setIsCancelReasonInvalid(false);
  };

  return (
    <View className="flex-1 gap-2">
      <PanelButton
        variant="destructive"
        className="w-full"
        onPress={() => setIsCancelOpen(true)}
        disabled={isPending}
      >
        <AppIcon icon={AppIcons.closeCircle} size={16} color={themeColorDanger} />
        {t("orders.detail.cancelOrder")}
      </PanelButton>
      {error ? (
        <Typography className="text-destructive" type="body-xs">
          {getErrorMessage(error)}
        </Typography>
      ) : null}
      <PanelDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("orders.detail.cancelOrder")}</PanelDialog.Title>
          <PanelDialog.Description>
            {t("orders.detail.cancelOrderDescription")}
          </PanelDialog.Description>
          <PanelTextarea
            label={t("orders.detail.cancellationReason")}
            value={cancelReason}
            onChangeText={(value) => {
              setCancelReason(value);
              if (value.trim()) setIsCancelReasonInvalid(false);
            }}
            placeholder={t("orders.detail.cancelReasonPrompt")}
            rows={3}
            isRequired
            errorMessage={
              isCancelReasonInvalid ? t("orders.detail.cancelReasonRequired") : undefined
            }
          />
          <PanelDialog.Footer>
            <PanelDialog.Close>
              <PanelButton variant="ghost" size="sm">
                {t("common.cancel")}
              </PanelButton>
            </PanelDialog.Close>
            <PanelButton variant="destructive" size="sm" onPress={handleCancel}>
              {t("orders.detail.cancelOrder")}
            </PanelButton>
          </PanelDialog.Footer>
        </PanelDialog.Content>
      </PanelDialog>
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
  const target = countdownTimestamp(expiresAt);
  const countdownLabel = useCountdownLabel(target, t("orders.detail.qrValidFor"));
  const { isPhonePortrait, sheetRef, handleDidDismiss } = useAdaptiveOverlayPresentation(
    isOpen,
    onOpenChange
  );

  const content = (
    <>
      <Separator />
      <View className="items-center gap-3 p-6">
        <View className="h-64 w-64 items-center justify-center rounded-lg border border-border bg-white">
          <Image source={{ uri: qrUrl }} style={{ width: 240, height: 240 }} contentFit="contain" />
        </View>
        <Typography type="body" weight="semibold">
          {formatRupiah(total)}
        </Typography>
        {target !== null ? (
          <View className="flex-row items-center gap-1">
            <PanelTypography
              type="body-xs"
              weight="semibold"
              className="text-warning"
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {t("orders.detail.qrValidFor")}
            </PanelTypography>
            <Countdown
              to={target}
              variant="inline"
              size="sm"
              units={["hours", "minutes", "seconds"]}
              onComplete={() => onOpenChange(false)}
              {...countdownLabel}
            />
          </View>
        ) : null}
      </View>
    </>
  );

  if (isPhonePortrait) {
    return (
      <TrueSheet
        ref={sheetRef}
        detents={[0.9]}
        scrollable
        cornerRadius={24}
        grabber
        dimmed
        onDidDismiss={handleDidDismiss}
        header={
          <View className="bg-surface gap-2 px-6 pb-5 pr-16 pt-8">
            <Typography type="h4" weight="semibold">
              {t("orders.detail.qrisPayment")}
            </Typography>
            <Typography type="body-sm" muted>
              {code}
            </Typography>
            <PanelButton
              variant="ghost"
              size="icon"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3"
              onPress={() => onOpenChange(false)}
            >
              <AppIcon icon={AppIcons.close} size={20} />
            </PanelButton>
          </View>
        }
      >
        {content}
      </TrueSheet>
    );
  }

  return (
    <PanelDialog open={isOpen} onOpenChange={onOpenChange}>
      <PanelDialog.Content
        dismissible={false}
        className="w-full max-w-md self-center overflow-hidden p-0"
      >
        <PanelButton
          variant="ghost"
          size="icon"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => onOpenChange(false)}
        >
          <AppIcon icon={AppIcons.close} size={20} />
        </PanelButton>
        <View className="gap-2 px-6 pb-5 pr-16 pt-8">
          <PanelDialog.Title>{t("orders.detail.qrisPayment")}</PanelDialog.Title>
          <PanelDialog.Description>{code}</PanelDialog.Description>
        </View>
        {content}
      </PanelDialog.Content>
    </PanelDialog>
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
    <PanelDialog open={prompt !== null} onOpenChange={(open) => !open && onClose()}>
      <PanelDialog.Content className="w-full max-w-md self-center">
        <PanelDialog.Title>{prompt?.title}</PanelDialog.Title>
        {prompt?.message ? (
          <PanelDialog.Description>{prompt.message}</PanelDialog.Description>
        ) : null}
        <PanelDialog.Footer>
          <PanelDialogButton variant="ghost" size="sm" onPress={onClose}>
            {prompt?.actionLabel ? t("common.cancel") : t("common.close")}
          </PanelDialogButton>
          {prompt?.actionLabel ? (
            <PanelDialogButton size="sm" className="flex-1" onPress={() => void onAction()}>
              {prompt.actionLabel}
            </PanelDialogButton>
          ) : null}
        </PanelDialog.Footer>
      </PanelDialog.Content>
    </PanelDialog>
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
  const themeColorForeground = useCSSVariable("--color-foreground") as string;
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
        variant: "destructive",
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
        <View className="bg-surface gap-2 px-6 pb-5 pr-16 pt-8">
          <Typography type="h4" weight="semibold">
            {t("orders.detail.previewReceipt")}
          </Typography>
          <Typography type="body-sm" muted>
            {order.code}
          </Typography>
          <PanelButton
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3"
            onPress={dismissSheet}
            accessibilityLabel={t("common.close")}
          >
            <AppIcon icon={AppIcons.close} size={20} color={themeColorForeground} />
          </PanelButton>
        </View>
      }
      footer={
        <View className="flex-row gap-2 bg-surface border-t border-border px-4 pb-safe pt-3">
          <PanelButton
            size="sm"
            className="min-w-0 flex-1 px-1"
            variant="outline"
            disabled={isBusy}
            onPress={() => void runExportAction(saveReceiptImage, t("orders.detail.receiptSaved"))}
          >
            <AppIcon icon={AppIcons.download} size={16} color={themeColorForeground} />
            {t("common.save")}
          </PanelButton>
          <PanelButton
            size="sm"
            className="min-w-0 flex-1 px-1"
            variant="outline"
            disabled={isBusy}
            onPress={() =>
              void runExportAction(
                (result) => shareReceiptImage(result, order.code),
                t("orders.detail.receiptShared")
              )
            }
          >
            <AppIcon icon={AppIcons.share} size={16} color={themeColorForeground} />
            {t("orders.detail.shareReceipt")}
          </PanelButton>
          <PanelButton
            size="sm"
            className="min-w-0 flex-1 px-1"
            variant="outline"
            disabled={isBusy}
            onPress={() => void handlePrint()}
          >
            <AppIcon icon={AppIcons.print} size={16} color={themeColorForeground} />
            {t("orders.detail.printReceipt")}
          </PanelButton>
        </View>
      }
    >
      <ScrollView
        className="flex-1 bg-surface-secondary"
        contentContainerClassName="items-center px-4 pt-5 pb-17"
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
            <AppIcon icon={AppIcons.receipt} size={20} color={iconColor} />
          </EmptyState.Media>
          <EmptyState.Title>{t("orders.detail.notFound")}</EmptyState.Title>
          <EmptyState.Description>{t("orders.detail.notFoundDescription")}</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <PanelButton size="sm" variant="outline" onPress={onBack}>
            {t("common.goBack")}
          </PanelButton>
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
        <View className={cn("gap-4", !isCompact && "flex-row items-start justify-between")}>
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Typography type="h4" weight="bold" className="font-mono tabular-nums">
                {order.code}
              </Typography>
              <PanelChip variant={statusChipVariant(orderStatus.color)} size="sm">
                <PanelChip.Label>
                  {t(`orders.status.${orderStatus.value}` as TranslationKey)}
                </PanelChip.Label>
              </PanelChip>
            </View>
            <Typography type="body-sm" muted>
              {formatDateTime(order.created_at)}
            </Typography>
            {order.cancellation_reason_code ? (
              <Typography type="body-xs" muted>
                {t("orders.detail.cancellationReason")}:{" "}
                {t(
                  `orders.cancellationReasons.${order.cancellation_reason_code}` as TranslationKey
                )}
              </Typography>
            ) : null}
          </View>
          <View className={cn("gap-1", isCompact ? "items-start" : "items-end")}>
            <Typography type="body-xs" muted>
              {t("common.total")}
            </Typography>
            <Typography type="h4" weight="bold" className="tabular-nums">
              {formatRupiah(order.total)}
            </Typography>
          </View>
        </View>
      </Surface>

      <View className="gap-2">
        <OrderTypePanel
          order={order}
          foregroundColor={foregroundColor}
          areaName={areaName}
          tableName={tableName}
          pickupTime={pickupTime}
          customerName={customerName}
        />
      </View>
    </>
  );
}

function OrderTypePanel({
  order,
  foregroundColor,
  areaName,
  tableName,
  pickupTime,
  customerName,
}: {
  order: App.Data.Merchant.Order.OrderData;
  foregroundColor: string;
  areaName: string | null;
  tableName: string | null;
  pickupTime: string | null;
  customerName: string | null;
}) {
  const { t } = useTranslation();
  const iconName =
    order.order_type === "dine-in"
      ? AppIcons.restaurant
      : order.order_type === "delivery"
        ? AppIcons.bicycle
        : AppIcons.bag;
  const orderTypeLabel =
    order.order_type === "dine-in"
      ? t("orders.dineIn")
      : order.order_type === "delivery"
        ? t("orders.delivery")
        : t("orders.takeaway");
  const orderTypeDescription =
    order.order_type === "dine-in"
      ? [areaName, tableName].filter(Boolean).join(" · ") || t("orders.detail.tableNotAssigned")
      : order.order_type === "delivery"
        ? (order.orderable?.address?.address ?? t("orders.detail.deliveryAddressNotSet"))
        : pickupTime
          ? t("orders.detail.pickupAt", { time: pickupTime })
          : t("orders.detail.pickupNotSpecified");

  return (
    <>
      <SectionTitle>{t("orders.detail.orderType")}</SectionTitle>
      <Surface className="w-full p-4 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
            <AppIcon icon={iconName} size={20} color={foregroundColor} />
          </View>
          <View className="flex-1 gap-0.5">
            <Typography type="body" weight="semibold">
              {orderTypeLabel}
            </Typography>
            <Typography type="body-xs" muted>
              {orderTypeDescription}
            </Typography>
          </View>
        </View>
        <DetailRow
          label={t("orders.detail.customer")}
          value={customerName ?? t("orders.detail.walkIn")}
        />
      </Surface>
    </>
  );
}

function DeliveryPanel({ orderable }: { orderable: App.Data.Merchant.Order.OrderOrderableData }) {
  const { t } = useTranslation();
  const tracking = orderable.tracking_status;
  const courier = orderable.courier;
  const address = orderable.address;
  const courierLabel = courier ? [courier.name, courier.service].filter(Boolean).join(" · ") : null;
  const addressLabel = address ? [address.address, address.city].filter(Boolean).join(", ") : null;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <SectionTitle>{t("orders.detail.delivery")}</SectionTitle>
        {tracking ? (
          <PanelChip variant={statusChipVariant(normalizeStatusColor(tracking))} size="sm">
            <PanelChip.Label>{tracking.label}</PanelChip.Label>
          </PanelChip>
        ) : null}
      </View>
      <Surface className="w-full p-4 gap-3">
        {courierLabel ? (
          <DetailRow label={t("orders.detail.courier")} value={courierLabel} />
        ) : null}
        {addressLabel ? (
          <DetailRow label={t("orders.detail.deliveryAddress")} value={addressLabel} />
        ) : null}
        {orderable.waybill_id ? (
          <DetailRow label={t("orders.detail.waybill")} value={orderable.waybill_id} />
        ) : null}
        {!tracking ? (
          <Typography type="body-xs" muted>
            {t("orders.detail.deliveryNotDispatched")}
          </Typography>
        ) : null}
      </Surface>
    </View>
  );
}

function OrderItemsPanel({
  order,
  isCompact,
}: {
  order: App.Data.Merchant.Order.OrderData;
  isCompact: boolean;
}) {
  const { t } = useTranslation();
  const items = extractOrderItems(order.products);

  return (
    <View className="flex-1 gap-4">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <SectionTitle>{t("orders.detail.orderItems")}</SectionTitle>
          <Typography type="body-xs" muted>
            {t(items.length === 1 ? "orders.itemOne" : "orders.itemOther", {
              count: items.length,
            })}
          </Typography>
        </View>
        <Surface className="w-full overflow-hidden">
          {items.map((item, index) => (
            <View
              key={`${order.products[index]?.product_id}-${item.name}-${item.subtotal}`}
              className={cn(
                "gap-2 px-4 py-3.5",
                index < items.length - 1 && "border-b border-border"
              )}
            >
              <View className={cn("gap-2", !isCompact && "flex-row items-start justify-between")}>
                <View className="flex-1 gap-0.5">
                  <Typography type="body-sm" weight="semibold">
                    {item.name}
                  </Typography>
                  <View className="flex-row items-center gap-1.5">
                    <Typography type="body-xs" muted className="tabular-nums">
                      {item.qty} x {formatRupiah(item.price)}
                    </Typography>
                    {item.originalPrice !== null ? (
                      <Typography type="body-xs" muted className="tabular-nums" strike>
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
                    <Typography type="body-xs" muted className="flex-1">
                      + {addOn.name}: {option.name}
                    </Typography>
                    {option.price > 0 ? (
                      <Typography type="body-xs" muted className="tabular-nums">
                        {formatRupiah(option.price)}
                      </Typography>
                    ) : null}
                  </View>
                ))
              )}
              {order.products[index]?.notes ? (
                <Typography type="body-xs" muted italic>
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
  );
}

function OrderPaymentDetails({
  paymentStatus,
  paymentData,
  foregroundColor,
  onOpenQr,
  onPaymentExpire,
}: {
  paymentStatus: ReturnType<typeof usePaymentStatus>;
  paymentData: ReturnType<typeof getOrderPaymentColumnData>;
  foregroundColor: string;
  onOpenQr: () => void;
  onPaymentExpire: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    paymentName,
    visiblePaymentDetailsRows,
    showQrUrl,
    paymentQrUrl,
    paymentLink,
    isPaymentPaid,
    isQrisPayment,
    hasQrImageUrl,
    canRefreshPayment,
    paymentExpiresAt,
    canShowQr,
    paymentExpired,
  } = paymentData;
  const target = countdownTimestamp(paymentExpiresAt);
  const countdownLabel = useCountdownLabel(target, t("orders.detail.expiresIn"));

  return (
    <Surface className="w-full p-4 gap-3">
      <DetailRow label={t("orders.detail.method")} value={paymentName} />
      {visiblePaymentDetailsRows.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
      {showQrUrl ? (
        <Accordion hideSeparator className="rounded-lg bg-secondary px-3">
          <Accordion.Item value="qr-image-url">
            <Accordion.Trigger className="py-2.5">
              <PanelTypography type="body-xs" weight="semibold" muted className="flex-1">
                {t("payment.qrImageUrl")}
              </PanelTypography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="pb-3">
              <PanelTypography selectable type="body-xs">
                {paymentQrUrl ?? ""}
              </PanelTypography>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      ) : null}
      <OrderPaymentQrPanel
        isVisible={!isPaymentPaid && !paymentExpired && isQrisPayment}
        paymentQrUrl={paymentQrUrl}
        paymentLink={paymentLink}
        hasQrImageUrl={hasQrImageUrl}
        foregroundColor={foregroundColor}
      />
      {canRefreshPayment && target !== null ? (
        <View className="flex-row items-center gap-1">
          <PanelTypography
            type="body-sm"
            weight="semibold"
            className="text-warning"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {t("orders.detail.expiresIn")}
          </PanelTypography>
          <Countdown
            to={target}
            variant="inline"
            size="sm"
            units={["hours", "minutes", "seconds"]}
            onComplete={onPaymentExpire}
            {...countdownLabel}
          />
        </View>
      ) : null}
      {canShowQr ? (
        <PanelButton variant="outline" onPress={onOpenQr}>
          <AppIcon icon={AppIcons.qrCode} size={16} color={foregroundColor} />
          {t("orders.detail.showQris")}
        </PanelButton>
      ) : null}
      <OrderPaymentRefresh
        isVisible={canRefreshPayment}
        isPending={paymentStatus.isPending}
        isError={paymentStatus.isError}
        error={paymentStatus.error}
        foregroundColor={foregroundColor}
        onRefresh={() => paymentStatus.mutate()}
      />
    </Surface>
  );
}

function OrderPaymentQrPanel({
  isVisible,
  paymentQrUrl,
  paymentLink,
  hasQrImageUrl,
  foregroundColor,
}: {
  isVisible: boolean;
  paymentQrUrl: string | null;
  paymentLink: string | null;
  hasQrImageUrl: boolean;
  foregroundColor: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!isVisible || (!paymentQrUrl && !paymentLink)) return null;

  return (
    <View className="gap-3 rounded-2xl bg-surface-secondary p-3">
      {paymentQrUrl && hasQrImageUrl ? (
        <View className="items-center gap-2">
          <Typography type="body-sm" weight="semibold" className="self-start">
            {t("orders.detail.qrisCode")}
          </Typography>
          <View className="rounded-xl bg-white p-3">
            <Image
              source={{ uri: paymentQrUrl }}
              style={{ width: 220, height: 220 }}
              contentFit="contain"
              accessibilityLabel={t("orders.detail.qrisCode")}
            />
          </View>
        </View>
      ) : null}
      {paymentLink && /^https?:\/\//i.test(paymentLink) ? (
        <PanelButton variant="outline" onPress={() => void Linking.openURL(paymentLink)}>
          <AppIcon icon={AppIcons.open} size={16} color={foregroundColor} />
          {t("orders.detail.openPaymentLink")}
        </PanelButton>
      ) : null}
      {paymentLink && !hasQrImageUrl ? (
        <Accordion hideSeparator className="rounded-lg bg-secondary px-3">
          <Accordion.Item value="qr-image-url">
            <Accordion.Trigger className="py-2.5">
              <PanelTypography type="body-xs" weight="semibold" muted className="flex-1">
                {t("payment.qrImageUrl")}
              </PanelTypography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="pb-3">
              <PanelTypography selectable type="body-xs">
                {paymentLink}
              </PanelTypography>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      ) : null}
    </View>
  );
}

function OrderPaymentRefresh({
  isVisible,
  isPending,
  isError,
  error,
  foregroundColor,
  onRefresh,
}: {
  isVisible: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  foregroundColor: string;
  onRefresh: () => void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!isVisible)
    return isError ? (
      <Typography type="body-xs" className="text-destructive">
        {getErrorMessage(error)}
      </Typography>
    ) : null;

  return (
    <>
      <PanelButton variant="ghost" onPress={onRefresh} disabled={isPending}>
        {isPending ? (
          <ActivityIndicator />
        ) : (
          <AppIcon icon={AppIcons.refresh} size={16} color={foregroundColor} />
        )}
        {t("orders.detail.refreshStatus")}
      </PanelButton>
      {isError ? (
        <Typography type="body-xs" className="text-destructive">
          {getErrorMessage(error)}
        </Typography>
      ) : null}
    </>
  );
}

function OrderPaymentSummary({
  order,
  feeAmount,
}: {
  order: App.Data.Merchant.Order.OrderData;
  feeAmount: number;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
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
  );
}

function getOrderPaymentColumnData(
  order: App.Data.Merchant.Order.OrderData,
  expiredPaymentAt: string | null = null
) {
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
  const paymentLink =
    extractPaymentLink({ payment_details: order.payment_details, payment: order.payment }) ??
    paymentQrUrl;
  const isPaymentPaid = order.payment_status.is_successful;
  const effectivePaymentExpired = isPaymentExpired(
    order.payment_status,
    paymentExpiresAt,
    paymentExpiresAt !== null && paymentExpiresAt === expiredPaymentAt
  );
  const paymentStatusPresentation = getPaymentStatus(order.payment_status, {
    expiresAt: paymentExpiresAt,
    forceExpired: paymentExpiresAt !== null && paymentExpiresAt === expiredPaymentAt,
  });
  const buildVariant = Constants.expoConfig?.extra?.buildVariant;
  const hasQrImageUrl = !!paymentQrUrl && /^https?:\/\//i.test(paymentQrUrl);
  const showQrUrl =
    !isPaymentPaid &&
    !effectivePaymentExpired &&
    (buildVariant === "development" || buildVariant === "preview") &&
    hasQrImageUrl &&
    isQrisPayment;
  const visiblePaymentDetailsRows = paymentDetailsRows.filter(
    (row) => !hasQrImageUrl || row.value !== paymentQrUrl
  );
  const canShowQr = !isPaymentPaid && !!paymentQrUrl && !effectivePaymentExpired && isQrisPayment;
  const feeAmount = extractNumber(order.payment_fee);
  const canRefreshPayment =
    !isPaymentPaid && !isCashPayment && !!paymentExpiresAt && !effectivePaymentExpired;

  return {
    paymentStatusPresentation,
    paymentName,
    paymentQrUrl,
    paymentLink,
    isPaymentPaid,
    isQrisPayment,
    hasQrImageUrl,
    showQrUrl,
    visiblePaymentDetailsRows,
    paymentExpiresAt,
    paymentExpired: effectivePaymentExpired,
    canShowQr,
    feeAmount,
    canRefreshPayment,
  };
}

function OrderPaymentColumn({
  order,
  foregroundColor,
  isPrinting,
  onPrint,
}: {
  order: App.Data.Merchant.Order.OrderData;
  foregroundColor: string;
  isPrinting: boolean;
  onPrint: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [expiredPaymentAt, setExpiredPaymentAt] = useState<string | null>(null);
  const paymentStatus = usePaymentStatus(order.id);
  const updateStatus = useUpdateOrderStatus();
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const canCancel = hasMerchantFeature(activeMerchant?.features, "cancellation");
  const paymentData = getOrderPaymentColumnData(order, expiredPaymentAt);

  return (
    <>
      <View className="gap-4">
        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <SectionTitle>{t("orders.detail.payment")}</SectionTitle>
            <PanelChip
              variant={statusChipVariant(paymentData.paymentStatusPresentation.color)}
              size="sm"
            >
              <PanelChip.Label>
                {t(
                  `orders.paymentStatus.${paymentData.paymentStatusPresentation.value}` as TranslationKey
                )}
              </PanelChip.Label>
            </PanelChip>
          </View>
          <OrderPaymentDetails
            paymentStatus={paymentStatus}
            paymentData={paymentData}
            foregroundColor={foregroundColor}
            onOpenQr={() => setIsQrOpen(true)}
            onPaymentExpire={() => {
              if (paymentData.paymentExpiresAt) setExpiredPaymentAt(paymentData.paymentExpiresAt);
            }}
          />
        </View>

        {order.order_type === "delivery" && order.orderable ? (
          <DeliveryPanel orderable={order.orderable} />
        ) : null}

        <OrderPaymentSummary order={order} feeAmount={paymentData.feeAmount} />

        <View className="flex-row gap-3">
          <OrderCancelAction
            status={getOrderStatus(order.order_status).value}
            orderId={order.id}
            isPending={updateStatus.isPending}
            error={updateStatus.isError ? updateStatus.error : null}
            canCancel={canCancel}
            onUpdate={updateStatus.mutate}
          />
          <PanelButton
            variant="outline"
            className="flex-1"
            disabled={isPrinting}
            onPress={() => void onPrint()}
          >
            {isPrinting ? (
              <ActivityIndicator />
            ) : (
              <AppIcon icon={AppIcons.print} size={18} color={foregroundColor} />
            )}
            {isPrinting ? t("orders.detail.printingReceipt") : t("orders.detail.printReceipt")}
          </PanelButton>
        </View>
      </View>

      <PaymentQrDialog
        isOpen={isQrOpen && paymentData.canShowQr}
        onOpenChange={setIsQrOpen}
        code={order.code}
        qrUrl={paymentData.paymentQrUrl ?? ""}
        total={order.total}
        expiresAt={paymentData.paymentExpiresAt}
      />
    </>
  );
}

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);

  if (isLoading)
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("orders.detail.loading")}
        </PanelLoadingText>
      </View>
    );
  if (isError)
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>{getErrorMessage(error)}</PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  if (!order) {
    return <OrderNotFound iconColor={themeColorMuted} onBack={() => router.back()} />;
  }

  return <OrderDetailContent order={order} />;
}

function OrderDetailContent({ order }: { order: App.Data.Merchant.Order.OrderData }) {
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const themeColorForeground = useCSSVariable("--color-foreground") as string;
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const { data: tables } = useTables();
  const customerName = extractCustomerName(order.customer);
  const tableName = extractTableName(order.orderable);
  const orderAreaName =
    order.orderable && "area_name" in order.orderable
      ? String((order.orderable as unknown as Record<string, unknown>).area_name ?? "") || null
      : null;
  const matchedTable = tables?.find((table) => table.id === order.orderable?.table_id);
  const areaName = orderAreaName ?? matchedTable?.area_name ?? null;
  const pickupTime = formatPickupTime(order.orderable?.pickup_time);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PanelButton
              variant="ghost"
              onPress={() => setIsReceiptPreviewOpen(true)}
              accessibilityLabel={t("orders.detail.previewReceipt")}
            >
              <AppIcon icon={AppIcons.receipt} size={21} color={themeColorForeground} />
            </PanelButton>
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
              <OrderItemsPanel order={order} isCompact={isCompact} />
              <OrderPaymentColumn
                order={order}
                foregroundColor={themeColorForeground}
                isPrinting={isPrinting}
                onPrint={() => {
                  void printReceipt(order, "reprint");
                }}
              />
            </View>
          </View>
        </ScrollView>
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

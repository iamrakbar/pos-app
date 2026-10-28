import {
  Surface,
  Typography,
  Separator,
  Button as PanelDialogButton,
  Dialog,
  Accordion,
  Countdown,
  Typography as PanelTypography,
  useToast,
  Card,
  cn,
  Chip as PanelChip,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { usePOSStore } from "@/stores/use-pos-store";
import { usePaymentStatus } from "@/hooks/db/use-payment-status";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/api-error";
import { isExpired } from "@/api/mappers/checkout";
import { getPaymentStatus } from "@/api/mappers/order";
import { countdownTimestamp, useCountdownLabel } from "@/hooks/use-countdown-label";
import { statusChipVariant } from "@/utils/status-chip-variant";
import type { JSX } from "react";
import { useRef, useState } from "react";
import { Image } from "expo-image";
import { ActivityIndicator, ScrollView, View } from "react-native";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import Constants from "expo-constants";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";
import type { StatusPresentation } from "@/api/mappers/order";

type PaymentContentProps = {
  onClose?: () => void;
  onPaymentSuccess?: () => void;
};

function getLocalizedPaymentStatus(status: StatusPresentation, t: Translate): string {
  if (["pending", "unpaid"].includes(status.value)) return t("payment.statusPending");
  if (["settlement", "capture", "paid", "success"].includes(status.value))
    return t("payment.statusPaid");
  if (["authorize", "authorized"].includes(status.value)) return t("payment.statusAuthorized");
  if (["refund", "refunded"].includes(status.value)) return t("payment.statusRefunded");
  if (status.value === "partial_refund") return t("payment.statusPartiallyRefunded");
  if (["deny", "denied"].includes(status.value)) return t("payment.statusDenied");
  if (["cancel", "cancelled", "canceled"].includes(status.value))
    return t("payment.statusCancelled");
  if (["expire", "expired"].includes(status.value)) return t("payment.statusExpired");
  if (["failure", "failed"].includes(status.value)) return t("payment.statusFailed");
  return status.label;
}

function getPaymentContentStatus(
  paymentStatus: ReturnType<typeof usePaymentStatus>,
  sessionExpired: boolean,
  t: Translate
): { label: string; color: StatusPresentation["color"] } {
  const apiPaymentStatus = paymentStatus.isSuccess
    ? getPaymentStatus(paymentStatus.data.payment_status)
    : null;

  if (paymentStatus.isPending) return { label: t("payment.checking"), color: "warning" };
  if (paymentStatus.isError) return { label: t("payment.checkFailed"), color: "danger" };
  if (paymentStatus.isSuccess && paymentStatus.data.is_successful) {
    return {
      label: apiPaymentStatus
        ? getLocalizedPaymentStatus(apiPaymentStatus, t)
        : t("payment.confirmed"),
      color: apiPaymentStatus?.color ?? "success",
    };
  }
  if (sessionExpired) return { label: t("payment.expired"), color: "danger" };
  return {
    label: apiPaymentStatus ? getLocalizedPaymentStatus(apiPaymentStatus, t) : t("payment.waiting"),
    color: apiPaymentStatus?.color ?? "warning",
  };
}

type PaymentSessionData = NonNullable<ReturnType<typeof usePOSStore.getState>["paymentSession"]>;
type PaymentStatusView = { label: string; color: StatusPresentation["color"] };

function PaymentQrPanel({
  paymentSession,
  isWide,
  canShowQr,
  sessionExpired,
  showQrUrl,
  themeColorMuted,
  onExpire,
}: {
  paymentSession: PaymentSessionData;
  isWide: boolean;
  canShowQr: boolean;
  sessionExpired: boolean;
  showQrUrl: boolean;
  themeColorMuted: string;
  onExpire: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const target = countdownTimestamp(paymentSession.expires_at);
  const countdownLabel = useCountdownLabel(target, t("payment.timeRemaining"));

  return (
    <Surface
      variant="secondary"
      className={isWide ? "flex-1 items-center gap-5 p-6" : "w-full items-center gap-5 p-5"}
    >
      <View className="w-full flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography type="body-sm" weight="semibold">
            {t("payment.scanTitle")}
          </Typography>
          <Typography type="body-xs" muted>
            {t("payment.scanInstruction")}
          </Typography>
        </View>
        <AppIcon icon={AppIcons.qrCode} size={22} color={themeColorMuted} />
      </View>

      {canShowQr ? (
        <View
          className={cn(
            "items-center justify-center rounded-xl border border-border bg-white",
            isWide ? "h-72 w-72" : "h-64 w-64"
          )}
        >
          <Image
            source={{ uri: paymentSession.qr_url! }}
            style={{ width: isWide ? 256 : 224, height: isWide ? 256 : 224 }}
            contentFit="contain"
          />
        </View>
      ) : (
        <View
          className={cn(
            "items-center justify-center rounded-xl bg-surface px-6",
            isWide ? "h-72 w-72" : "h-64 w-64"
          )}
        >
          <Typography type="body-sm" muted className="mt-3" align="center">
            {sessionExpired ? t("payment.qrExpired") : t("payment.qrUnavailable")}
          </Typography>
        </View>
      )}

      {canShowQr && target !== null ? (
        <View className="flex-row items-center gap-2 rounded-full bg-warning/10 px-3 py-1">
          <PanelTypography
            type="body-sm"
            weight="semibold"
            className="text-warning"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {t("payment.timeRemaining")}
          </PanelTypography>
          <Countdown
            to={target}
            variant="inline"
            size="sm"
            units={["hours", "minutes", "seconds"]}
            onComplete={onExpire}
            {...countdownLabel}
          />
        </View>
      ) : null}
    </Surface>
  );
}

function PaymentInfoPanel({
  paymentSession,
  isWide,
  paymentStatus,
  status,
  paymentDetails,
  showQrUrl,
}: {
  paymentSession: PaymentSessionData;
  isWide: boolean;
  paymentStatus: ReturnType<typeof usePaymentStatus>;
  status: PaymentStatusView;
  paymentDetails: App.Data.Merchant.Order.OrderPaymentDetailsData | undefined;
  showQrUrl: boolean;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <View className={isWide ? "flex-1 gap-5" : "w-full gap-5"}>
      <Surface className={cn("gap-5 p-5", isWide && "flex-1 h-full")}>
        <View className="gap-1">
          <Typography type="body-sm" muted>
            {t("payment.total")}
          </Typography>
          <Typography type="h2" weight="bold" className="tabular-nums">
            {formatRupiah(paymentSession.amount)}
          </Typography>
        </View>
        <Separator />
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Typography type="body-sm" muted>
              {t("payment.status")}
            </Typography>
            <PanelChip variant={statusChipVariant(status.color)} size="sm">
              <PanelChip.Label>{status.label}</PanelChip.Label>
            </PanelChip>
          </View>
          <View className="flex-row items-start justify-between gap-4">
            <Typography type="body-sm" muted>
              {t("payment.method")}
            </Typography>
            <Typography type="body-sm" weight="semibold" className="flex-1" align="right">
              {paymentSession.payment_type}
            </Typography>
          </View>
          <View className="flex-row items-start justify-between gap-4">
            <Typography type="body-sm" muted>
              {t("payment.transaction")}
            </Typography>
            <Typography type="body-xs" weight="semibold" className="flex-1 font-mono" align="right">
              {paymentSession.transaction_id}
            </Typography>
          </View>
          {paymentSession.reference ? (
            <View className="flex-row items-start justify-between gap-4">
              <Typography type="body-sm" muted>
                {t("payment.reference")}
              </Typography>
              <Typography
                type="body-xs"
                weight="semibold"
                className="flex-1 font-mono"
                align="right"
              >
                {paymentSession.reference}
              </Typography>
            </View>
          ) : null}
        </View>
        {paymentStatus.isError ? (
          <Typography type="body-xs" className="text-destructive">
            {getErrorMessage(paymentStatus.error)}
          </Typography>
        ) : null}
      </Surface>
      {paymentDetails?.code || paymentDetails?.extra ? (
        <Card className="gap-2 p-4">
          <Card.Header className="p-0">
            <Typography type="body-sm" weight="semibold">
              {t("payment.details")}
            </Typography>
          </Card.Header>
          <Card.Content className="p-0">
            {paymentDetails.code ? (
              <Surface variant="secondary">
                <Typography type="body-xs" muted>
                  {t("payment.code")}
                </Typography>
                <Typography type="body-xs" weight="semibold" className="font-mono" selectable>
                  {paymentDetails.code}
                </Typography>
              </Surface>
            ) : null}
          </Card.Content>
          {paymentDetails.extra ? (
            <Card.Footer className="p-0">
              <Typography type="body-xs" selectable>
                {paymentDetails.extra}
              </Typography>
            </Card.Footer>
          ) : null}
        </Card>
      ) : null}

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
                {paymentSession.qr_url!}
              </PanelTypography>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      ) : null}
    </View>
  );
}

function PaymentContentFooter({
  paymentStatus,
  onClose,
  onCheck,
}: {
  paymentStatus: ReturnType<typeof usePaymentStatus>;
  onClose: () => void;
  onCheck: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const primaryForegroundColor = useCSSVariable("--color-primary-foreground") as string;

  return (
    <View className="border-t border-border bg-surface px-safe pb-safe">
      <View className="w-full max-w-5xl self-center flex-row gap-3 px-5 py-4">
        <PanelDialogButton variant="outline" onPress={onClose}>
          {t("common.close")}
        </PanelDialogButton>
        <PanelDialogButton className="flex-1" onPress={onCheck} disabled={paymentStatus.isPending}>
          {paymentStatus.isPending ? (
            <ActivityIndicator color={primaryForegroundColor} />
          ) : (
            <>
              <AppIcon icon={AppIcons.refresh} size={16} color={primaryForegroundColor} />
              {t("payment.checkStatus")}
            </>
          )}
        </PanelDialogButton>
      </View>
    </View>
  );
}

export function PaymentContent({
  onClose,
  onPaymentSuccess,
}: PaymentContentProps): JSX.Element | null {
  const { t } = useTranslation();
  const { toast } = useToast();
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const checkoutResult = usePOSStore((s) => s.checkoutResult);
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
  const { isWide } = useResponsiveLayout();
  const [expiredSessionKey, setExpiredSessionKey] = useState<string | null>(null);
  const completedOrderRef = useRef<string | null>(null);
  const buildVariant = Constants.expoConfig?.extra?.buildVariant;
  const showQrUrl =
    (buildVariant === "development" || buildVariant === "preview") && !!paymentSession?.qr_url;
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const paymentStatus = usePaymentStatus(paymentSession?.order_id);

  if (!paymentSession) return null;

  const sessionKey = `${paymentSession.order_id}:${paymentSession.expires_at ?? ""}`;
  const sessionExpired = isExpired(paymentSession.expires_at) || expiredSessionKey === sessionKey;
  const canShowQr = !!paymentSession.qr_url && !sessionExpired;
  const handleQrExpire = () => setExpiredSessionKey(sessionKey);

  const handleCheckPayment = () => {
    paymentStatus.mutate(undefined, {
      onSuccess: (data) => {
        const status = getPaymentStatus(data.payment_status);

        if (data.is_successful) {
          if (completedOrderRef.current === paymentSession.order_id) return;
          completedOrderRef.current = paymentSession.order_id;
          toast.show({ variant: "success", label: t("payment.confirmed") });
          onPaymentSuccess?.();
          return;
        }

        const isPending = ["pending", "unpaid"].includes(status.value);
        const isTerminalFailure = [
          "deny",
          "denied",
          "cancel",
          "cancelled",
          "canceled",
          "expire",
          "expired",
          "failure",
          "failed",
        ].includes(status.value);

        toast.show({
          variant: isTerminalFailure ? "destructive" : "warning",
          label: isPending ? t("payment.stillPending") : getLocalizedPaymentStatus(status, t),
        });
      },
      onError: () => {
        toast.show({ variant: "destructive", label: t("payment.checkFailed") });
      },
    });
  };

  const status = getPaymentContentStatus(paymentStatus, sessionExpired, t);

  const requestClose = () => setIsCancelDialogOpen(true);

  const paymentDetails = checkoutResult?.payment_details;

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border bg-surface px-safe pt-safe">
        <View className="w-full max-w-5xl self-center flex-row items-center justify-between px-5 pb-4 pt-4">
          <View className="min-w-0 flex-1 gap-0.5">
            <Typography type="h4" weight="bold">
              {t("navigation.payment")}
            </Typography>
            <Typography type="body-xs" muted numberOfLines={1}>
              {t("payment.order")}: {checkoutResult?.code ?? paymentSession.order_id}
            </Typography>
          </View>
          <PanelDialogButton
            variant="outline"
            size="sm"
            accessibilityLabel={t("common.close")}
            onPress={requestClose}
          >
            <AppIcon icon={AppIcons.close} size={20} color={themeColorMuted} />
          </PanelDialogButton>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="grow px-safe pb-6 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={cn(
            "flex-1 w-full max-w-5xl self-center px-5 gap-5",
            isWide && "flex-row items-start"
          )}
        >
          <PaymentQrPanel
            paymentSession={paymentSession}
            isWide={isWide}
            canShowQr={canShowQr}
            sessionExpired={sessionExpired}
            showQrUrl={showQrUrl}
            themeColorMuted={themeColorMuted}
            onExpire={handleQrExpire}
          />
          <PaymentInfoPanel
            paymentSession={paymentSession}
            isWide={isWide}
            paymentStatus={paymentStatus}
            status={status}
            paymentDetails={paymentDetails}
            showQrUrl={showQrUrl}
          />
        </View>
      </ScrollView>

      <PaymentContentFooter
        paymentStatus={paymentStatus}
        onClose={requestClose}
        onCheck={handleCheckPayment}
      />

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <Dialog.Content className="w-full max-w-md self-center">
          <Dialog.Title>{t("payment.cancelTitle")}</Dialog.Title>
          <Dialog.Description>{t("payment.cancelDescription")}</Dialog.Description>
          <Dialog.Footer>
            <PanelDialogButton
              variant="ghost"
              size="sm"
              onPress={() => setIsCancelDialogOpen(false)}
            >
              {t("common.cancel")}
            </PanelDialogButton>
            <PanelDialogButton
              variant="destructive"
              size="sm"
              className="flex-1"
              onPress={() => {
                setIsCancelDialogOpen(false);
                onClose?.();
              }}
            >
              {t("payment.leave")}
            </PanelDialogButton>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </View>
  );
}

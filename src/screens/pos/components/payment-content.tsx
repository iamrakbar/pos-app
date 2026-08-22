import { usePOSStore } from "@/stores/use-pos-store";
import { usePaymentStatus } from "@/hooks/db/use-payment-status";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/api-error";
import { isExpired } from "@/api/mappers/checkout";
import { getPaymentStatus } from "@/api/mappers/order";
import ActionDialog from "@/components/common/action-dialog";
import Countdown from "@/components/common/countdown";
import QrUrlDisclosure from "@/components/common/qr-url-disclosure";
import { Button, Chip, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { Image } from "expo-image";
import { ActivityIndicator, ScrollView, View } from "react-native";
import AppIcon from "@/components/common/app-icon";
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

export function PaymentContent({
  onClose,
  onPaymentSuccess,
}: PaymentContentProps): JSX.Element | null {
  const { t } = useTranslation();
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const checkoutResult = usePOSStore((s) => s.checkoutResult);
  const themeColorMuted = useThemeColor("muted");
  const { isWide } = useResponsiveLayout();
  const [expiredSessionKey, setExpiredSessionKey] = useState<string | null>(null);
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
        if (data.is_successful) {
          onPaymentSuccess?.();
        }
      },
    });
  };

  const apiPaymentStatus = paymentStatus.isSuccess
    ? getPaymentStatus(paymentStatus.data.payment_status)
    : null;
  const status = paymentStatus.isPending
    ? { label: t("payment.checking"), color: "warning" as const }
    : paymentStatus.isError
      ? { label: t("payment.checkFailed"), color: "danger" as const }
      : paymentStatus.isSuccess && paymentStatus.data.is_successful
        ? {
            label: apiPaymentStatus
              ? getLocalizedPaymentStatus(apiPaymentStatus, t)
              : t("payment.confirmed"),
            color: apiPaymentStatus?.color ?? ("success" as const),
          }
        : sessionExpired
          ? { label: t("payment.expired"), color: "danger" as const }
          : {
              label: apiPaymentStatus
                ? getLocalizedPaymentStatus(apiPaymentStatus, t)
                : t("payment.waiting"),
              color: apiPaymentStatus?.color ?? ("warning" as const),
            };

  const requestClose = () => setIsCancelDialogOpen(true);

  const paymentDetails = checkoutResult?.payment_details;

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border bg-background px-safe pt-safe">
        <View className="w-full max-w-5xl self-center flex-row items-center justify-between px-5 pb-4 pt-4">
          <View className="min-w-0 flex-1 gap-0.5">
            <Typography type="h4" weight="bold">
              {t("navigation.payment")}
            </Typography>
            <Typography type="body-xs" color="muted" numberOfLines={1}>
              {t("payment.order")}: {checkoutResult?.code ?? paymentSession.order_id}
            </Typography>
          </View>
          <Button
            variant="outline"
            size="sm"
            isIconOnly
            accessibilityLabel={t("common.close")}
            onPress={requestClose}
          >
            <AppIcon name="close-outline" size={20} color={themeColorMuted} />
          </Button>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="grow px-safe pb-6 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`w-full max-w-5xl self-center gap-5 px-5 ${isWide ? "flex-row items-start" : ""}`}
        >
          <Surface
            variant="secondary"
            className={isWide ? "flex-1 items-center gap-5 p-6" : "w-full items-center gap-5 p-5"}
          >
            <View className="w-full flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-1">
                <Typography type="body-sm" weight="semibold">
                  {t("payment.scanTitle")}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {t("payment.scanInstruction")}
                </Typography>
              </View>
              <AppIcon name="qr-code-outline" size={22} color={themeColorMuted} />
            </View>

            {canShowQr ? (
              <View
                className={`${isWide ? "h-72 w-72" : "h-64 w-64"} items-center justify-center rounded-xl border border-border bg-white`}
              >
                <Image
                  source={{ uri: paymentSession.qr_url! }}
                  style={{ width: isWide ? 256 : 224, height: isWide ? 256 : 224 }}
                  contentFit="contain"
                />
              </View>
            ) : (
              <View
                className={`${isWide ? "h-72 w-72" : "h-64 w-64"} items-center justify-center rounded-xl bg-surface-tertiary px-6`}
              >
                <AppIcon name="qr-code-outline" size={64} color={themeColorMuted} />
                <Typography type="body-sm" color="muted" className="mt-3 text-center">
                  {sessionExpired ? t("payment.qrExpired") : t("payment.qrUnavailable")}
                </Typography>
              </View>
            )}

            {canShowQr ? (
              <Countdown
                expiresAt={paymentSession.expires_at}
                prefix={t("payment.timeRemaining")}
                prominent
                onExpire={handleQrExpire}
              />
            ) : null}
          </Surface>

          <View className={isWide ? "w-96 gap-5" : "w-full gap-5"}>
            <Surface className="gap-5 p-5">
              <View className="gap-1">
                <Typography type="body-sm" color="muted">
                  {t("payment.total")}
                </Typography>
                <Typography type="h2" weight="bold" className="tabular-nums">
                  {formatRupiah(paymentSession.amount)}
                </Typography>
              </View>

              <Separator />

              <View className="gap-3">
                <View className="flex-row items-center justify-between gap-3">
                  <Typography type="body-sm" color="muted">
                    {t("payment.status")}
                  </Typography>
                  <Chip color={status.color} size="sm" variant="soft">
                    <Chip.Label>{status.label}</Chip.Label>
                  </Chip>
                </View>
                <View className="flex-row items-start justify-between gap-4">
                  <Typography type="body-sm" color="muted">
                    {t("payment.method")}
                  </Typography>
                  <Typography type="body-sm" weight="semibold" className="flex-1 text-right">
                    {paymentSession.payment_type}
                  </Typography>
                </View>
                <View className="flex-row items-start justify-between gap-4">
                  <Typography type="body-sm" color="muted">
                    {t("payment.transaction")}
                  </Typography>
                  <Typography
                    type="body-xs"
                    weight="semibold"
                    className="flex-1 text-right font-mono"
                  >
                    {paymentSession.transaction_id}
                  </Typography>
                </View>
                {paymentSession.reference ? (
                  <View className="flex-row items-start justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      {t("payment.reference")}
                    </Typography>
                    <Typography
                      type="body-xs"
                      weight="semibold"
                      className="flex-1 text-right font-mono"
                    >
                      {paymentSession.reference}
                    </Typography>
                  </View>
                ) : null}
              </View>

              {paymentStatus.isError ? (
                <Typography type="body-xs" className="text-danger">
                  {getErrorMessage(paymentStatus.error)}
                </Typography>
              ) : null}
            </Surface>

            {paymentDetails?.code || paymentDetails?.extra ? (
              <Surface variant="secondary" className="gap-3 p-4">
                <Typography type="body-sm" weight="semibold">
                  {t("payment.details")}
                </Typography>
                {paymentDetails.code ? (
                  <View className="flex-row items-start justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      {t("payment.code")}
                    </Typography>
                    <Typography
                      type="body-xs"
                      weight="semibold"
                      className="flex-1 text-right font-mono"
                    >
                      {paymentDetails.code}
                    </Typography>
                  </View>
                ) : null}
                {paymentDetails.extra ? (
                  <Typography type="body-xs" selectable>
                    {paymentDetails.extra}
                  </Typography>
                ) : null}
              </Surface>
            ) : null}

            {showQrUrl ? <QrUrlDisclosure url={paymentSession.qr_url!} /> : null}
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-surface px-safe pb-safe">
        <View className="w-full max-w-5xl self-center flex-row gap-3 px-5 py-4">
          <Button variant="outline" onPress={requestClose}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button
            className="flex-1"
            onPress={handleCheckPayment}
            isDisabled={paymentStatus.isPending}
          >
            {paymentStatus.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AppIcon name="refresh-outline" size={16} color="white" />
                <Button.Label className="ml-2">{t("payment.checkStatus")}</Button.Label>
              </>
            )}
          </Button>
        </View>
      </View>

      <ActionDialog
        isOpen={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title={t("payment.cancelTitle")}
        description={t("payment.cancelDescription")}
        actionLabel={t("payment.leave")}
        actionVariant="danger"
        onAction={() => {
          setIsCancelDialogOpen(false);
          onClose?.();
        }}
      />
    </View>
  );
}

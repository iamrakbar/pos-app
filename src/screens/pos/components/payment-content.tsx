import { usePOSStore } from "@/stores/use-pos-store";
import { usePaymentStatus } from "@/hooks/db/use-payment-status";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/api-error";
import { isExpired } from "@/api/mappers/checkout";
import { getPaymentStatus } from "@/api/mappers/order";
import Countdown from "@/components/common/countdown";
import QrUrlDisclosure from "@/components/common/qr-url-disclosure";
import { Button, Chip, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { Image } from "expo-image";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type PaymentContentProps = {
  onClose?: () => void;
  onPaymentSuccess?: () => void;
};

export function PaymentContent({
  onClose,
  onPaymentSuccess,
}: PaymentContentProps): JSX.Element | null {
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const themeColorMuted = useThemeColor("muted");
  const { width } = useResponsiveLayout();
  const isWideLayout = width >= 760;
  const [expiredSessionKey, setExpiredSessionKey] = useState<string | null>(null);
  const buildVariant = Constants.expoConfig?.extra?.buildVariant;
  const showQrUrl =
    (buildVariant === "development" || buildVariant === "preview") && !!paymentSession?.qr_url;

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
    ? { label: "Checking payment", color: "warning" as const }
    : paymentStatus.isError
      ? { label: "Status check failed", color: "danger" as const }
      : paymentStatus.isSuccess && paymentStatus.data.is_successful
        ? (apiPaymentStatus ?? { label: "Payment confirmed", color: "success" as const })
        : sessionExpired
          ? { label: "Payment expired", color: "danger" as const }
          : (apiPaymentStatus ?? { label: "Waiting for payment", color: "warning" as const });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-safe py-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface
          variant="transparent"
          className={
            isWideLayout
              ? "w-full max-w-4xl self-center flex-row items-center justify-center gap-8 p-6"
              : "w-full self-center items-center justify-center gap-5 p-5"
          }
        >
          <View className="items-center gap-4">
            {canShowQr ? (
              <View className="w-64 h-64 bg-white rounded-lg items-center justify-center border border-border">
                <Image
                  source={{ uri: paymentSession.qr_url! }}
                  style={{ width: 224, height: 224 }}
                  contentFit="contain"
                />
              </View>
            ) : (
              <View className="w-64 h-64 bg-surface-secondary rounded-lg items-center justify-center px-6">
                <Ionicons name="qr-code-outline" size={64} color={themeColorMuted} />
                <Typography className="text-sm text-muted-foreground text-center mt-3">
                  {sessionExpired
                    ? "QR pembayaran sudah kedaluwarsa"
                    : "QR pembayaran tidak tersedia"}
                </Typography>
              </View>
            )}
          </View>

          <View className={isWideLayout ? "w-90 gap-4" : "w-full gap-4"}>
            <View className="flex-row items-center justify-between gap-3">
              <Typography type="body-sm" weight="semibold">
                Payment status
              </Typography>
              <Chip color={status.color} size="sm" variant="soft">
                <Chip.Label>{status.label}</Chip.Label>
              </Chip>
            </View>

            <View className="gap-1.5">
              <Typography type="body-xs" color="muted">
                Payment method
              </Typography>
              <Typography type="h4" weight="bold">
                {paymentSession.payment_type}
              </Typography>
              <Typography type="h2" weight="bold" className="tabular-nums">
                {formatRupiah(paymentSession.amount)}
              </Typography>
              <Typography type="body-xs" color="muted" className="font-mono">
                {paymentSession.transaction_id}
              </Typography>
            </View>

            {canShowQr && (
              <Countdown
                expiresAt={paymentSession.expires_at}
                prefix="Time remaining"
                prominent
                onExpire={handleQrExpire}
              />
            )}

            {showQrUrl ? <QrUrlDisclosure url={paymentSession.qr_url!} /> : null}

            {paymentStatus.isError && (
              <Typography type="body-xs" className="text-danger">
                {getErrorMessage(paymentStatus.error)}
              </Typography>
            )}
          </View>
        </Surface>
      </ScrollView>

      <Separator />

      <View className="bg-surface px-safe pb-safe">
        <View className="w-full max-w-4xl self-center flex-row gap-3 px-5 py-4">
          <Button
            className="flex-1"
            onPress={handleCheckPayment}
            isDisabled={paymentStatus.isPending}
          >
            {paymentStatus.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="white" />
                <Button.Label className="ml-2">Check Payment Status</Button.Label>
              </>
            )}
          </Button>
          <Button variant="outline" onPress={onClose}>
            Close
          </Button>
        </View>
      </View>
    </View>
  );
}

import { usePOSStore } from "@/stores/usePOSStore";
import { usePaymentStatus } from "@/hooks/db/usePaymentStatus";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/ApiError";
import { isExpired } from "@/api/mappers/checkout";
import Countdown from "@/components/common/Countdown";
import { Button, Chip, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { ActivityIndicator, Image, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PaymentContentProps = {
  onClose?: () => void;
  onPaymentSuccess?: () => void;
};

export function PaymentContent({ onClose, onPaymentSuccess }: PaymentContentProps): JSX.Element {
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const closeModal = usePOSStore((s) => s.closeModal);
  const themeColorMuted = useThemeColor("muted");
  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth >= 760;
  const [expiredSessionKey, setExpiredSessionKey] = useState<string | null>(null);

  const paymentStatus = usePaymentStatus(paymentSession?.order_id);

  if (!paymentSession) return <></>;

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

  const status = paymentStatus.isPending
    ? { label: "Checking payment", color: "warning" as const }
    : paymentStatus.isError
      ? { label: "Status check failed", color: "danger" as const }
      : paymentStatus.isSuccess && paymentStatus.data.is_successful
        ? { label: "Payment confirmed", color: "success" as const }
        : sessionExpired
          ? { label: "Payment expired", color: "danger" as const }
          : {
              label:
                paymentStatus.isSuccess && paymentStatus.data.payment_status_label
                  ? paymentStatus.data.payment_status_label
                  : "Waiting for payment",
              color: "warning" as const,
            };

  return (
    <View className="flex-1 bg-background">
      <View className="bg-surface px-5 py-5">
        <Typography className="text-xl font-semibold text-foreground">Payment</Typography>
      </View>

      <Separator />

      <View className="flex-1 p-5">
        <Surface
          className={
            isWideLayout
              ? "w-full max-w-4xl flex-1 self-center flex-row items-center justify-center gap-8 p-6"
              : "w-full flex-1 items-center justify-center gap-5 p-5"
          }
        >
          <View className="items-center gap-4">
            {canShowQr ? (
              <View className="w-64 h-64 bg-white rounded-lg items-center justify-center border border-border">
                <Image
                  source={{ uri: paymentSession.qr_url! }}
                  className="w-56 h-56"
                  resizeMode="contain"
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

          <View className={isWideLayout ? "w-[360px] gap-4" : "w-full gap-4"}>
            <View className="flex-row items-center justify-between gap-3">
              <Typography type="body-sm" weight="semibold">
                Payment status
              </Typography>
              <Chip color={status.color} size="sm" variant="soft">
                <Chip.Label>{status.label}</Chip.Label>
              </Chip>
            </View>

            <View className="gap-1">
              <Typography className="text-sm font-semibold text-muted-foreground">
                {paymentSession.payment_type}
              </Typography>
              <Typography className="text-3xl font-bold text-foreground tabular-nums">
                {formatRupiah(paymentSession.amount)}
              </Typography>
              <Typography className="text-xs text-muted-foreground font-mono">
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

            {paymentStatus.isError && (
              <Typography type="body-xs" className="text-danger">
                {getErrorMessage(paymentStatus.error)}
              </Typography>
            )}
          </View>
        </Surface>
      </View>

      <Separator />

      <View className="bg-surface px-5 py-4">
        <View className="w-full max-w-4xl self-center flex-row gap-3">
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
          <Button variant="outline" onPress={onClose ?? closeModal}>
            Close
          </Button>
        </View>
      </View>
    </View>
  );
}

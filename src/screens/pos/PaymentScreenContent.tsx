import { usePOSStore } from "@/stores/usePOSStore";
import { usePaymentStatus } from "@/hooks/db/usePaymentStatus";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage } from "@/api/ApiError";
import { isExpired } from "@/api/mappers/checkout";
import Countdown from "@/components/common/Countdown";
import { Button, Separator, Surface, Typography } from "heroui-native";
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
  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth >= 760;
  const [expiredSessionKey, setExpiredSessionKey] = useState<string | null>(null);

  const paymentStatus = usePaymentStatus(paymentSession?.order_id);

  if (!paymentSession) return <></>;

  const sessionKey = `${paymentSession.order_id}:${paymentSession.expires_at ?? ""}`;
  const canShowQr =
    !!paymentSession.qr_url &&
    !isExpired(paymentSession.expires_at) &&
    expiredSessionKey !== sessionKey;
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

  return (
    <View className="flex-1 bg-background">
      <View className="bg-surface px-5 py-5">
        <View className="gap-0.5">
          <Typography className="text-xl font-semibold text-foreground">Payment</Typography>
          <Typography className="text-sm text-muted-foreground">
            Complete the transaction and verify payment status
          </Typography>
        </View>
      </View>

      <Separator />

      <View className="flex-1 p-5">
        <Surface
          className={
            isWideLayout
              ? "w-full max-w-5xl flex-1 self-center flex-row items-center justify-center gap-10 p-8"
              : "w-full flex-1 items-center justify-center gap-5 p-5"
          }
        >
          <View className="items-center gap-4">
            {canShowQr ? (
              <View className="w-72 h-72 bg-white rounded-lg items-center justify-center border border-border">
                <Image
                  source={{ uri: paymentSession.qr_url! }}
                  className="w-64 h-64"
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View className="w-72 h-72 bg-muted rounded-lg items-center justify-center border border-border px-6">
                <Ionicons name="qr-code-outline" size={72} color="#9ca3af" />
                <Typography className="text-sm text-muted-foreground text-center mt-3">
                  {paymentSession.expires_at && isExpired(paymentSession.expires_at)
                    ? "QR pembayaran sudah kedaluwarsa"
                    : "QR pembayaran tidak tersedia"}
                </Typography>
              </View>
            )}
          </View>

          <View className={isWideLayout ? "w-[360px] gap-4" : "w-full gap-4"}>
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
                prefix="QR berlaku"
                className="text-sm text-warning font-semibold"
                onExpire={handleQrExpire}
              />
            )}

            {paymentStatus.isSuccess && !paymentStatus.data.is_successful && (
              <Typography className="text-sm text-warning">
                {paymentStatus.data.payment_status_label ?? "Menunggu pembayaran"}
              </Typography>
            )}
            {paymentStatus.isError && (
              <Typography className="text-sm text-danger">
                {getErrorMessage(paymentStatus.error)}
              </Typography>
            )}
          </View>
        </Surface>
      </View>

      <Separator />

      <View className="bg-surface px-5 py-4">
        <View className="w-full max-w-5xl self-center flex-row gap-3">
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
                <Button.Label className="ml-2">Check Payment</Button.Label>
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

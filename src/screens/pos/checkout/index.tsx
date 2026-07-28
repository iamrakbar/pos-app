import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { CheckoutContent } from "@/screens/pos/components/checkout-content";
import { usePOSStore } from "@/stores/use-pos-store";
import type { PaymentSession } from "@/types/pos";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

export default function CheckoutScreen(): JSX.Element {
  const router = useRouter();
  const { isWide } = useResponsiveLayout();
  const setPaymentSession = usePOSStore((state) => state.setPaymentSession);

  const handlePaymentReady = (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { isCash: boolean }
  ) => {
    setPaymentSession(session, result);
    router.replace(options.isCash ? "/pos/payment-success" : "/pos/payment");
  };

  return (
    <View className="flex-1 bg-background pb-safe">
      {isWide ? (
        <View className="bg-surface px-5 py-5">
          <Typography type="h4" weight="semibold">
            Checkout
          </Typography>
        </View>
      ) : null}
      <CheckoutContent onCancel={() => router.back()} onPaymentReady={handlePaymentReady} />
    </View>
  );
}

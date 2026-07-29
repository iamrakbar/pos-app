import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { CheckoutContent } from "@/screens/pos/components/checkout-content";
import { usePOSStore } from "@/stores/use-pos-store";
import type { PaymentSession } from "@/types/pos";
import { useRouter } from "expo-router";
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
      <CheckoutContent onCancel={() => router.back()} onPaymentReady={handlePaymentReady} />
    </View>
  );
}

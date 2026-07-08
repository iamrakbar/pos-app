import { CheckoutContent } from "@/screens/pos/CheckoutScreenContent";
import { usePOSStore } from "@/stores/usePOSStore";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import type { PaymentSession } from "@/types/pos";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";

export default function CheckoutRoute(): JSX.Element {
  const router = useRouter();
  const setPaymentSession = usePOSStore((s) => s.setPaymentSession);

  const handlePaymentReady = (session: PaymentSession, result: MerchantCheckoutData) => {
    setPaymentSession(session, result);
    router.replace("/pos/payment" as never);
  };

  return (
    <View className="flex-1 bg-background">
      <CheckoutContent onCancel={() => router.back()} onPaymentReady={handlePaymentReady} />
    </View>
  );
}

import { PaymentContent } from "@/screens/pos/PaymentScreenContent";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";

export default function PaymentRoute(): JSX.Element {
  const router = useRouter();

  const handlePaymentSuccess = () => {
    router.replace("/pos/payment-success" as never);
  };

  return (
    <View className="flex-1 bg-background">
      <PaymentContent onClose={() => router.back()} onPaymentSuccess={handlePaymentSuccess} />
    </View>
  );
}

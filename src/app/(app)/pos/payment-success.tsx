import { PaymentSuccessContent } from "@/components/pos/screens/PaymentSuccessScreenContent";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";

export default function PaymentSuccessRoute(): JSX.Element {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <PaymentSuccessContent onNewOrder={() => router.replace("/" as never)} />
    </View>
  );
}

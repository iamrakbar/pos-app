import { PaymentContent } from "@/screens/pos/components/payment-content";
import { useRouter } from "expo-router";
import type { JSX } from "react";

export default function PaymentScreen(): JSX.Element {
  const router = useRouter();

  return (
    <PaymentContent
      onClose={() => router.replace("/pos")}
      onPaymentSuccess={() => router.replace("/pos/payment-success")}
    />
  );
}

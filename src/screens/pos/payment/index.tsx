import { PaymentContent } from "@/screens/pos/components/payment-content";
import { usePOSStore } from "@/stores/use-pos-store";
import { useRouter } from "expo-router";
import type { JSX } from "react";

export default function PaymentScreen(): JSX.Element {
  const router = useRouter();
  const resetCheckoutForm = usePOSStore((state) => state.resetCheckoutForm);

  return (
    <PaymentContent
      onClose={() => {
        resetCheckoutForm();
        router.replace("/pos");
      }}
      onPaymentSuccess={() => router.replace("/pos/payment-success")}
    />
  );
}

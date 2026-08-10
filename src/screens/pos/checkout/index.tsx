import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { CheckoutContent } from "@/screens/pos/components/checkout-content";
import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import type { PaymentSession } from "@/types/pos";
import { useRouter } from "expo-router";
import type { JSX } from "react";

export default function CheckoutScreen(): JSX.Element {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const setPaymentSession = usePOSStore((state) => state.setPaymentSession);

  const handlePaymentReady = (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { processingMode: PaymentSession["processing_mode"] }
  ) => {
    setPaymentSession(session, result);
    clearCart();
    router.replace(options.processingMode === "gateway" ? "/pos/payment" : "/pos/payment-success");
  };

  return <CheckoutContent presentation="screen" onPaymentReady={handlePaymentReady} />;
}

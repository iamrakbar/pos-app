import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";

export function resetCurrentOrder(): void {
  useCartStore.getState().resetCart();
  usePOSStore.getState().resetCheckoutForm();
}

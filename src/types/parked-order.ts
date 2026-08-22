import type { CheckoutFormState } from "@/types/pos";
import type { Cart } from "@/types/cart";

export type ParkedOrder = {
  id: string;
  merchant_id: string;
  label: string;
  cart: Cart;
  checkout_form: CheckoutFormState;
  created_at: string;
  updated_at: string;
};

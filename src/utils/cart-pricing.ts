import type { CartItem } from "@/types/cart";

function getCartAddOnTotal(item: CartItem): number {
  return item.add_ons
    .flatMap((addOn) => addOn.options)
    .reduce((total, option) => total + option.price, 0);
}

export function getCartItemSubtotal(item: CartItem): number {
  return (item.price + getCartAddOnTotal(item)) * item.qty;
}

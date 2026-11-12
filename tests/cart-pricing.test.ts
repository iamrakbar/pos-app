import { test } from "bun:test";
import { getCartItemSubtotal, getCartSubtotal } from "../src/utils/cart-pricing";
import type { CartItem } from "../src/types/cart";

function equal(actual: number, expected: number) {
  if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
}

test("cart subtotal follows current quantities and add-ons, not stored subtotals", () => {
  const item: CartItem = {
    id: "coffee",
    product_id: "coffee",
    name: "Coffee",
    price: 10000,
    qty: 2,
    add_ons: [{ id: "milk", name: "Milk", options: [{ id: "oat", name: "Oat", price: 2000 }] }],
    subtotal: 10000,
  };

  equal(getCartItemSubtotal(item), 24000);
  equal(getCartSubtotal([item, { ...item, id: "tea", price: 5000, qty: 1, add_ons: [] }]), 29000);
  equal(getCartSubtotal([{ ...item, qty: 3 }]), 36000);
  equal(getCartSubtotal([]), 0);
});

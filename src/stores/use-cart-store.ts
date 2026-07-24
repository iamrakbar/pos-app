import { CartAddOn, Cart, CartAction, CartItem } from "@/types/cart";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const cartStorage = createJSONStorage(() => zustandStorage);

// 🔑 Unique key generator
function generateCartItemId(product_id: string, add_ons?: CartAddOn[], notes?: string): string {
  const addOnKey = (add_ons || [])
    .map((add_on) => {
      const optionIds = (add_on.options || [])
        .map((opt) => opt.id)
        .sort()
        .join(",");

      return `${add_on.id}[${optionIds}]`;
    })
    .sort()
    .join("|");

  const notesKey = notes?.trim() ? `notes:${notes.trim()}` : "";

  return [product_id, addOnKey, notesKey].join("-");
}

// 🧮 Compute subtotal for a single product
function computeItemSubtotal(product: {
  price: number;
  add_ons?: CartAddOn[];
  qty?: number;
}): number {
  const optionsTotal = (product.add_ons || []).reduce((sum, opt) => {
    return (
      sum +
      (opt.options || []).reduce((nestedSum, nestedOpt) => nestedSum + (nestedOpt.price || 0), 0)
    );
  }, 0);

  return (product.price + optionsTotal) * (product.qty ?? 1);
}

export const useCartStore = create<Cart & CartAction>()(
  persist(
    (set, get) => ({
      merchant_id: null,
      table_id: null,
      products: [],
      notes: "", // 🧾 Cart-level notes

      // 📌 Set merchant & table
      setMerchantId: (merchant_id: string) => set({ merchant_id }),
      setTableId: (table_id: string) => set({ table_id }),

      // Optionally set both at once
      setMerchantIdAndTableId: (merchant_id: string, table_id: string) =>
        set({ merchant_id, table_id }),

      // 🧾 Set or clear cart notes
      setCartNotes: (notes: string) => set({ notes }),

      // 🧮 Totals
      totalQty: () => get().products.reduce((acc, product) => acc + product.qty, 0),

      getItemTotal: (id: string) => {
        const product = get().products.find((i) => i.id === id);
        if (!product) return 0;
        return computeItemSubtotal(product);
      },

      totalPrice: () =>
        get().products.reduce((total, product) => total + get().getItemTotal(product.id), 0),

      // ➕ Add item (handles notes per product)
      addItem: (product) => {
        const id = generateCartItemId(
          product.product_id,
          product.add_ons,
          product.notes ?? undefined
        );

        const products = get().products;
        const existingIndex = products.findIndex((i) => i.id === id);

        if (existingIndex > -1) {
          const updated = [...products];
          const existing = updated[existingIndex];
          const nextItem = { ...existing, qty: existing.qty + product.qty };
          updated[existingIndex] = {
            ...nextItem,
            subtotal: computeItemSubtotal(nextItem),
          };
          set({ products: updated });
        } else {
          const newProduct: CartItem = {
            id,
            ...product,
            subtotal: computeItemSubtotal(product),
          };
          set({
            products: [...products, newProduct],
          });
        }
      },

      // 🔄 Update item quantity
      updateQty: (id, qty) => {
        set({
          products: get().products.map((i) =>
            i.id === id ? { ...i, qty, subtotal: computeItemSubtotal({ ...i, qty }) } : i
          ),
        });
      },

      // 📝 Update item notes (preserves qty and add-ons)
      updateItemNotes: (id: string, notes: string) => {
        const products = get().products;
        const existing = products.find((i) => i.id === id);
        if (!existing) return;

        // Generate a new ID since notes affect uniqueness
        const newId = generateCartItemId(existing.product_id, existing.add_ons, notes);

        const updated = products.map((i) => {
          if (i.id !== id) return i;
          const next = { ...i, id: newId, notes };
          return { ...next, subtotal: computeItemSubtotal(next) };
        });

        set({ products: updated });
      },

      // 🗑️ Remove a single item
      removeItem: (id) =>
        set({
          products: get().products.filter((i) => i.id !== id),
        }),

      // 🧹 Clear products but keep merchant/table
      clearCart: () => set({ products: [] }),

      // 🔁 Reset everything
      resetCart: () =>
        set({
          products: [],
          merchant_id: null,
          table_id: null,
          notes: "",
        }),
    }),
    {
      name: "soeat-order-cart",
      storage: cartStorage,
    }
  )
);

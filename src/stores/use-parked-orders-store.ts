import { zustandStorage } from "@/lib/storage";
import type { Cart } from "@/types/cart";
import type { CheckoutFormState } from "@/types/pos";
import type { ParkedOrder } from "@/types/parked-order";
import { formatTime } from "@/utils/format";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ParkedOrdersState = {
  drafts: ParkedOrder[];
  parkOrder: (
    merchantId: string,
    label: string,
    cart: Cart,
    checkoutForm: CheckoutFormState
  ) => void;
  removeOrder: (merchantId: string, id: string) => void;
  getOrders: (merchantId: string) => ParkedOrder[];
  clearMerchant: (merchantId: string) => void;
};

function createDraftId(): string {
  return `parked:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export const useParkedOrdersStore = create<ParkedOrdersState>()(
  persist(
    (set, get) => ({
      drafts: [],

      parkOrder: (merchantId, label, cart, checkoutForm) => {
        const now = new Date().toISOString();
        const draft: ParkedOrder = {
          id: createDraftId(),
          merchant_id: merchantId,
          label: label.trim() || formatTime(new Date()),
          cart,
          checkout_form: checkoutForm,
          created_at: now,
          updated_at: now,
        };

        set((state) => ({ drafts: [draft, ...state.drafts] }));
      },

      removeOrder: (merchantId, id) =>
        set((state) => ({
          drafts: state.drafts.filter(
            (draft) => draft.merchant_id !== merchantId || draft.id !== id
          ),
        })),

      getOrders: (merchantId) =>
        get()
          .drafts.filter((draft) => draft.merchant_id === merchantId)
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),

      clearMerchant: (merchantId) =>
        set((state) => ({
          drafts: state.drafts.filter((draft) => draft.merchant_id !== merchantId),
        })),
    }),
    {
      name: "soeat-parked-orders",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

import type { CheckoutFormState, PaymentSession, POSProduct } from "@/types/pos";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ProductSort = "name-asc" | "name-desc" | "price-asc" | "price-desc";

type POSState = {
  selectedProduct: POSProduct | null;
  editingCartItemId: string | null;
  paymentSession: PaymentSession | null;
  checkoutResult: MerchantCheckoutData | null;
  searchQuery: string;
  categoryId: string | null;
  productSort: ProductSort;
  areCategoriesVisible: boolean;
  checkoutForm: CheckoutFormState;
};

type POSAction = {
  beginAddonSelection: (product: POSProduct, editingCartItemId?: string) => boolean;
  clearAddonSelection: () => void;
  setPaymentSession: (session: PaymentSession, result: MerchantCheckoutData) => void;
  setSearchQuery: (q: string) => void;
  setCategoryId: (id: string | null) => void;
  setProductSort: (sort: ProductSort) => void;
  toggleCategories: () => void;
  updateCheckoutForm: (patch: Partial<CheckoutFormState>) => void;
  resetCheckoutForm: () => void;
};

const DEFAULT_CHECKOUT_FORM: CheckoutFormState = {
  order_type: "dine-in",
  table_id: null,
  pickup_time: null,
  customer_type: "anonymous",
  guest_id: null,
  customer_id: null,
  customer_search: "",
  notes: "",
};

export const usePOSStore = create<POSState & POSAction>()(
  persist(
    (set) => ({
      selectedProduct: null,
      editingCartItemId: null,
      paymentSession: null,
      checkoutResult: null,
      searchQuery: "",
      categoryId: null,
      productSort: "name-asc",
      areCategoriesVisible: true,
      checkoutForm: { ...DEFAULT_CHECKOUT_FORM },

      beginAddonSelection: (product, editingCartItemId) => {
        let didBegin = false;

        set((state) => {
          if (state.selectedProduct) return state;

          didBegin = true;
          return {
            selectedProduct: product,
            editingCartItemId: editingCartItemId ?? null,
          };
        });

        return didBegin;
      },

      clearAddonSelection: () =>
        set({
          selectedProduct: null,
          editingCartItemId: null,
        }),

      setPaymentSession: (session, result) =>
        set({ paymentSession: session, checkoutResult: result }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setCategoryId: (categoryId) => set({ categoryId }),

      setProductSort: (productSort) => set({ productSort }),

      toggleCategories: () =>
        set((state) => ({ areCategoriesVisible: !state.areCategoriesVisible })),

      updateCheckoutForm: (patch) =>
        set((state) => ({
          checkoutForm: { ...state.checkoutForm, ...patch },
        })),

      resetCheckoutForm: () =>
        set({
          selectedProduct: null,
          editingCartItemId: null,
          checkoutForm: { ...DEFAULT_CHECKOUT_FORM },
          paymentSession: null,
          checkoutResult: null,
        }),
    }),
    {
      name: "soeat-pos-preferences",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        areCategoriesVisible: state.areCategoriesVisible,
      }),
    }
  )
);

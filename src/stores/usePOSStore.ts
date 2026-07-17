import type { CheckoutFormState, PaymentSession, POSProduct } from "@/types/pos";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type POSModal = "addon" | "checkout" | "payment" | null;
export type ProductSort = "name-asc" | "name-desc" | "price-asc" | "price-desc";

type POSState = {
  modal: POSModal;
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
  openAddonModal: (product: POSProduct, editingCartItemId?: string) => void;
  openCheckoutModal: () => void;
  openPaymentModal: (session: PaymentSession, result: MerchantCheckoutData) => void;
  setPaymentSession: (session: PaymentSession, result: MerchantCheckoutData) => void;
  closeModal: () => void;
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
  payment_group: "e-money",
  payment_id: "pay-qris",
  customer_type: "anonymous",
  guest_id: null,
  customer_id: null,
  customer_search: "",
  notes: "",
};

export const usePOSStore = create<POSState & POSAction>()(
  persist(
    (set) => ({
      modal: null,
      selectedProduct: null,
      editingCartItemId: null,
      paymentSession: null,
      checkoutResult: null,
      searchQuery: "",
      categoryId: null,
      productSort: "name-asc",
      areCategoriesVisible: true,
      checkoutForm: { ...DEFAULT_CHECKOUT_FORM },

      openAddonModal: (product, editingCartItemId) =>
        set({
          modal: "addon",
          selectedProduct: product,
          editingCartItemId: editingCartItemId ?? null,
        }),

      openCheckoutModal: () => set({ modal: "checkout" }),

      openPaymentModal: (session, result) =>
        set({ modal: "payment", paymentSession: session, checkoutResult: result }),

      setPaymentSession: (session, result) =>
        set({ paymentSession: session, checkoutResult: result }),

      closeModal: () => set({ modal: null }),

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

import type { CheckoutFormState, PaymentSession, POSProduct } from "@/types/pos";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { create } from "zustand";

type POSModal = "addon" | null;

type POSState = {
  modal: POSModal;
  selectedProduct: POSProduct | null;
  editingCartItemId: string | null;
  paymentSession: PaymentSession | null;
  checkoutResult: MerchantCheckoutData | null;
  searchQuery: string;
  categoryId: string | null;
  checkoutForm: CheckoutFormState;
};

type POSAction = {
  openAddonModal: (product: POSProduct, editingCartItemId?: string) => void;
  setPaymentSession: (session: PaymentSession, result: MerchantCheckoutData) => void;
  closeModal: () => void;
  setSearchQuery: (q: string) => void;
  setCategoryId: (id: string | null) => void;
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

export const usePOSStore = create<POSState & POSAction>()((set) => ({
  modal: null,
  selectedProduct: null,
  editingCartItemId: null,
  paymentSession: null,
  checkoutResult: null,
  searchQuery: "",
  categoryId: null,
  checkoutForm: { ...DEFAULT_CHECKOUT_FORM },

  openAddonModal: (product, editingCartItemId) =>
    set({ modal: "addon", selectedProduct: product, editingCartItemId: editingCartItemId ?? null }),

  setPaymentSession: (session, result) => set({ paymentSession: session, checkoutResult: result }),

  closeModal: () => set({ modal: null, selectedProduct: null, editingCartItemId: null }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setCategoryId: (categoryId) => set({ categoryId }),

  updateCheckoutForm: (patch) =>
    set((state) => ({
      checkoutForm: { ...state.checkoutForm, ...patch },
    })),

  resetCheckoutForm: () =>
    set({ checkoutForm: { ...DEFAULT_CHECKOUT_FORM }, paymentSession: null, checkoutResult: null }),
}));

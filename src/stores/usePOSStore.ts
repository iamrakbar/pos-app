import type { CheckoutFormState, PaymentSession, POSProduct } from '@/types/pos';
import { create } from 'zustand';

type POSModal = 'addon' | 'checkout' | 'payment' | 'payment-success' | null;

type POSState = {
  modal: POSModal;
  selectedProduct: POSProduct | null;
  editingCartItemId: string | null;
  paymentSession: PaymentSession | null;
  searchQuery: string;
  categoryId: string | null;
  checkoutForm: CheckoutFormState;
};

type POSAction = {
  openAddonModal: (product: POSProduct, editingCartItemId?: string) => void;
  openCheckoutModal: () => void;
  openPaymentModal: (session: PaymentSession) => void;
  openPaymentSuccessModal: () => void;
  closeModal: () => void;
  setSearchQuery: (q: string) => void;
  setCategoryId: (id: string | null) => void;
  updateCheckoutForm: (patch: Partial<CheckoutFormState>) => void;
  resetCheckoutForm: () => void;
};

const DEFAULT_CHECKOUT_FORM: CheckoutFormState = {
  order_type: 'dine-in',
  table_id: null,
  payment_group: 'e-money',
  payment_id: 'pay-qris',
  customer_type: 'merchant',
  customer_search: '',
  notes: '',
};

export const usePOSStore = create<POSState & POSAction>()((set) => ({
  modal: null,
  selectedProduct: null,
  editingCartItemId: null,
  paymentSession: null,
  searchQuery: '',
  categoryId: null,
  checkoutForm: { ...DEFAULT_CHECKOUT_FORM },

  openAddonModal: (product, editingCartItemId) =>
    set({ modal: 'addon', selectedProduct: product, editingCartItemId: editingCartItemId ?? null }),

  openCheckoutModal: () => set({ modal: 'checkout' }),

  openPaymentModal: (session) =>
    set({ modal: 'payment', paymentSession: session }),

  openPaymentSuccessModal: () => set({ modal: 'payment-success' }),

  closeModal: () =>
    set({ modal: null, selectedProduct: null, editingCartItemId: null }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setCategoryId: (categoryId) => set({ categoryId }),

  updateCheckoutForm: (patch) =>
    set((state) => ({
      checkoutForm: { ...state.checkoutForm, ...patch },
    })),

  resetCheckoutForm: () =>
    set({ checkoutForm: { ...DEFAULT_CHECKOUT_FORM } }),
}));

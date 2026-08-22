import { create } from "zustand";

type DiscountProductDraftState = {
  draftKey: string | null;
  productIds: string[];
  initialize: (draftKey: string, productIds: string[]) => void;
  setProductIds: (productIds: string[]) => void;
  clear: () => void;
};

export const useDiscountProductDraft = create<DiscountProductDraftState>((set) => ({
  draftKey: null,
  productIds: [],
  initialize: (draftKey, productIds) =>
    set((state) =>
      state.draftKey === draftKey
        ? state
        : { draftKey, productIds: [...new Set(productIds)] }
    ),
  setProductIds: (productIds) => set({ productIds: [...new Set(productIds)] }),
  clear: () => set({ draftKey: null, productIds: [] }),
}));

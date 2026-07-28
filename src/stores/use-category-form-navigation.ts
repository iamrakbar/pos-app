import { create } from "zustand";

type CreatedCategory = {
  id: string;
  name: string;
};

type CategoryFormNavigationState = {
  createdCategory: CreatedCategory | null;
  setCreatedCategory: (category: CreatedCategory) => void;
  clearCreatedCategory: () => void;
};

export const useCategoryFormNavigation = create<CategoryFormNavigationState>((set) => ({
  createdCategory: null,
  setCreatedCategory: (createdCategory) => set({ createdCategory }),
  clearCreatedCategory: () => set({ createdCategory: null }),
}));

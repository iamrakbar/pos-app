import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ReceiptSettings {
  storeLogo: string | null;
  storeName: string;
  header: string;
  footer: string;
  initializedMerchantId: string | null;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  storeLogo: null,
  storeName: "",
  header: "",
  footer: "Thank you!",
  initializedMerchantId: null,
};

interface ReceiptStore {
  settings: ReceiptSettings;
  updateSettings: (patch: Partial<ReceiptSettings>) => void;
  resetSettings: () => void;
}

const receiptStorage =
  Platform.OS === "web"
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => AsyncStorage);

const normalizeSettings = (value: unknown): ReceiptSettings => {
  const persisted = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const legacyHeader = [persisted.storeAddress1, persisted.storeAddress2, persisted.storePhone]
    .filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    .join("\n");

  return {
    storeLogo: typeof persisted.storeLogo === "string" ? persisted.storeLogo : null,
    storeName: typeof persisted.storeName === "string" ? persisted.storeName : "",
    header: typeof persisted.header === "string" ? persisted.header : legacyHeader,
    footer: typeof persisted.footer === "string" ? persisted.footer : "Thank you!",
    initializedMerchantId:
      typeof persisted.initializedMerchantId === "string" ? persisted.initializedMerchantId : null,
  };
};

export const useReceiptStore = create<ReceiptStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_RECEIPT_SETTINGS,
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_RECEIPT_SETTINGS }),
    }),
    {
      name: "soeat-receipt-settings",
      storage: receiptStorage,
      version: 2,
      merge: (persisted, current) => {
        const persistedState = persisted as { settings?: unknown } | undefined;
        return {
          ...current,
          settings: normalizeSettings(persistedState?.settings),
        };
      },
    }
  )
);

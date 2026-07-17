import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ReceiptSettings {
  layout: "standard" | "compact" | "customer" | "kitchen";
  storeLogo: string | null;
  storeName: string;
  header: string;
  footer: string;
  initializedMerchantId: string | null;
  headerInitializedMerchantId: string | null;
  autoPrintOnSuccess: boolean;
  lastAutoPrintedOrderId: string | null;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  layout: "standard",
  storeLogo: null,
  storeName: "",
  header: "",
  footer: "Thank you!",
  initializedMerchantId: null,
  headerInitializedMerchantId: null,
  autoPrintOnSuccess: false,
  lastAutoPrintedOrderId: null,
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
    layout:
      persisted.layout === "compact" ||
      persisted.layout === "customer" ||
      persisted.layout === "kitchen"
        ? persisted.layout
        : "standard",
    storeLogo: typeof persisted.storeLogo === "string" ? persisted.storeLogo : null,
    storeName: typeof persisted.storeName === "string" ? persisted.storeName : "",
    header: typeof persisted.header === "string" ? persisted.header : legacyHeader,
    footer: typeof persisted.footer === "string" ? persisted.footer : "Thank you!",
    initializedMerchantId:
      typeof persisted.initializedMerchantId === "string" ? persisted.initializedMerchantId : null,
    headerInitializedMerchantId:
      typeof persisted.headerInitializedMerchantId === "string"
        ? persisted.headerInitializedMerchantId
        : null,
    autoPrintOnSuccess: persisted.autoPrintOnSuccess === true,
    lastAutoPrintedOrderId:
      typeof persisted.lastAutoPrintedOrderId === "string"
        ? persisted.lastAutoPrintedOrderId
        : null,
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
      version: 3,
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

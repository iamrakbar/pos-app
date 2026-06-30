import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TextSize = 'small' | 'normal' | 'large';
export type Alignment = 'left' | 'center' | 'right';
export type InvoiceFormat = 'none' | 'text' | 'barcode' | 'qr';
export type SignatureType = 'none' | 'customer' | 'cashier';

export interface ReceiptSettings {
    textSize: TextSize;
    compactMode: boolean;
    printCustomerName: boolean;
    printCustomerPhone: boolean;
    printCustomerAddress: boolean;
    storeLogo: string | null;
    storeName: string;
    storeAddress1: string;
    storeAddress2: string;
    storePhone: string;
    footer: string;
    alignment: Alignment;
    invoiceFormat: InvoiceFormat;
    signatureType: SignatureType;
    showPrintDate: boolean;
    showTotalQuantity: boolean;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
    textSize: 'normal',
    compactMode: false,
    printCustomerName: false,
    printCustomerPhone: false,
    printCustomerAddress: false,
    storeLogo: null,
    storeName: '',
    storeAddress1: '',
    storeAddress2: '',
    storePhone: '',
    footer: 'Thank you!',
    alignment: 'center',
    invoiceFormat: 'text',
    signatureType: 'none',
    showPrintDate: true,
    showTotalQuantity: true,
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface ReceiptStore {
    settings: ReceiptSettings;
    updateSettings: (patch: Partial<ReceiptSettings>) => void;
    resetSettings: () => void;
}

const receiptStorage =
    Platform.OS === 'web'
        ? createJSONStorage(() => localStorage)
        : createJSONStorage(() => AsyncStorage);

export const useReceiptStore = create<ReceiptStore>()(
    persist(
        (set) => ({
            settings: DEFAULT_RECEIPT_SETTINGS,
            updateSettings: (patch) =>
                set((state) => ({ settings: { ...state.settings, ...patch } })),
            resetSettings: () => set({ settings: DEFAULT_RECEIPT_SETTINGS }),
        }),
        {
            name: 'soeat-receipt-settings',
            storage: receiptStorage,
        }
    )
);

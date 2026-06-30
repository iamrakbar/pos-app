import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionType = 'bluetooth' | 'wifi';
export type PaperWidth = '58mm' | '80mm';

export interface PrinterSettings {
    connection: ConnectionType;
    name: string;
    macAddress: string;
    ipAddress: string;
    paperWidth: PaperWidth;
    cutReceipt: boolean;
    openDrawer: boolean;
    selectedDeviceId: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface PrinterStore {
    settings: PrinterSettings;
    updateSettings: (patch: Partial<PrinterSettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
    connection: 'bluetooth',
    name: '58Printer',
    macAddress: '',
    ipAddress: '',
    paperWidth: '58mm',
    cutReceipt: false,
    openDrawer: false,
    selectedDeviceId: '58printer',
};

const printerStorage =
    Platform.OS === 'web'
        ? createJSONStorage(() => localStorage)
        : createJSONStorage(() => AsyncStorage);

export const usePrinterStore = create<PrinterStore>()(
    persist(
        (set) => ({
            settings: DEFAULT_PRINTER_SETTINGS,
            updateSettings: (patch) =>
                set((state) => ({ settings: { ...state.settings, ...patch } })),
            resetSettings: () => set({ settings: DEFAULT_PRINTER_SETTINGS }),
        }),
        {
            name: 'soeat-printer-settings',
            storage: printerStorage,
        }
    )
);

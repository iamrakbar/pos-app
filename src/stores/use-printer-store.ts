import { zustandStorage } from "@/lib/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ConnectionType = "bluetooth" | "wifi";
export type PaperWidth = "58mm" | "80mm";

export interface PrinterSettings {
  connection: ConnectionType;
  name: string;
  macAddress: string;
  ipAddress: string;
  port: string;
  paperWidth: PaperWidth;
  charactersPerLine: string;
  logoWidthDots: string;
  cutReceipt: boolean;
  openDrawer: boolean;
  selectedDeviceId: string;
}

export interface SavedPrinter extends PrinterSettings {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface PrinterStore {
  printers: SavedPrinter[];
  selectedPrinterId: string;
  settings: PrinterSettings;
  hasHydrated: boolean;
  addPrinter: (printer: PrinterSettings) => SavedPrinter;
  updatePrinter: (id: string, patch: Partial<PrinterSettings>) => void;
  deletePrinter: (id: string) => void;
  selectPrinter: (id: string) => void;
  updateSettings: (patch: Partial<PrinterSettings>) => void;
  resetSettings: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  connection: "bluetooth",
  name: "",
  macAddress: "",
  ipAddress: "",
  port: "9100",
  paperWidth: "58mm",
  charactersPerLine: "32",
  logoWidthDots: "300",
  cutReceipt: false,
  openDrawer: false,
  selectedDeviceId: "",
};

const printerStorage = createJSONStorage(() => zustandStorage);

const createPrinterId = () => `printer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizePrinter = (printer: Partial<PrinterSettings>): PrinterSettings => ({
  ...DEFAULT_PRINTER_SETTINGS,
  ...printer,
  port: printer.port || DEFAULT_PRINTER_SETTINGS.port,
  paperWidth: printer.paperWidth ?? DEFAULT_PRINTER_SETTINGS.paperWidth,
  charactersPerLine: printer.charactersPerLine || (printer.paperWidth === "80mm" ? "46" : "32"),
  logoWidthDots: printer.logoWidthDots || (printer.paperWidth === "80mm" ? "380" : "300"),
  connection: printer.connection ?? DEFAULT_PRINTER_SETTINGS.connection,
});

const createSavedPrinter = (printer: PrinterSettings): SavedPrinter => {
  const now = new Date().toISOString();

  return {
    ...normalizePrinter(printer),
    id: createPrinterId(),
    createdAt: now,
    updatedAt: now,
  };
};

const getSelectedSettings = (printers: SavedPrinter[], selectedPrinterId: string) => {
  const selectedPrinter = printers.find((printer) => printer.id === selectedPrinterId);
  return selectedPrinter ?? printers[0] ?? DEFAULT_PRINTER_SETTINGS;
};

export const usePrinterStore = create<PrinterStore>()(
  persist(
    (set) => ({
      printers: [],
      selectedPrinterId: "",
      settings: DEFAULT_PRINTER_SETTINGS,
      hasHydrated: false,
      addPrinter: (printer) => {
        const nextPrinter = createSavedPrinter(printer);

        set((state) => {
          const printers = [...state.printers, nextPrinter];
          const selectedPrinterId = state.selectedPrinterId || nextPrinter.id;

          return {
            printers,
            selectedPrinterId,
            settings: getSelectedSettings(printers, selectedPrinterId),
          };
        });

        return nextPrinter;
      },
      updatePrinter: (id, patch) =>
        set((state) => {
          const printers = state.printers.map((printer) =>
            printer.id === id
              ? {
                  ...printer,
                  ...patch,
                  updatedAt: new Date().toISOString(),
                }
              : printer
          );
          const selectedPrinterId = printers.some(
            (printer) => printer.id === state.selectedPrinterId
          )
            ? state.selectedPrinterId
            : printers[0]?.id || "";

          return {
            printers,
            selectedPrinterId,
            settings: getSelectedSettings(printers, selectedPrinterId),
          };
        }),
      deletePrinter: (id) =>
        set((state) => {
          const printers = state.printers.filter((printer) => printer.id !== id);
          const selectedPrinterId =
            state.selectedPrinterId === id ? printers[0]?.id || "" : state.selectedPrinterId;

          return {
            printers,
            selectedPrinterId,
            settings: getSelectedSettings(printers, selectedPrinterId),
          };
        }),
      selectPrinter: (id) =>
        set((state) => ({
          selectedPrinterId: id,
          settings: getSelectedSettings(state.printers, id),
        })),
      updateSettings: (patch) =>
        set((state) => {
          if (!state.selectedPrinterId) {
            const nextPrinter = createSavedPrinter({ ...DEFAULT_PRINTER_SETTINGS, ...patch });
            return {
              printers: [nextPrinter],
              selectedPrinterId: nextPrinter.id,
              settings: nextPrinter,
            };
          }

          const printers = state.printers.map((printer) =>
            printer.id === state.selectedPrinterId
              ? {
                  ...printer,
                  ...patch,
                  updatedAt: new Date().toISOString(),
                }
              : printer
          );

          return {
            printers,
            settings: getSelectedSettings(printers, state.selectedPrinterId),
          };
        }),
      resetSettings: () =>
        set({
          printers: [],
          selectedPrinterId: "",
          settings: DEFAULT_PRINTER_SETTINGS,
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "soeat-printer-settings",
      storage: printerStorage,
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<PrinterStore> | undefined;

        if (!state) {
          return {
            printers: [],
            selectedPrinterId: "",
            settings: DEFAULT_PRINTER_SETTINGS,
            hasHydrated: true,
          };
        }

        if (version < 2 && state.settings) {
          const hasPrinterTarget =
            !!state.settings.macAddress || !!state.settings.ipAddress || !!state.settings.name;
          const printers = hasPrinterTarget ? [createSavedPrinter(state.settings)] : [];
          const selectedPrinterId = printers[0]?.id || "";

          return {
            ...state,
            printers,
            selectedPrinterId,
            settings: getSelectedSettings(printers, selectedPrinterId),
            hasHydrated: true,
          };
        }

        const printers = state.printers ?? [];
        const selectedPrinterId = state.selectedPrinterId ?? printers[0]?.id ?? "";

        return {
          ...state,
          printers,
          selectedPrinterId,
          settings: getSelectedSettings(printers, selectedPrinterId),
          hasHydrated: true,
        };
      },
      partialize: (state) => ({
        printers: state.printers,
        selectedPrinterId: state.selectedPrinterId,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

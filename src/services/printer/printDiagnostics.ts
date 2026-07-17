import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "soeat-print-diagnostics";
const MAX_ENTRIES = 100;

export type PrintDiagnostic = {
  id: string;
  orderId: string;
  orderCode: string;
  printerId: string;
  trigger: "auto" | "manual" | "reprint";
  startedAt: string;
  durationMs: number;
  payloadBytes: number;
  result: "sent" | "failed";
  errorCode?: string;
};

export async function appendPrintDiagnostic(entry: PrintDiagnostic): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const entries = stored ? (JSON.parse(stored) as PrintDiagnostic[]) : [];
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([entry, ...entries].slice(0, MAX_ENTRIES))
    );
  } catch {
    // Diagnostics must never block receipt printing.
  }
}

export async function getPrintDiagnostics(): Promise<PrintDiagnostic[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as PrintDiagnostic[]) : [];
}

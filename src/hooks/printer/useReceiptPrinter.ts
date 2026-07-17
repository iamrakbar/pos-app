import {
  PrintError,
  printReceipt as runPrintReceipt,
  type ReceiptOrder,
} from "@/services/printer/PrintService";
import { usePrinterStore } from "@/stores/usePrinterStore";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native";
import { useCallback, useState } from "react";
import { Linking, Platform } from "react-native";

export type PrinterPrompt = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

export function useReceiptPrinter() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [prompt, setPrompt] = useState<PrinterPrompt | null>(null);

  const openBluetoothSettings = useCallback(async () => {
    if (Platform.OS === "android") {
      try {
        const IntentLauncher =
          require("expo-intent-launcher") as typeof import("expo-intent-launcher");
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS);
        return;
      } catch {
        // Fall through to app settings when the platform intent is unavailable.
      }
    }
    await Linking.openSettings();
  }, []);

  const printReceipt = useCallback(
    async (order: ReceiptOrder, trigger: "auto" | "manual" | "reprint" = "manual") => {
      if (isPrinting) return false;
      setIsPrinting(true);
      let didPrint = false;

      try {
        await runPrintReceipt(order, { trigger });
        toast.show({ variant: "success", label: "Receipt sent to printer" });
        didPrint = true;
      } catch (error) {
        const printError =
          error instanceof PrintError
            ? error
            : new PrintError("TRANSMIT_FAILED", "Could not print the receipt.", error);

        switch (printError.code) {
          case "PERMISSION_DENIED":
            setPrompt({
              title: "Bluetooth permission required",
              message: "Allow Bluetooth printer access in system settings, then try again.",
              actionLabel: "Open Settings",
              onAction: Linking.openSettings,
            });
            break;
          case "BLUETOOTH_OFF":
            setPrompt({
              title: "Bluetooth is off",
              message: "Turn on Bluetooth before connecting to the receipt printer.",
              actionLabel: "Bluetooth Settings",
              onAction: openBluetoothSettings,
            });
            break;
          case "NOT_CONFIGURED":
            setPrompt({
              title: "Printer not configured",
              message: printError.message,
              actionLabel: "Pair Printer",
              onAction: () => router.push("/settings/printers" as never),
            });
            break;
          case "LOST_PAIRING": {
            const printer = usePrinterStore.getState();
            if (printer.selectedPrinterId) {
              printer.updatePrinter(printer.selectedPrinterId, {
                macAddress: "",
                selectedDeviceId: "",
              });
            }
            toast.show({
              variant: "warning",
              label: "Printer pairing lost",
              description: "Pair the printer again to continue.",
            });
            router.push("/settings/printers" as never);
            break;
          }
          case "CONNECTION_TIMEOUT":
          case "CONNECTION_FAILED":
            toast.show({
              variant: "danger",
              label: "Cannot connect",
              description: "Ensure printer is on and in range.",
            });
            break;
          default:
            toast.show({
              variant: "danger",
              label: "Print failed",
              description: printError.message,
            });
        }
      }

      setIsPrinting(false);
      return didPrint;
    },
    [isPrinting, openBluetoothSettings, router, toast]
  );

  const handlePromptAction = useCallback(async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  }, [prompt]);

  return { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt };
}

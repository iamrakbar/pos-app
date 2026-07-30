import {
  PrintError,
  printReceipt as runPrintReceipt,
  type ReceiptOrder,
} from "@/services/printer/print-service";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native";
import { useState } from "react";
import { Linking, Platform } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export type PrinterPrompt = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

export function useReceiptPrinter() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [prompt, setPrompt] = useState<PrinterPrompt | null>(null);

  const openBluetoothSettings = async () => {
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
  };

  const printReceipt = async (
    order: ReceiptOrder,
    trigger: "auto" | "manual" | "reprint" = "manual"
  ) => {
    if (isPrinting) return false;
    setIsPrinting(true);
    let didPrint = false;

    try {
      await runPrintReceipt(order, { trigger });
      toast.show({ variant: "success", label: t("printer.receiptSent") });
      didPrint = true;
    } catch (error) {
      const printError =
        error instanceof PrintError
          ? error
          : new PrintError("TRANSMIT_FAILED", t("printer.genericPrintFailure"), error);

      switch (printError.code) {
        case "PERMISSION_DENIED":
          setPrompt({
            title: t("printer.permissionRequired"),
            message: t("printer.permissionDescription"),
            actionLabel: t("printer.openSettings"),
            onAction: Linking.openSettings,
          });
          break;
        case "BLUETOOTH_OFF":
          setPrompt({
            title: t("printer.bluetoothOff"),
            message: t("printer.bluetoothOffDescription"),
            actionLabel: t("printer.bluetoothSettings"),
            onAction: openBluetoothSettings,
          });
          break;
        case "NOT_CONFIGURED":
          setPrompt({
            title: t("printer.notConfigured"),
            message: t("printer.notConfiguredDescription"),
            actionLabel: t("printer.pairPrinter"),
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
            label: t("printer.pairingLost"),
            description: t("printer.pairingLostDescription"),
          });
          router.push("/settings/printers" as never);
          break;
        }
        case "CONNECTION_TIMEOUT":
        case "CONNECTION_FAILED":
          toast.show({
            variant: "danger",
            label: t("printer.cannotConnect"),
            description: t("printer.cannotConnectDescription"),
          });
          break;
        default:
          toast.show({
            variant: "danger",
            label: t("printer.printFailed"),
            description: t("printer.genericPrintFailure"),
          });
      }
    }

    setIsPrinting(false);
    return didPrint;
  };

  const handlePromptAction = async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  };

  return { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt };
}

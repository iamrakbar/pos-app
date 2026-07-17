import {
  extractNumber,
  extractOrderItems,
  extractPaymentName,
  extractTableName,
} from "@/api/mappers/order";
import type { Alignment } from "@haroldtran/react-native-thermal-printer";
import { BLEPrinter, COMMANDS, NetPrinter } from "@haroldtran/react-native-thermal-printer";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import { usePrinterStore } from "@/stores/usePrinterStore";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { formatRupiah } from "@/utils/format";

const PRINTER_PORT = "9100";

type PromptState = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

type ReceiptOrder = App.Data.Merchant.Order.OrderData | App.Data.Merchant.Checkout.CheckoutData;

const paperWidthConfig = {
  "58mm": {
    dottedLine: COMMANDS.HORIZONTAL_LINE.HR3_58MM.slice(0, 32),
    billColumnWidth: [20, 12] as [number, number],
  },
  "80mm": {
    dottedLine: COMMANDS.HORIZONTAL_LINE.HR3_80MM.slice(0, 46),
    billColumnWidth: [30, 16] as [number, number],
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function getBluetoothPermissions() {
  if (Platform.OS !== "android") return [];

  if (Number(Platform.Version) >= 31) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ];
  }

  return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

async function requestBluetoothPermissions(): Promise<{ granted: boolean; blocked: boolean }> {
  const permissions = getBluetoothPermissions();
  if (permissions.length === 0) return { granted: true, blocked: false };

  const results = await PermissionsAndroid.requestMultiple(permissions);
  const granted = permissions.every(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
  );
  const blocked = permissions.some(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
  );

  return { granted, blocked };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCheckoutTableName(order: ReceiptOrder): string | null {
  const rec = asRecord(order);
  const table = asRecord(rec?.table);
  if (table && typeof table.name === "string") return table.name;
  return extractTableName(rec?.orderable);
}

function getOrderSubtotal(order: ReceiptOrder): number {
  const rec = asRecord(order);
  if (typeof rec?.subtotal === "number") return rec.subtotal;

  const pricing = asRecord(rec?.pricing);
  if (typeof pricing?.subtotal === "number") return pricing.subtotal;

  return 0;
}

function getOrderTotal(order: ReceiptOrder): number {
  const rec = asRecord(order);
  if (typeof rec?.total === "number") return rec.total;

  const pricing = asRecord(rec?.pricing);
  if (typeof pricing?.total === "number") return pricing.total;

  return getOrderSubtotal(order);
}

function getOrderFees(order: ReceiptOrder): { name: string; amount: number }[] {
  const rec = asRecord(order);
  const pricing = asRecord(rec?.pricing);
  const pricingFees = pricing?.fees;

  if (Array.isArray(pricingFees)) {
    return pricingFees
      .map((fee) => {
        const feeRec = asRecord(fee);
        return {
          name: typeof feeRec?.name === "string" ? feeRec.name : "Fee",
          amount: extractNumber(feeRec?.amount),
        };
      })
      .filter((fee) => fee.amount > 0);
  }

  const paymentFee = extractNumber(rec?.payment_fee);
  return paymentFee > 0 ? [{ name: "Payment fee", amount: paymentFee }] : [];
}

function getCustomerName(order: ReceiptOrder): string | null {
  const rec = asRecord(order);
  const customer = asRecord(rec?.customer);
  return typeof customer?.name === "string" ? customer.name : null;
}

export function useReceiptPrinter() {
  const router = useRouter();
  const printers = usePrinterStore((state) => state.printers);
  const printerSettings = usePrinterStore((state) => state.settings);
  const hasHydrated = usePrinterStore((state) => state.hasHydrated);
  const receiptSettings = useReceiptStore((state) => state.settings);
  const [isPrinting, setIsPrinting] = useState(false);
  const [prompt, setPrompt] = useState<PromptState | null>(null);

  const openBluetoothSettings = async () => {
    if (Platform.OS === "android") {
      try {
        const IntentLauncher =
          require("expo-intent-launcher") as typeof import("expo-intent-launcher");
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS);
        return;
      } catch {
        await Linking.openSettings();
        return;
      }
    }

    await Linking.openSettings();
  };

  const openPrinterSetup = () => {
    router.push("/settings/printers");
  };

  const promptPrinterSetup = (title = "Printer not configured", message?: string) => {
    setPrompt({
      title,
      message: message ?? "Add and test a printer before printing receipts.",
      actionLabel: "Setup Printer",
      onAction: openPrinterSetup,
    });
  };

  const connectPrinter = async () => {
    if (!hasHydrated) {
      setPrompt({
        title: "Printer settings loading",
        message: "Wait for saved printer settings to finish loading, then try again.",
      });
      return null;
    }

    if (printers.length === 0) {
      promptPrinterSetup("No printer saved", "Add a Bluetooth or network printer before printing.");
      return null;
    }

    if (printerSettings.connection === "bluetooth") {
      const address = printerSettings.macAddress || printerSettings.selectedDeviceId;
      if (!address) {
        promptPrinterSetup(
          "Printer needs setup",
          "Select a Bluetooth device or enter the printer MAC address."
        );
        return null;
      }

      const permission = await requestBluetoothPermissions();
      if (!permission.granted) {
        setPrompt({
          title: "Bluetooth permission required",
          message: permission.blocked
            ? "Bluetooth printer access is blocked. Enable Bluetooth permissions in system settings."
            : "Bluetooth printer access is required to print receipts.",
          actionLabel: "Open Settings",
          onAction: () => Linking.openSettings(),
        });
        return null;
      }

      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(address);
      return BLEPrinter;
    }

    const host = printerSettings.ipAddress.trim();
    const port = Number(printerSettings.port || PRINTER_PORT);

    if (!host) {
      promptPrinterSetup("Printer needs setup", "Enter the network printer IP address.");
      return null;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      promptPrinterSetup("Printer needs setup", "Enter a valid printer port between 1 and 65535.");
      return null;
    }

    await NetPrinter.init();
    await NetPrinter.connectPrinter(host, port);
    return NetPrinter;
  };

  const printReceipt = async (order: ReceiptOrder) => {
    setIsPrinting(true);

    try {
      const PrinterDriver = await connectPrinter();
      if (!PrinterDriver) return false;

      const boldOn = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
      const boldOff = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
      const center = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
      const left = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
      const size2h = COMMANDS.TEXT_FORMAT.TXT_2HEIGHT;
      const sizeNormal = COMMANDS.TEXT_FORMAT.TXT_NORMAL;
      const paperConfig = paperWidthConfig[printerSettings.paperWidth];
      const columnAlign: Alignment[] = ["left", "right"];
      const reportPrintError = (printError: Error) => {
        setPrompt({ title: "Print failed", message: printError.message });
      };

      const items = extractOrderItems(order.products);
      const fees = getOrderFees(order);
      const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
      const storeName = receiptSettings.storeName || "SOEAT POS";
      const addressLines = [
        receiptSettings.storeAddress1,
        receiptSettings.storeAddress2,
        receiptSettings.storePhone,
      ].filter(Boolean);
      const tableName = getCheckoutTableName(order);
      const customerName = getCustomerName(order);
      const paymentName = extractPaymentName(order.payment);

      PrinterDriver.printText(`${center}${boldOn}${size2h}${storeName}${sizeNormal}${boldOff}\n`, {
        onError: reportPrintError,
      });
      for (const line of addressLines) {
        PrinterDriver.printText(`${center}${line}`, { onError: reportPrintError });
      }
      PrinterDriver.printText(`${center}${paperConfig.dottedLine}`, { onError: reportPrintError });
      PrinterDriver.printText(`${left}Order       : ${order.code}`, { onError: reportPrintError });
      PrinterDriver.printText(`Tanggal     : ${formatDateTime(order.created_at)}`, {
        onError: reportPrintError,
      });
      PrinterDriver.printText(
        `Tipe        : ${order.order_type === "dine-in" ? "Dine-in" : "Takeaway"}`,
        { onError: reportPrintError }
      );
      if (tableName) {
        PrinterDriver.printText(`Table       : ${tableName}`, { onError: reportPrintError });
      }
      if (receiptSettings.printCustomerName) {
        PrinterDriver.printText(`Pelanggan   : ${customerName ?? "Walk-in"}`, {
          onError: reportPrintError,
        });
      }
      PrinterDriver.printText(`Pembayaran  : ${paymentName}`, { onError: reportPrintError });
      PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });

      for (const item of items) {
        PrinterDriver.printText(item.name, { onError: reportPrintError });
        PrinterDriver.printColumnsText(
          [`${item.qty} x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal)],
          paperConfig.billColumnWidth,
          columnAlign,
          ["", ""],
          { onError: reportPrintError }
        );
        for (const addOn of item.addOns) {
          for (const option of addOn.options) {
            PrinterDriver.printColumnsText(
              [
                `  + ${addOn.name}: ${option.name}`,
                option.price > 0 ? formatRupiah(option.price) : "",
              ],
              paperConfig.billColumnWidth,
              columnAlign,
              ["", ""],
              { onError: reportPrintError }
            );
          }
        }
      }

      PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });
      PrinterDriver.printColumnsText(
        ["Subtotal", formatRupiah(getOrderSubtotal(order))],
        paperConfig.billColumnWidth,
        columnAlign,
        ["", ""],
        { onError: reportPrintError }
      );
      for (const fee of fees) {
        PrinterDriver.printColumnsText(
          [fee.name, formatRupiah(fee.amount)],
          paperConfig.billColumnWidth,
          columnAlign,
          ["", ""],
          { onError: reportPrintError }
        );
      }
      if (receiptSettings.showTotalQuantity) {
        PrinterDriver.printText(`Item = ${items.length} - Qty = ${totalQty}`, {
          onError: reportPrintError,
        });
      }
      PrinterDriver.printText("TOTAL", { onError: reportPrintError });
      PrinterDriver.printText(
        `${boldOn}${size2h}${formatRupiah(getOrderTotal(order))}${sizeNormal}${boldOff}\n`,
        { onError: reportPrintError }
      );
      if (order.notes) {
        PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });
        PrinterDriver.printText(`Catatan: ${order.notes}`, { onError: reportPrintError });
      }
      if (receiptSettings.footer) {
        PrinterDriver.printText(`${paperConfig.dottedLine}`, { onError: reportPrintError });
        PrinterDriver.printText(`${center}${receiptSettings.footer}`, {
          onError: reportPrintError,
        });
      }
      if (printerSettings.openDrawer) {
        PrinterDriver.printText(COMMANDS.CASH_DRAWER.CD_KICK_2, { onError: reportPrintError });
      }
      PrinterDriver.printBill("", {
        cut: printerSettings.cutReceipt,
        beep: true,
        onError: reportPrintError,
      });

      setPrompt({
        title: "Sent to printer",
        message: `Receipt ${order.code} was sent to the printer.`,
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not print the receipt.";
      const canOpenBluetoothSettings =
        printerSettings.connection === "bluetooth" && /bluetooth/i.test(message);

      setPrompt({
        title: "Print failed",
        message,
        actionLabel: canOpenBluetoothSettings
          ? Platform.OS === "android"
            ? "Open Bluetooth Settings"
            : "Open Settings"
          : printers.length === 0
            ? "Setup Printer"
            : undefined,
        onAction: canOpenBluetoothSettings
          ? openBluetoothSettings
          : printers.length === 0
            ? openPrinterSetup
            : undefined,
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePromptAction = async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  };

  return {
    isPrinting,
    prompt,
    setPrompt,
    handlePromptAction,
    printReceipt,
  };
}

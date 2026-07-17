import { BLEPrinter, NetPrinter } from "@haroldtran/react-native-thermal-printer";
import { File } from "expo-file-system";
import { usePrinterStore, type PrinterSettings } from "@/stores/usePrinterStore";
import { useReceiptStore } from "@/stores/useReceiptStore";
import {
  bytesToBase64,
  formatCalibrationPayload,
  formatReceiptPayload,
  type ReceiptOrder,
} from "./escpos";
import { PrintError } from "./errors";
import { ensureBluetoothPermissions } from "./permissions";
import { appendPrintDiagnostic } from "./printDiagnostics";

const CONNECTION_TIMEOUT_MS = 5_000;

type RawPrinterDriver = {
  printRaw: (base64Payload: string) => void;
  printImage: (
    imageUri: string,
    options: { imageWidth: number; align: "center"; onError?: (error: Error) => void }
  ) => void;
  printImageBase64: (
    imageBase64: string,
    options: { imageWidth: number; align: "center"; onError?: (error: Error) => void }
  ) => void;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function printLogo(
  driver: RawPrinterDriver,
  logoUri: string,
  imageWidth: number
): Promise<void> {
  const options = { imageWidth, align: "center" as const };

  if (/^https?:\/\//i.test(logoUri)) {
    driver.printImage(logoUri, options);
    return;
  }

  const dataUriMatch = logoUri.match(/^data:image\/[^;]+;base64,(.+)$/i);
  const base64 = dataUriMatch?.[1] ?? (await new File(logoUri).base64());
  driver.printImageBase64(base64, options);
}

function withTimeout<T>(operation: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new PrintError("CONNECTION_TIMEOUT", "Printer connection timed out.")),
      CONNECTION_TIMEOUT_MS
    );
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function connectBluetooth(settings: PrinterSettings): Promise<RawPrinterDriver> {
  await ensureBluetoothPermissions();

  try {
    // Native init checks both adapter availability and whether it is enabled.
    await BLEPrinter.init();
  } catch (error) {
    throw new PrintError("BLUETOOTH_OFF", "Bluetooth is turned off.", error);
  }

  // The native driver treats any non-null socket for the same MAC as connected,
  // even when that socket has gone stale. Always reset it before reconnecting.
  await BLEPrinter.closeConn();

  const address = settings.macAddress || settings.selectedDeviceId;
  const bondedDevices = await BLEPrinter.getDeviceList();
  if (
    !bondedDevices.some(
      (device) => device.inner_mac_address.toUpperCase() === address.toUpperCase()
    )
  ) {
    throw new PrintError("LOST_PAIRING", "The saved printer is no longer paired.");
  }

  try {
    await withTimeout(BLEPrinter.connectPrinter(address));
    return BLEPrinter as unknown as RawPrinterDriver;
  } catch (error) {
    if (error instanceof PrintError) {
      await BLEPrinter.closeConn();
      throw error;
    }
    throw new PrintError("CONNECTION_FAILED", errorMessage(error), error);
  }
}

async function connectNetwork(settings: PrinterSettings): Promise<RawPrinterDriver> {
  const host = settings.ipAddress.trim();
  const port = Number(settings.port || "9100");
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new PrintError("NOT_CONFIGURED", "Configure a valid printer IP address and port.");
  }

  await NetPrinter.init();
  await NetPrinter.closeConn();
  try {
    await withTimeout(NetPrinter.connectPrinter(host, port, CONNECTION_TIMEOUT_MS));
    return NetPrinter as unknown as RawPrinterDriver;
  } catch (error) {
    if (error instanceof PrintError) {
      await NetPrinter.closeConn();
      throw error;
    }
    throw new PrintError("CONNECTION_FAILED", errorMessage(error), error);
  }
}

async function performPrintReceipt(order: ReceiptOrder): Promise<number> {
  // Zustand persistence is backed by AsyncStorage; hydration provides the local default printer.
  const printerState = usePrinterStore.getState();
  if (!printerState.hasHydrated || printerState.printers.length === 0) {
    throw new PrintError("NOT_CONFIGURED", "Add and select a default printer before printing.");
  }

  const settings = printerState.settings;
  const target =
    settings.connection === "bluetooth"
      ? settings.macAddress || settings.selectedDeviceId
      : settings.ipAddress;
  if (!target) throw new PrintError("NOT_CONFIGURED", "Select a default printer before printing.");

  const driver =
    settings.connection === "bluetooth"
      ? await connectBluetooth(settings)
      : await connectNetwork(settings);
  const payload = formatReceiptPayload(
    order,
    useReceiptStore.getState().settings,
    settings.paperWidth,
    settings.charactersPerLine,
    settings.cutReceipt,
    settings.openDrawer
  );

  try {
    const receiptSettings = useReceiptStore.getState().settings;
    // Feed before the first printable content so the logo/header is clear of the paper edge.
    driver.printRaw(bytesToBase64(Uint8Array.from([0x0a, 0x0a])));
    if (receiptSettings.layout !== "kitchen" && receiptSettings.storeLogo) {
      await printLogo(
        driver,
        receiptSettings.storeLogo,
        Number(settings.logoWidthDots) || (settings.paperWidth === "80mm" ? 380 : 300)
      );
    }
    driver.printRaw(bytesToBase64(payload));
    return payload.byteLength;
  } catch (error) {
    throw new PrintError("TRANSMIT_FAILED", "Could not send receipt data to the printer.", error);
  }
}

export async function printReceipt(
  order: ReceiptOrder,
  options: { trigger?: "auto" | "manual" | "reprint" } = {}
): Promise<void> {
  const started = Date.now();
  const printerState = usePrinterStore.getState();
  try {
    const payloadBytes = await performPrintReceipt(order);
    void appendPrintDiagnostic({
      id: `print-${started}-${order.id}`,
      orderId: order.id,
      orderCode: order.code,
      printerId: printerState.selectedPrinterId,
      trigger: options.trigger ?? "manual",
      startedAt: new Date(started).toISOString(),
      durationMs: Date.now() - started,
      payloadBytes,
      result: "sent",
    });
  } catch (error) {
    void appendPrintDiagnostic({
      id: `print-${started}-${order.id}`,
      orderId: order.id,
      orderCode: order.code,
      printerId: printerState.selectedPrinterId,
      trigger: options.trigger ?? "manual",
      startedAt: new Date(started).toISOString(),
      durationMs: Date.now() - started,
      payloadBytes: 0,
      result: "failed",
      errorCode: error instanceof PrintError ? error.code : "UNKNOWN",
    });
    throw error;
  }
}

export async function printCalibrationReceipt(settings: PrinterSettings): Promise<void> {
  const driver =
    settings.connection === "bluetooth"
      ? await connectBluetooth(settings)
      : await connectNetwork(settings);
  driver.printRaw(
    bytesToBase64(formatCalibrationPayload(settings.paperWidth, settings.charactersPerLine))
  );
}

export type { ReceiptOrder } from "./escpos";
export { PrintError } from "./errors";

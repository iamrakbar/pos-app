import type { PaperWidth } from "@/stores/usePrinterStore";
import type { ReceiptSettings } from "@/stores/useReceiptStore";
import { formatRupiah } from "@/utils/format";
import { toReceiptData } from "./receiptData";

export type ReceiptOrder =
  App.Data.Merchant.Order.OrderData | App.Data.Merchant.Checkout.CheckoutData;

type EncoderState = { bytes: number[] };
const ESC = 0x1b;
const GS = 0x1d;

function append(state: EncoderState, ...bytes: number[]) {
  state.bytes.push(...bytes);
}

function text(state: EncoderState, value: string) {
  state.bytes.push(...new TextEncoder().encode(value));
}

function line(state: EncoderState, value = "") {
  text(state, `${value}\n`);
}

function align(state: EncoderState, value: "left" | "center" | "right") {
  append(state, ESC, 0x61, value === "left" ? 0 : value === "center" ? 1 : 2);
}

function bold(state: EncoderState, enabled: boolean) {
  append(state, ESC, 0x45, enabled ? 1 : 0);
}

export function formatReceiptRow(left: string, right: string, columns: number) {
  const gap = Math.max(1, columns - left.length - right.length);
  return `${left.slice(0, columns - right.length - 1)}${" ".repeat(gap)}${right}`;
}

export function wrapReceiptText(value: string, columns: number): string[] {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > columns) {
      if (current) lines.push(current);
      for (let offset = 0; offset < word.length; offset += columns) {
        lines.push(word.slice(offset, offset + columns));
      }
      current = "";
    } else if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= columns) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatReceiptPayload(
  order: ReceiptOrder,
  receipt: ReceiptSettings,
  paperWidth: PaperWidth,
  charactersPerLine: string,
  shouldCut: boolean,
  shouldOpenDrawer: boolean
): Uint8Array {
  const state: EncoderState = { bytes: [] };
  const defaultColumns = paperWidth === "80mm" ? 46 : 32;
  const configuredColumns = Number(charactersPerLine);
  const columns =
    Number.isInteger(configuredColumns) && configuredColumns >= 24 && configuredColumns <= 64
      ? configuredColumns
      : defaultColumns;
  const separator = "-".repeat(columns);
  const data = toReceiptData(order);
  const isKitchen = receipt.layout === "kitchen";
  const isCompact = receipt.layout === "compact";
  const sectionGap = () => {
    if (!isCompact) line(state);
  };
  const contentLine = (value: string) =>
    wrapReceiptText(value, columns).forEach((wrappedLine) => line(state, wrappedLine));
  const priceRow = (left: string, right: string) =>
    line(state, formatReceiptRow(left, right, columns));

  append(state, ESC, 0x40); // initialize
  sectionGap();
  align(state, "center");
  bold(state, true);
  line(state, receipt.storeName || "SOEAT POS");
  bold(state, false);
  if (!isKitchen)
    receipt.header
      .split("\n")
      .filter(Boolean)
      .forEach((value) => line(state, value.trim()));
  sectionGap();
  line(state, separator);
  sectionGap();
  align(state, "left");
  contentLine(`Order: ${data.code}`);
  contentLine(`Date: ${data.date}`);
  contentLine(`Type: ${data.orderType}`);
  if (data.table) contentLine(`Table: ${data.table}`);
  if (!isKitchen) contentLine(`Payment: ${data.payment}`);
  if (!isKitchen) contentLine(`Payment status: ${data.paymentStatus}`);
  sectionGap();
  line(state, separator);
  sectionGap();

  data.items.forEach((item, index) => {
    contentLine(item.name);
    priceRow(`${item.qty} x ${formatRupiah(item.price)}`, formatRupiah(item.subtotal));
    for (const option of item.addOns) {
      priceRow(`+ ${option.group}: ${option.name}`, option.price ? formatRupiah(option.price) : "");
    }
    if (item.notes) contentLine(`Note: ${item.notes}`);
    if (!isCompact && index < data.items.length - 1) line(state);
  });

  const totalQty = data.items.reduce((sum, item) => sum + item.qty, 0);
  sectionGap();
  if (!isKitchen) {
    line(state, separator);
    sectionGap();
    priceRow("Subtotal", formatRupiah(data.subtotal));
    for (const discount of data.discounts) {
      priceRow(discount.name, `-${formatRupiah(discount.amount)}`);
    }
    for (const fee of data.fees) {
      priceRow(fee.name, formatRupiah(fee.amount));
    }
    if (data.tax) priceRow(data.tax.name, formatRupiah(data.tax.amount));
    sectionGap();
  }
  contentLine(`${data.items.length} items - ${totalQty} qty`);
  if (!isKitchen) {
    sectionGap();
    bold(state, true);
    priceRow("TOTAL", formatRupiah(data.total));
    bold(state, false);
  }
  if (data.notes) {
    line(state);
    contentLine(`Note: ${data.notes}`);
  }
  if (!isKitchen && receipt.footer) {
    sectionGap();
    line(state, separator);
    line(state);
    align(state, "center");
    line(state, receipt.footer);
  }
  line(state);
  line(state);
  line(state);
  line(state);
  if (shouldOpenDrawer) append(state, ESC, 0x70, 0x00, 0x19, 0xfa);
  if (shouldCut) append(state, GS, 0x56, 0x00); // full cut

  return Uint8Array.from(state.bytes);
}

export function formatCalibrationPayload(
  paperWidth: PaperWidth,
  charactersPerLine: string
): Uint8Array {
  const state: EncoderState = { bytes: [] };
  const fallback = paperWidth === "80mm" ? 46 : 32;
  const parsed = Number(charactersPerLine);
  const columns = Number.isInteger(parsed) && parsed >= 24 && parsed <= 64 ? parsed : fallback;
  const ruler = Array.from({ length: columns }, (_, index) => String((index + 1) % 10)).join("");

  append(state, ESC, 0x40);
  line(state);
  align(state, "center");
  bold(state, true);
  line(state, "PRINT CALIBRATION");
  bold(state, false);
  line(state, `${paperWidth} / ${columns} characters`);
  line(state);
  align(state, "left");
  line(state, ruler);
  line(state, "|" + "-".repeat(Math.max(0, columns - 2)) + "|");
  line(state, "LEFT");
  align(state, "center");
  line(state, "CENTER");
  align(state, "right");
  line(state, "RIGHT");
  align(state, "left");
  line(state);
  line(state, "The ruler should fit on one line.");
  line(state, "If it wraps, reduce characters per line.");
  line(state);
  line(state);
  line(state);
  line(state);
  return Uint8Array.from(state.bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const value = (a << 16) | (b << 8) | c;
    result += alphabet[(value >> 18) & 63];
    result += alphabet[(value >> 12) & 63];
    result += i + 1 < bytes.length ? alphabet[(value >> 6) & 63] : "=";
    result += i + 2 < bytes.length ? alphabet[value & 63] : "=";
  }
  return result;
}

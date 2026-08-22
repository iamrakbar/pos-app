import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import { captureRef, releaseCapture } from "react-native-view-shot";
import type { RefObject } from "react";
import type { View } from "react-native";

const RECEIPT_CACHE_PREFIX = "receipt-";
const RECEIPT_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type ReceiptExportErrorCode =
  | "CAPTURE_FAILED"
  | "PERMISSION_DENIED"
  | "MEDIA_LIBRARY_UNAVAILABLE"
  | "SHARING_UNAVAILABLE"
  | "SHARING_FAILED";

export class ReceiptExportError extends Error {
  constructor(
    public readonly code: ReceiptExportErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ReceiptExportError";
  }
}

export type ReceiptExportResult = {
  uri: string;
  filename: string;
  width: number;
};

export function sanitizeOrderCode(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return sanitized || "order";
}

export function createReceiptFilename(orderCode: string, timestamp = Date.now()): string {
  return `${RECEIPT_CACHE_PREFIX}${sanitizeOrderCode(orderCode)}-${timestamp}.png`;
}

async function cleanupReceiptCache(): Promise<void> {
  try {
    const cache = new Directory(Paths.cache);
    if (!cache.exists) return;
    const cutoff = Date.now() - RECEIPT_CACHE_MAX_AGE_MS;
    for (const entry of cache.list()) {
      if (!(entry instanceof File) || !entry.uri.endsWith(".png")) continue;
      const filename = entry.uri.split("/").pop() ?? "";
      if (!filename.startsWith(RECEIPT_CACHE_PREFIX)) continue;
      const modified = entry.info().modificationTime ?? 0;
      if (modified > 0 && modified < cutoff) entry.delete();
    }
  } catch {
    // Cache cleanup is opportunistic and must never block an export.
  }
}

export async function captureReceiptPng(
  ref: RefObject<View | null>,
  orderCode: string,
  width: number
): Promise<ReceiptExportResult> {
  await cleanupReceiptCache();
  const filename = createReceiptFilename(orderCode);
  let capturedUri: string | null = null;
  try {
    capturedUri = await captureRef(ref.current, {
      format: "png",
      quality: 1,
      result: "tmpfile",
      width,
    });
    const source = new File(capturedUri);
    const destination = new File(Paths.cache, filename);
    destination.create({ overwrite: true });
    destination.write(await source.bytes());
    return { uri: destination.uri, filename, width };
  } catch (error) {
    throw new ReceiptExportError(
      "CAPTURE_FAILED",
      error instanceof Error ? error.message : "Could not create the receipt image.",
      { cause: error }
    );
  } finally {
    if (capturedUri) releaseCapture(capturedUri);
  }
}

export async function saveReceiptImage(exported: ReceiptExportResult): Promise<void> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
    if (!permission.granted) {
      throw new ReceiptExportError("PERMISSION_DENIED", "Photo-library permission was denied.");
    }
    await MediaLibrary.Asset.create(exported.uri);
  } catch (error) {
    if (error instanceof ReceiptExportError) throw error;
    throw new ReceiptExportError(
      "MEDIA_LIBRARY_UNAVAILABLE",
      error instanceof Error ? error.message : "Photo-library saving is unavailable.",
      { cause: error }
    );
  }
}

export async function shareReceiptImage(
  exported: ReceiptExportResult,
  orderCode: string
): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new ReceiptExportError("SHARING_UNAVAILABLE", "Sharing is unavailable on this device.");
    }
    await Sharing.shareAsync(exported.uri, {
      mimeType: "image/png",
      dialogTitle: `Receipt ${orderCode}`,
      UTI: "public.png",
    });
  } catch (error) {
    if (error instanceof ReceiptExportError) throw error;
    throw new ReceiptExportError(
      "SHARING_FAILED",
      error instanceof Error ? error.message : "Could not share the receipt image.",
      { cause: error }
    );
  }
}

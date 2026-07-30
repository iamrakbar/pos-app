type PaperWidth = "58mm" | "80mm";

export const RECEIPT_LOGO_MAX_WIDTH_DOTS: Record<PaperWidth, number> = {
  "58mm": 200,
  "80mm": 280,
};

const RECEIPT_PRINTABLE_WIDTH_DOTS: Record<PaperWidth, number> = {
  "58mm": 384,
  "80mm": 576,
};

const RECEIPT_PREVIEW_WIDTH: Record<PaperWidth, number> = {
  "58mm": 300,
  "80mm": 400,
};

export function getReceiptLogoWidthDots(
  paperWidth: PaperWidth,
  configuredWidth?: string
): number {
  const parsedWidth = Number(configuredWidth);
  const maxWidth = RECEIPT_LOGO_MAX_WIDTH_DOTS[paperWidth];

  return Number.isFinite(parsedWidth) && parsedWidth > 0
    ? Math.min(parsedWidth, maxWidth)
    : maxWidth;
}

export function getReceiptLogoPreviewWidth(
  paperWidth: PaperWidth,
  configuredWidth?: string
): number {
  return Math.round(
    (getReceiptLogoWidthDots(paperWidth, configuredWidth) /
      RECEIPT_PRINTABLE_WIDTH_DOTS[paperWidth]) *
      RECEIPT_PREVIEW_WIDTH[paperWidth]
  );
}

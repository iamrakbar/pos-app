const ORDER_BASE_URL = process.env.EXPO_PUBLIC_ORDER_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

export function getMerchantOrderUrl(slug: string | null | undefined): string | null {
  if (!ORDER_BASE_URL || !slug) return null;
  return `${ORDER_BASE_URL}/m/${encodeURIComponent(slug)}`;
}

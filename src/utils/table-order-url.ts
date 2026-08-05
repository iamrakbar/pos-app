const ORDER_BASE_URL = process.env.EXPO_PUBLIC_ORDER_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

export function getTableOrderUrl(tableId: string): string | null {
  if (!ORDER_BASE_URL || !tableId) return null;
  return `${ORDER_BASE_URL}/t/${encodeURIComponent(tableId)}`;
}

export function extractOriginalPrice(
  discount: App.Data.Merchant.Pos.ProductDiscountData | null,
  basePrice: number
): number | null {
  if (!discount) return null;
  if (typeof discount.price === "number" && discount.price !== basePrice) return basePrice;
  return null;
}

export function extractSellingPrice(
  discount: App.Data.Merchant.Pos.ProductDiscountData | null,
  basePrice: number
): number {
  return typeof discount?.price === "number" ? discount.price : basePrice;
}

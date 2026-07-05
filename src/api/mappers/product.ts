export function extractOriginalPrice(
    discount: App.Data.Merchant.Pos.ProductDiscountData | null,
    currentPrice: number
): number | null {
    if (!discount) return null;
    if (typeof discount.price === 'number' && discount.price !== currentPrice) return discount.price;
    return null;
}

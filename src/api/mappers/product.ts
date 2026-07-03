import { asRecord } from './shared';

// `/pos/products` types `stock`/`image`/`category`/`discount` as opaque
// `Array<any>` in the generated types, but the endpoint's own Postman
// documentation confirms `stock: {enabled, qty}` and `image: {default,
// thumbnail}` are plain objects. `discount`'s shape isn't documented at all —
// read it defensively and verify against the live server before trusting it.
export type RawPosProduct = Omit<App.Data.Merchant.Pos.ProductData, 'stock' | 'image'> & {
    stock: { enabled: boolean; qty: number } | null;
    image: { default: string | null; thumbnail: string | null } | null;
};

export function extractCategoryId(category: unknown): string | null {
    const rec = asRecord(category);
    return rec && typeof rec.id === 'string' ? rec.id : null;
}

export function extractOriginalPrice(discount: unknown, currentPrice: number): number | null {
    const rec = asRecord(discount);
    if (!rec) return null;
    if (typeof rec.original_price === 'number') return rec.original_price;
    if (typeof rec.price === 'number' && rec.price !== currentPrice) return rec.price;
    return null;
}

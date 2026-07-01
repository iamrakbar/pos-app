// `payment`/`pricing` on CheckoutData are typed `any[]` by Scramble (opaque, shape
// unconfirmed against a live response). Read defensively and fall back to values
// already known client-side rather than assuming a shape.

function asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
}

export function extractQrUrl(payment: unknown): string | null {
    const rec = asRecord(payment);
    if (!rec) return null;
    if (typeof rec.qr_url === 'string') return rec.qr_url;
    if (typeof rec.qr_string === 'string') return rec.qr_string;
    return null;
}

export function extractTotal(pricing: unknown, fallback: number): number {
    const rec = asRecord(pricing);
    if (rec) {
        if (typeof rec.total === 'number') return rec.total;
        if (typeof rec.grand_total === 'number') return rec.grand_total;
    }
    return fallback;
}

import { asRecord } from './shared';

// `payment`, `pricing`, and `payment_details` are opaque in generated types.
// Read defensively and fall back to values already known client-side rather
// than assuming a single backend snapshot shape.
function asReadableRecord(value: unknown): Record<string, unknown> | null {
    const rec = asRecord(value);
    if (rec) return rec;
    if (Array.isArray(value)) return asRecord(value[0]);
    return null;
}

export function extractQrUrl(payment: unknown): string | null {
    const rec = asReadableRecord(payment);
    if (!rec) return null;
    if (typeof rec.qr_url === 'string') return rec.qr_url;
    if (typeof rec.qr_image_url === 'string') return rec.qr_image_url;
    if (typeof rec.qrImageUrl === 'string') return rec.qrImageUrl;
    if (typeof rec.qr_string === 'string') return rec.qr_string;
    if (typeof rec.qr_content === 'string') return rec.qr_content;
    if (typeof rec.qr_code === 'string') return rec.qr_code;
    if (typeof rec.payment_url === 'string') return rec.payment_url;
    if (typeof rec.image_url === 'string') return rec.image_url;
    if (typeof rec.code === 'string') return rec.code;
    if (typeof rec.extra === 'string') return rec.extra;
    return null;
}

export function extractTotal(pricing: unknown, fallback: number): number {
    const rec = asReadableRecord(pricing);
    if (rec) {
        if (typeof rec.total === 'number') return rec.total;
        if (typeof rec.grand_total === 'number') return rec.grand_total;
        if (typeof rec.amount === 'number') return rec.amount;
        if (typeof rec.total_amount === 'number') return rec.total_amount;
    }
    return fallback;
}

export function extractPaymentQrUrl(checkout: { payment_details?: unknown; payment: unknown }): string | null {
    return extractQrUrl(checkout.payment_details) ?? extractQrUrl(checkout.payment);
}

export function extractPaymentExpiry(value: unknown): string | null {
    const rec = asReadableRecord(value);
    if (!rec) return null;

    const candidates = [
        rec.expires_at,
        rec.expired_at,
        rec.expiry_at,
        rec.expiry_time,
        rec.expiration_time,
        rec.expired_time,
        rec.valid_until,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' || typeof candidate === 'number') {
            const timestamp = new Date(candidate).getTime();
            if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString();
        }
    }

    return null;
}

export function isExpired(expiresAt: string | null | undefined): boolean {
    if (!expiresAt) return false;
    const timestamp = new Date(expiresAt).getTime();
    return Number.isFinite(timestamp) && timestamp <= Date.now();
}

export function extractPaymentReference(value: unknown): string | null {
    const rec = asReadableRecord(value);
    if (!rec) return null;

    const candidates = [
        rec.reference,
        rec.code,
        rec.extra,
        rec.reference_no,
        rec.transaction_id,
        rec.transaction_no,
        rec.payment_code,
        rec.va_number,
        rec.account_number,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) return candidate;
        if (typeof candidate === 'number') return String(candidate);
    }

    return null;
}

export function extractPaymentDetailsRows(value: unknown): { label: string; value: string }[] {
    const rec = asReadableRecord(value);
    if (!rec) return [];

    const labels: Record<string, string> = {
        reference: 'Reference',
        code: 'Payment code',
        extra: 'Payment details',
        reference_no: 'Reference',
        transaction_id: 'Transaction ID',
        transaction_no: 'Transaction ID',
        payment_code: 'Payment code',
        va_number: 'VA number',
        account_number: 'Account number',
        bank_name: 'Bank',
        merchant_name: 'Merchant',
        amount: 'Amount',
        total_amount: 'Amount',
        expires_at: 'Expires at',
        expired_at: 'Expires at',
        expiry_at: 'Expires at',
        expiry_time: 'Expires at',
        valid_until: 'Expires at',
    };

    return Object.entries(labels).flatMap(([key, label]) => {
        const raw = rec[key];
        if (raw === null || raw === undefined || raw === '') return [];
        if (typeof raw === 'string' || typeof raw === 'number') return [{ label, value: String(raw) }];
        return [];
    });
}

export function extractCheckoutTotal(
    checkout: {
        payment_details?: unknown;
        pricing: unknown;
        total?: unknown;
    },
    fallback: number
): number {
    return extractTotal(
        checkout.payment_details,
        extractTotal(checkout.pricing, typeof checkout.total === 'number' ? checkout.total : fallback)
    );
}

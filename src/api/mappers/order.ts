// Scramble typed several nested fields as `any[]` because their exact backend shape
// isn't confirmed by the Postman collection's examples. Treat them as opaque objects
// and read defensively rather than assuming a shape.

function asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
}

export function extractStatusLabel(status: unknown): string {
    const rec = asRecord(status);
    if (rec) {
        if (typeof rec.label === 'string') return rec.label;
        if (typeof rec.name === 'string') return rec.name;
        if (typeof rec.value === 'string') return rec.value;
    }
    if (typeof status === 'string') return status;
    return 'Unknown';
}

export function extractStatusColor(status: unknown): 'success' | 'warning' | 'danger' | 'default' {
    const label = extractStatusLabel(status).toLowerCase();
    if (['completed', 'success', 'paid', 'process'].some((s) => label.includes(s))) return 'success';
    if (['pending', 'new', 'waiting'].some((s) => label.includes(s))) return 'warning';
    if (['cancelled', 'canceled', 'rejected', 'failed'].some((s) => label.includes(s))) return 'danger';
    return 'default';
}

export function extractCustomerName(customer: unknown): string | null {
    const rec = asRecord(customer);
    if (rec && typeof rec.name === 'string') return rec.name;
    return null;
}

export function extractPaymentName(payment: unknown): string {
    const rec = asRecord(payment);
    if (rec && typeof rec.name === 'string') return rec.name;
    return 'Unknown';
}

export function extractFeeRate(fees: unknown): number {
    if (Array.isArray(fees) && fees.length > 0) {
        const first = asRecord(fees[0]);
        if (first) {
            if (typeof first.percentage === 'number') return first.percentage / 100;
            if (typeof first.value === 'number' && first.type === 'percentage') return first.value / 100;
            if (typeof first.rate === 'number') return first.rate;
        }
    }
    const rec = asRecord(fees);
    if (rec) {
        if (typeof rec.percentage === 'number') return rec.percentage / 100;
        if (typeof rec.rate === 'number') return rec.rate;
    }
    return 0;
}

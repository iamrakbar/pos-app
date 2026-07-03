// Several backend response fields are typed opaquely (`Array<any>`) because
// Scramble couldn't resolve them to a concrete DTO shape. Read them
// defensively via this helper rather than assuming a shape.
export function asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
}

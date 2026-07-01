export type ApiErrorOptions = {
    status: number;
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
    raw?: unknown;
};

export class ApiError extends Error {
    status: number;
    code?: string;
    errors?: Record<string, string[]>;
    raw?: unknown;

    constructor(opts: ApiErrorOptions) {
        super(opts.message);
        this.name = 'ApiError';
        this.status = opts.status;
        this.code = opts.code;
        this.errors = opts.errors;
        this.raw = opts.raw;
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) return error.message;
    if (error instanceof Error) return error.message;
    return 'Something went wrong';
}

import { router } from 'expo-router';
import { useAuth } from '@/stores/useAuth';
import { API_BASE_URL, API_ROOT_URL, API_TIMEOUT_MS } from './config';
import { ApiError } from './ApiError';

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    auth?: boolean;
    /** Use API_ROOT_URL instead of API_BASE_URL (for endpoints outside /merchant, e.g. /customer/payments). */
    root?: boolean;
};

function buildUrl(path: string, query: RequestOptions['query'], root?: boolean): string {
    const base = root ? API_ROOT_URL : API_BASE_URL;
    const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }
    }
    return url.toString();
}

async function safeJson(res: Response): Promise<any> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

let loggingOut = false;

function handleUnauthorized(): void {
    if (loggingOut) return;
    loggingOut = true;
    useAuth.getState().logout();
    router.replace('/sign-in');
    setTimeout(() => {
        loggingOut = false;
    }, 500);
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const url = buildUrl(path, opts.query, opts.root);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.auth !== false) {
        const token = useAuth.getState().token;
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url, {
            method: opts.method ?? 'GET',
            headers,
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
            signal: controller.signal,
        });

        const json = await safeJson(res);

        if (!res.ok) {
            if (res.status === 401) handleUnauthorized();
            throw new ApiError({
                status: res.status,
                message: json?.message ?? `Request failed (${res.status})`,
                code: json?.error_code,
                errors: json?.errors,
                raw: json,
            });
        }

        return json as T;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if ((error as Error)?.name === 'AbortError') {
            throw new ApiError({ status: 0, message: 'Request timed out' });
        }
        throw new ApiError({ status: 0, message: (error as Error)?.message ?? 'Network error' });
    } finally {
        clearTimeout(timeout);
    }
}

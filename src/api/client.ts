import { router } from 'expo-router';
import { useAuth } from '@/stores/useAuth';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { ApiError } from './ApiError';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { t } from '@/locales';

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    auth?: boolean;
};

function buildUrl(path: string, query: RequestOptions['query']): string {
    const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
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

function forceLogout(): void {
    useAuth.getState().logout();
    router.replace('/sign-in');
}

// POST /refresh takes no body — it authenticates via the current (possibly
// stale but still parseable) access token in the Authorization header and
// returns a fresh one. Calls fetch() directly rather than apiRequest() to
// avoid recursing into this same 401 handling.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const token = useAuth.getState().token;
    if (!token) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/refresh`, {
            method: 'POST',
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const json = await safeJson(res);
        const newToken = json?.data?.access_token;
        if (!res.ok || typeof newToken !== 'string') return null;
        useAuth.getState().setToken(newToken);
        return newToken;
    } catch {
        return null;
    }
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}, isRetry = false): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const url = buildUrl(path, opts.query);
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
        useNetworkStore.getState().setOnline();

        if (!res.ok) {
            if (res.status === 401 && opts.auth !== false && !isRetry && path !== '/refresh' && path !== '/login') {
                refreshPromise ??= refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
                const newToken = await refreshPromise;
                if (newToken) return apiRequest<T>(path, opts, true);
                forceLogout();
            }
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
            useNetworkStore.getState().setOffline();
            throw new ApiError({ status: 0, message: t('offline.timeoutMessage'), code: 'NETWORK_TIMEOUT' });
        }
        useNetworkStore.getState().setOffline();
        throw new ApiError({
            status: 0,
            message: t('offline.errorMessage'),
            code: 'NETWORK_ERROR',
            raw: error,
        });
    } finally {
        clearTimeout(timeout);
    }
}

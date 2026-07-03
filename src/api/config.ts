const API_ROOT_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const API_BASE_URL = `${API_ROOT_URL}/api/v0/merchant`;

export const API_TIMEOUT_MS = 30_000;

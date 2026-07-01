export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://soeat-app.test/api/v1/merchant';

// GET /customer/payments and /merchant/orders(...) live outside the /merchant/:merchantId/* prefix.
export const API_ROOT_URL = API_BASE_URL.replace(/\/merchant\/?$/, '');

export const API_TIMEOUT_MS = 30_000;

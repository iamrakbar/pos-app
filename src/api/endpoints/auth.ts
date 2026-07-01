import { apiRequest } from '../client';

export function login(
    body: App.Requests.Merchant.Auth.LoginRequest,
): Promise<App.Data.Merchant.Auth.AuthTokenData> {
    return apiRequest<App.Data.Merchant.Auth.AuthTokenData>('/login', {
        method: 'POST',
        body,
        auth: false,
    });
}

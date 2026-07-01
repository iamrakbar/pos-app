import { apiRequest } from '../client';

type CheckoutResponse = { success: boolean; data: App.Data.Merchant.Checkout.CheckoutData };

export function checkout(
    merchantId: string,
    body: App.Requests.Merchant.Checkout.CheckoutRequest,
): Promise<CheckoutResponse> {
    return apiRequest<CheckoutResponse>(`/${merchantId}/checkout`, { method: 'POST', body });
}

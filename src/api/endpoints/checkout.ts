import { apiRequest } from '../client';

export type MerchantCheckoutData = App.Data.Merchant.Checkout.CheckoutData;

type CheckoutResponse = { success: boolean; data: MerchantCheckoutData };

export function checkout(
    merchantId: string,
    body: App.Requests.Merchant.Checkout.CheckoutRequest
): Promise<CheckoutResponse> {
    return apiRequest<CheckoutResponse>(`/${merchantId}/checkout`, { method: 'POST', body });
}

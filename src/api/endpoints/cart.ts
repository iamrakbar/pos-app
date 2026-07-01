import { apiRequest } from '../client';

type CartValidateResponse = { success: boolean };

export function validateCart(
    merchantId: string,
    body: App.Requests.Merchant.Checkout.CartValidateRequest,
): Promise<CartValidateResponse> {
    return apiRequest<CartValidateResponse>(`/${merchantId}/cart/validate`, {
        method: 'POST',
        body,
    });
}

import { apiRequest } from '../client';

type GuestResponse = { data: App.Data.Merchant.Guest.GuestData };
type GuestsResponse = { data: App.Data.Merchant.Guest.GuestData[] };

export function createGuest(
    merchantId: string,
    body: App.Requests.Merchant.Guest.StoreGuestRequest,
): Promise<GuestResponse> {
    return apiRequest<GuestResponse>(`/${merchantId}/guests`, { method: 'POST', body });
}

export function listGuests(merchantId: string): Promise<GuestsResponse> {
    return apiRequest<GuestsResponse>(`/${merchantId}/guests`);
}

import { apiRequest } from '../client';

type GuestsResponse = { data: App.Data.Merchant.Guest.GuestData[] };

export function listGuests(merchantId: string): Promise<GuestsResponse> {
    return apiRequest<GuestsResponse>(`/${merchantId}/guests`);
}

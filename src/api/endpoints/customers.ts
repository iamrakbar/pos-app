import { apiRequest } from '../client';

type CustomerSearchResponse = { data: App.Data.Merchant.Customer.CustomerSearchData[] };

export function searchCustomers(merchantId: string, q: string): Promise<CustomerSearchResponse> {
    return apiRequest<CustomerSearchResponse>(`/${merchantId}/customers/search`, {
        query: { q },
    });
}

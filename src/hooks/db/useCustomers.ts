import { useQuery } from '@tanstack/react-query';
import { searchCustomers } from '@/api/endpoints/customers';
import { useAuth } from '@/stores/useAuth';

export function useCustomerSearch(query: string) {
    const merchantId = useAuth((s) => s.merchantId);
    return useQuery({
        queryKey: ['customer_search', merchantId, query],
        queryFn: async () => (await searchCustomers(merchantId!, query)).data,
        enabled: !!merchantId && query.trim().length >= 2,
    });
}

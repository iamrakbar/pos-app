import { useQuery } from '@tanstack/react-query';
import { listGuests } from '@/api/endpoints/guests';
import { useAuth } from '@/stores/use-auth';

export function useGuests() {
    const merchantId = useAuth((s) => s.merchantId);
    return useQuery({
        queryKey: ['guests', merchantId],
        queryFn: async () => (await listGuests(merchantId!)).data,
        enabled: !!merchantId,
    });
}

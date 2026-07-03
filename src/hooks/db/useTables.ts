import { useQuery } from '@tanstack/react-query';
import { getPosTables } from '@/api/endpoints/tables';
import { useAuth } from '@/stores/useAuth';
import type { POSTable } from '@/types/pos';

const TABLES_STALE_TIME_MS = 5 * 60 * 1000;

export function useTables() {
    const merchantId = useAuth((s) => s.merchantId);
    return useQuery<POSTable[]>({
        queryKey: ['tables', merchantId],
        queryFn: async () => (await getPosTables(merchantId!)).data,
        enabled: !!merchantId,
        staleTime: TABLES_STALE_TIME_MS,
    });
}

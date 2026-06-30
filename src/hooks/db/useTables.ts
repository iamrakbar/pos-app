import { useQuery } from '@tanstack/react-query';
import { db } from '@/db';
import { tables } from '@/db/schema';
import type { POSTable } from '@/types/pos';

export function useTables() {
    return useQuery<POSTable[]>({
        queryKey: ['tables'],
        queryFn: () =>
            db.select().from(tables).all().map((t) => ({
                id: t.id,
                area_id: t.area_id,
                area_name: t.area_name,
                name: t.name,
                pax: t.pax,
            })),
    });
}

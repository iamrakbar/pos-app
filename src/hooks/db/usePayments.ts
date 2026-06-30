import { useQuery } from '@tanstack/react-query';
import { db } from '@/db';
import { payment_methods } from '@/db/schema';
import type { POSPaymentGroup } from '@/types/pos';

export function usePaymentGroups() {
    return useQuery<POSPaymentGroup[]>({
        queryKey: ['payment_groups'],
        queryFn: () => {
            const rows = db.select().from(payment_methods).all();
            const groupMap = new Map<string, POSPaymentGroup>();
            for (const row of rows) {
                if (!groupMap.has(row.group_type)) {
                    groupMap.set(row.group_type, {
                        group_type: row.group_type,
                        group_label: row.group_label,
                        payments: [],
                    });
                }
                groupMap.get(row.group_type)!.payments.push({
                    id: row.id,
                    code: row.code,
                    name: row.name,
                    fee_rate: row.fee_rate,
                });
            }
            return Array.from(groupMap.values());
        },
    });
}

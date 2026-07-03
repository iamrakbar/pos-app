import { useQuery } from '@tanstack/react-query';
import { getPaymentGroups } from '@/api/endpoints/payments';
import { extractFee } from '@/api/mappers/order';
import type { POSPaymentGroup } from '@/types/pos';

const PAYMENTS_STALE_TIME_MS = 30 * 60 * 1000;

export function usePaymentGroups() {
    return useQuery<POSPaymentGroup[]>({
        queryKey: ['payment_groups'],
        queryFn: async () => {
            const res = await getPaymentGroups();
            return res.data.map((group) => ({
                group_type: group.group_type,
                group_label: group.group_label,
                payments: group.payments.map((payment) => {
                    const fee = extractFee(payment.fees);
                    return {
                        id: payment.id,
                        code: payment.code,
                        name: payment.name,
                        fee_unit: fee.unit,
                        fee_value: fee.value,
                    };
                }),
            }));
        },
        staleTime: PAYMENTS_STALE_TIME_MS,
    });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentStatus } from '@/api/endpoints/orders';

export function usePaymentStatus(orderId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => (await getPaymentStatus(orderId!)).data,
        onSuccess: (data) => {
            queryClient.setQueryData(['order', orderId], (old: App.Data.Merchant.Order.OrderData | undefined) =>
                old ? { ...old, payment_status: data } : old,
            );
        },
    });
}

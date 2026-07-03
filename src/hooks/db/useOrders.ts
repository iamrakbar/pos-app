import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrder, getOrders, updateOrderStatus } from '@/api/endpoints/orders';

const ORDERS_PER_PAGE = 20;
const ORDER_DETAIL_STALE_TIME_MS = 30 * 1000;

export function useOrders(orderStatus?: string) {
    return useInfiniteQuery({
        queryKey: ['orders', orderStatus],
        queryFn: ({ pageParam }) =>
            getOrders({ order_status: orderStatus, per_page: ORDERS_PER_PAGE, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage.meta;
            if (meta && meta.current_page < meta.last_page) return meta.current_page + 1;
            return undefined;
        },
    });
}

export function useOrder(id: string | undefined) {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => getOrder(id!).then((res) => res.data),
        enabled: !!id,
        staleTime: ORDER_DETAIL_STALE_TIME_MS,
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: App.Requests.Merchant.Order.UpdateOrderStatusRequest['status']; reason?: string | null }) =>
            updateOrderStatus(id, { status, reason }),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', id] });
        },
    });
}

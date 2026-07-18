import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import { getOrder, getOrders, updateOrderStatus } from "@/api/endpoints/orders";
import { getOrderStatus } from "@/api/mappers/order";

const ORDERS_PER_PAGE = 20;
const ORDER_DETAIL_STALE_TIME_MS = 30 * 1000;

type OrdersResponse = Awaited<ReturnType<typeof getOrders>>;
type OrderStatusValue = App.Requests.Merchant.Order.UpdateOrderStatusRequest["status"];

function getOptimisticStatus(
  status: OrderStatusValue
): App.Data.Merchant.Order.OrderStatusDetailData {
  const presentation = getOrderStatus(status);

  return {
    value: status,
    label: presentation.label,
    color: presentation.color,
    is_final: status === "completed" || status === "rejected",
    can_be_cancelled: status !== "completed" && status !== "rejected",
    next_status: status === "process" ? "completed" : null,
  };
}

function getStatusValue(status: unknown): string | null {
  if (Array.isArray(status)) {
    const first = status[0];
    if (first && typeof first === "object" && "value" in first && typeof first.value === "string") {
      return first.value;
    }
    return null;
  }
  if (
    status &&
    typeof status === "object" &&
    "value" in status &&
    typeof status.value === "string"
  ) {
    return status.value;
  }
  if (typeof status === "string") return status;
  return null;
}

function patchOrderListPages(
  pages: InfiniteData<OrdersResponse> | undefined,
  orderId: string,
  status: unknown,
  filterStatus?: unknown
) {
  if (!pages) return pages;

  const nextStatusValue = getStatusValue(status);
  const filter = typeof filterStatus === "string" ? filterStatus : undefined;

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      data: page.data.reduce<App.Data.Merchant.Order.OrderListData[]>((orders, order) => {
        if (order.id !== orderId) {
          orders.push(order);
          return orders;
        }

        if (filter && nextStatusValue !== filter) return orders;
        orders.push({
          ...order,
          order_status: status as App.Data.Merchant.Order.OrderListData["order_status"],
        });
        return orders;
      }, []),
    })),
  };
}

function patchCachedOrderStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  status: unknown
) {
  queryClient.setQueryData(["order", id], (old: App.Data.Merchant.Order.OrderData | undefined) =>
    old
      ? {
          ...old,
          order_status: status as App.Data.Merchant.Order.OrderStatusDetailData,
        }
      : old
  );

  const cachedOrderLists = queryClient.getQueriesData<InfiniteData<OrdersResponse>>({
    queryKey: ["orders"],
  });
  for (const [queryKey, data] of cachedOrderLists) {
    queryClient.setQueryData(
      queryKey,
      patchOrderListPages(data, id, status, Array.isArray(queryKey) ? queryKey[1] : undefined)
    );
  }
}

export function useOrders(orderStatus?: string) {
  return useInfiniteQuery({
    queryKey: ["orders", orderStatus],
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
    queryKey: ["order", id],
    queryFn: () => getOrder(id!).then((res) => res.data),
    enabled: !!id,
    staleTime: ORDER_DETAIL_STALE_TIME_MS,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: App.Requests.Merchant.Order.UpdateOrderStatusRequest["status"];
      reason?: string | null;
    }) => updateOrderStatus(id, { status, reason }),
    onMutate: async ({ id, status }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["orders"] }),
        queryClient.cancelQueries({ queryKey: ["order", id] }),
      ]);

      const previousOrder = queryClient.getQueryData<App.Data.Merchant.Order.OrderData>([
        "order",
        id,
      ]);
      const previousOrderLists = queryClient.getQueriesData<InfiniteData<OrdersResponse>>({
        queryKey: ["orders"],
      }) as [QueryKey, InfiniteData<OrdersResponse> | undefined][];

      patchCachedOrderStatus(queryClient, id, getOptimisticStatus(status));

      return { previousOrder, previousOrderLists };
    },
    onError: (_error, { id }, context) => {
      queryClient.setQueryData(["order", id], context?.previousOrder);
      for (const [queryKey, data] of context?.previousOrderLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (data, { id }) => {
      patchCachedOrderStatus(queryClient, id, data.data.order_status);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });
}

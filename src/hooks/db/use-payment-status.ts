import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { getPaymentStatus } from "@/api/endpoints/orders";

type OrdersResponse = {
  data: App.Data.Merchant.Order.OrderListData[];
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
  links?: unknown;
};

function toPaymentStatusDetail(
  data: App.Data.Merchant.Order.PaymentStatusData
): App.Data.Merchant.Order.OrderPaymentStatusDetailData {
  return {
    value: data.payment_status,
    label: data.payment_status_label,
    color: data.payment_status_color,
    is_successful: data.is_successful,
  };
}

function patchOrderPaymentStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string | undefined,
  data: App.Data.Merchant.Order.PaymentStatusData
) {
  if (!orderId) return;

  const status = toPaymentStatusDetail(data);

  queryClient.setQueryData(
    ["order", orderId],
    (old: App.Data.Merchant.Order.OrderData | undefined) =>
      old ? { ...old, payment_status: status } : old
  );

  queryClient.setQueriesData<InfiniteData<OrdersResponse>>({ queryKey: ["orders"] }, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    payment_status:
                      status as unknown as App.Data.Merchant.Order.OrderListData["payment_status"],
                  }
                : order
            ),
          })),
        }
      : old
  );
}

export function usePaymentStatus(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await getPaymentStatus(orderId!)).data,
    onSuccess: (data) => {
      patchOrderPaymentStatus(queryClient, orderId, data);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });
}

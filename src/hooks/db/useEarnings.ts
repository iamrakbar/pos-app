import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/api/endpoints/orders";

const EARNINGS_PAGE_SIZE = 100;

export function useEarningsOrders(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["earnings", dateFrom, dateTo],
    queryFn: async () => {
      const orders: App.Data.Merchant.Order.OrderListData[] = [];
      let page = 1;
      let lastPage = 1;

      do {
        const response = await getOrders({
          order_status: "completed",
          date_from: dateFrom,
          date_to: dateTo,
          per_page: EARNINGS_PAGE_SIZE,
          page,
        });
        orders.push(...response.data);
        lastPage = response.meta?.last_page ?? page;
        page += 1;
      } while (page <= lastPage);

      return orders;
    },
    staleTime: 60 * 1000,
  });
}

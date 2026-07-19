import { useQuery } from "@tanstack/react-query";
import { getEarnings } from "@/api/endpoints/earnings";
import { useAuth } from "@/stores/useAuth";

const EARNINGS_PAGE_SIZE = 50;

export function useEarnings(dateFrom: string, dateTo: string) {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: ["earnings", merchantId, dateFrom, dateTo],
    queryFn: async () => {
      const earnings: App.Data.Merchant.Earnings.EarningData[] = [];
      let page = 1;
      let lastPage = 1;

      do {
        const response = await getEarnings(merchantId!, {
          dateFrom,
          dateTo,
          perPage: EARNINGS_PAGE_SIZE,
          page,
        });
        earnings.push(...response.data);
        lastPage = response.meta?.last_page ?? page;
        page += 1;
      } while (page <= lastPage);

      return earnings;
    },
    enabled: !!merchantId && !!dateFrom && !!dateTo,
    staleTime: 60 * 1000,
  });
}

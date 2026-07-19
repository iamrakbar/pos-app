import { getDashboard } from "@/api/endpoints/dashboard";
import { useAuth } from "@/stores/useAuth";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useDashboard(startDate: string, endDate: string) {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: ["dashboard", merchantId, startDate, endDate],
    queryFn: async () =>
      (
        await getDashboard(merchantId!, {
          start_date: startDate,
          end_date: endDate,
        })
      ).data,
    enabled: !!merchantId && !!startDate && !!endDate,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

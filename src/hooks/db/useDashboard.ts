import { getDashboard } from "@/api/endpoints/dashboard";
import { useAuth } from "@/stores/useAuth";
import { useQuery } from "@tanstack/react-query";

export function useDashboard() {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: ["dashboard", merchantId],
    queryFn: async () => (await getDashboard(merchantId!)).data,
    enabled: !!merchantId,
    staleTime: 30 * 1000,
  });
}

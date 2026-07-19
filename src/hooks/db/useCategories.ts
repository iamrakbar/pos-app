import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/api/endpoints/categories";
import { useAuth } from "@/stores/useAuth";
import type { POSCategory } from "@/types/pos";

export function useCategories() {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: ["categories", merchantId],
    queryFn: async (): Promise<POSCategory[]> =>
      (await getCategories(merchantId!)).data.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });
}

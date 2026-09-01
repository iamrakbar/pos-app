import { useInfiniteQuery } from "@tanstack/react-query";
import { getSuppliers, type SupplierListParams } from "@/api/endpoints/suppliers";
import { useAuth } from "@/stores/use-auth";

const SUPPLIERS_PER_PAGE = 25;

export function useSuppliers(params: Omit<SupplierListParams, "page" | "perPage"> = {}) {
  const merchantId = useAuth((state) => state.merchantId);

  return useInfiniteQuery({
    queryKey: ["suppliers", merchantId, params],
    queryFn: ({ pageParam }) =>
      getSuppliers(merchantId!, {
        ...params,
        page: pageParam,
        perPage: SUPPLIERS_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    enabled: !!merchantId,
  });
}

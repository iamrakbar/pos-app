import { useInfiniteQuery } from "@tanstack/react-query";
import { getIngredients, type IngredientListParams } from "@/api/endpoints/ingredients";
import { useAuth } from "@/stores/use-auth";

const INGREDIENTS_PER_PAGE = 50;

export function useIngredients(params: Omit<IngredientListParams, "page" | "perPage"> = {}) {
  const merchantId = useAuth((state) => state.merchantId);

  return useInfiniteQuery({
    queryKey: ["ingredients", merchantId, params],
    queryFn: ({ pageParam }) =>
      getIngredients(merchantId!, {
        ...params,
        page: pageParam,
        perPage: INGREDIENTS_PER_PAGE,
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

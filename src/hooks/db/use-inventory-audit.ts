import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getInventoryMovements,
  getInventoryOperations,
  type InventoryMovementListParams,
  type InventoryOperationListParams,
} from "@/api/endpoints/inventory-audit";
import { useAuth } from "@/stores/use-auth";

const AUDIT_PER_PAGE = 25;

export function useInventoryMovements(
  params: Omit<InventoryMovementListParams, "page" | "perPage"> = {}
) {
  const merchantId = useAuth((state) => state.merchantId);

  return useInfiniteQuery({
    queryKey: ["inventory-movements", merchantId, params],
    queryFn: ({ pageParam }) =>
      getInventoryMovements(merchantId!, {
        ...params,
        page: pageParam,
        perPage: AUDIT_PER_PAGE,
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

export function useInventoryOperations(
  params: Omit<InventoryOperationListParams, "page" | "perPage"> = {}
) {
  const merchantId = useAuth((state) => state.merchantId);

  return useInfiniteQuery({
    queryKey: ["inventory-operations", merchantId, params],
    queryFn: ({ pageParam }) =>
      getInventoryOperations(merchantId!, {
        ...params,
        page: pageParam,
        perPage: AUDIT_PER_PAGE,
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

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustIngredientStock,
  createIngredient,
  deleteIngredient,
  getIngredient,
  getIngredients,
  recordIngredientMovement,
  updateIngredient,
  type IngredientListParams,
} from "@/api/endpoints/ingredients";
import { useAuth } from "@/stores/use-auth";

const INGREDIENTS_PER_PAGE = 50;

export const ingredientKeys = {
  all: (merchantId: string | null) => ["ingredients", merchantId] as const,
  list: (merchantId: string | null, params: IngredientListParams) =>
    ["ingredients", merchantId, "list", params] as const,
  detail: (merchantId: string | null, ingredientId: string) =>
    ["ingredients", merchantId, "detail", ingredientId] as const,
};

export function useIngredients(params: Omit<IngredientListParams, "page" | "perPage"> = {}) {
  const merchantId = useAuth((state) => state.merchantId);

  return useInfiniteQuery({
    queryKey: ingredientKeys.list(merchantId, params),
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

export function useIngredient(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: ingredientKeys.detail(merchantId, ingredientId),
    queryFn: async () => (await getIngredient(merchantId!, ingredientId)).data,
    enabled: !!merchantId && ingredientId !== "new",
  });
}

function useInvalidateIngredients() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  return async (ingredientId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ingredientKeys.all(merchantId) }),
      ingredientId
        ? queryClient.invalidateQueries({
            queryKey: ingredientKeys.detail(merchantId, ingredientId),
          })
        : Promise.resolve(),
    ]);
  };
}

function useInvalidateIngredientInventory(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  return async (operationId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ingredientKeys.all(merchantId) }),
      queryClient.invalidateQueries({ queryKey: ingredientKeys.detail(merchantId, ingredientId) }),
      queryClient.invalidateQueries({ queryKey: ["inventory-overview", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-movements", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-operations", merchantId] }),
      operationId
        ? queryClient.invalidateQueries({
            queryKey: ["inventory-operation", merchantId, operationId],
          })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateIngredient() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateIngredients = useInvalidateIngredients();

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Ingredient.StoreIngredientRequest) =>
      (await createIngredient(merchantId!, values)).data,
    onSuccess: async (ingredient) => invalidateIngredients(ingredient.id),
  });
}

export function useUpdateIngredient(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateIngredients = useInvalidateIngredients();

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Ingredient.UpdateIngredientRequest) =>
      (await updateIngredient(merchantId!, ingredientId, values)).data,
    onSuccess: async () => invalidateIngredients(ingredientId),
  });
}

export function useAdjustIngredientStock(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateIngredientInventory = useInvalidateIngredientInventory(ingredientId);

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Inventory.AdjustmentRequest) =>
      (await adjustIngredientStock(merchantId!, ingredientId, values)).data,
    onSuccess: async (operation) => invalidateIngredientInventory(operation.id),
  });
}

export function useRecordIngredientMovement(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateIngredientInventory = useInvalidateIngredientInventory(ingredientId);

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Ingredient.MovementRequest) =>
      (await recordIngredientMovement(merchantId!, ingredientId, values)).data,
    onSuccess: async (operation) => invalidateIngredientInventory(operation.id),
  });
}

export function useDeleteIngredient() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateIngredients = useInvalidateIngredients();

  return useMutation({
    mutationFn: async (ingredientId: string) => deleteIngredient(merchantId!, ingredientId),
    onSuccess: async () => invalidateIngredients(),
  });
}

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
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
type Ingredient = App.Data.Merchant.Inventory.IngredientData;
type IngredientListPage = Awaited<ReturnType<typeof getIngredients>>;
type IngredientListCache = InfiniteData<IngredientListPage>;
type IngredientInventoryMutationContext = {
  previousDetail: Ingredient | undefined;
  previousLists: [QueryKey, IngredientListCache | undefined][];
};

export const ingredientKeys = {
  all: (merchantId: string | null) => ["ingredients", merchantId] as const,
  list: (merchantId: string | null, params: IngredientListParams) =>
    ["ingredients", merchantId, "list", params] as const,
  detail: (merchantId: string | null, ingredientId: string) =>
    ["ingredients", merchantId, "detail", ingredientId] as const,
};

function ingredientListQueries(merchantId: string | null) {
  return {
    queryKey: ingredientKeys.all(merchantId),
    predicate: (query: { queryKey: QueryKey }) => query.queryKey[2] === "list",
  };
}

function updateIngredientInventoryCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  ingredientId: string,
  update: (ingredient: Ingredient) => Ingredient
): void {
  queryClient.setQueryData<Ingredient>(
    ingredientKeys.detail(merchantId, ingredientId),
    (ingredient) => (ingredient?.id === ingredientId ? update(ingredient) : ingredient)
  );
  queryClient.setQueriesData<IngredientListCache>(ingredientListQueries(merchantId), (cache) =>
    cache
      ? {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            data: page.data.map((ingredient) =>
              ingredient.id === ingredientId ? update(ingredient) : ingredient
            ),
          })),
        }
      : cache
  );
}

function restoreIngredientInventoryCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  ingredientId: string,
  context: IngredientInventoryMutationContext
): void {
  queryClient.setQueryData(ingredientKeys.detail(merchantId, ingredientId), context.previousDetail);
  for (const [queryKey, cache] of context.previousLists) {
    queryClient.setQueryData(queryKey, cache);
  }
}

async function snapshotIngredientInventoryCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  ingredientId: string
): Promise<IngredientInventoryMutationContext> {
  await queryClient.cancelQueries({ queryKey: ingredientKeys.all(merchantId) });
  return {
    previousDetail: queryClient.getQueryData<Ingredient>(
      ingredientKeys.detail(merchantId, ingredientId)
    ),
    previousLists: queryClient.getQueriesData<IngredientListCache>(
      ingredientListQueries(merchantId)
    ),
  };
}

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
  const queryClient = useQueryClient();
  const invalidateIngredients = useInvalidateIngredients();

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Ingredient.UpdateIngredientRequest) =>
      (await updateIngredient(merchantId!, ingredientId, values)).data,
    onMutate: async (values) => {
      const context = await snapshotIngredientInventoryCaches(
        queryClient,
        merchantId,
        ingredientId
      );
      updateIngredientInventoryCaches(queryClient, merchantId, ingredientId, (ingredient) => ({
        ...ingredient,
        ...(values.name === undefined ? {} : { name: values.name }),
        ...(values.base_unit === undefined ? {} : { base_unit: values.base_unit }),
        ...(values.reorder_point === undefined ? {} : { reorder_point: values.reorder_point }),
        ...(values.cost_per_unit === undefined ? {} : { cost_per_unit: values.cost_per_unit }),
        ...(values.active === undefined ? {} : { active: values.active }),
      }));
      return context;
    },
    onError: (_error, _values, context) => {
      if (context) {
        restoreIngredientInventoryCaches(queryClient, merchantId, ingredientId, context);
      }
    },
    onSettled: async () => invalidateIngredients(ingredientId),
  });
}

export function useAdjustIngredientStock(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateIngredientInventory = useInvalidateIngredientInventory(ingredientId);

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Inventory.AdjustmentRequest) =>
      (await adjustIngredientStock(merchantId!, ingredientId, values)).data,
    onMutate: async (values) => {
      const context = await snapshotIngredientInventoryCaches(
        queryClient,
        merchantId,
        ingredientId
      );
      updateIngredientInventoryCaches(queryClient, merchantId, ingredientId, (ingredient) => ({
        ...ingredient,
        current_stock: values.target_balance,
      }));
      return context;
    },
    onError: (_error, _values, context) => {
      if (context) {
        restoreIngredientInventoryCaches(queryClient, merchantId, ingredientId, context);
      }
    },
    onSettled: async (operation) => invalidateIngredientInventory(operation?.id),
  });
}

export function useRecordIngredientMovement(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateIngredientInventory = useInvalidateIngredientInventory(ingredientId);

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Ingredient.MovementRequest) =>
      (await recordIngredientMovement(merchantId!, ingredientId, values)).data,
    onMutate: async (values) => {
      const context = await snapshotIngredientInventoryCaches(
        queryClient,
        merchantId,
        ingredientId
      );
      const stockDelta = values.type === "purchase" ? values.quantity : -values.quantity;
      updateIngredientInventoryCaches(queryClient, merchantId, ingredientId, (ingredient) => ({
        ...ingredient,
        current_stock: ingredient.current_stock + stockDelta,
      }));
      return context;
    },
    onError: (_error, _values, context) => {
      if (context) {
        restoreIngredientInventoryCaches(queryClient, merchantId, ingredientId, context);
      }
    },
    onSettled: async (operation) => invalidateIngredientInventory(operation?.id),
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

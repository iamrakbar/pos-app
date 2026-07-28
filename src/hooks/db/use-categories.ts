import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getCategory,
  getCategories,
  reorderCategories,
  updateCategory,
  type CategoryListParams,
  type ReorderCategoriesRequest,
} from "@/api/endpoints/categories";
import { useAuth } from "@/stores/use-auth";
import type { POSCategory } from "@/types/pos";

const CATEGORY_STALE_TIME_MS = 5 * 60 * 1000;

const categoryKeys = {
  all: (merchantId: string | null) => ["categories", merchantId] as const,
  list: (merchantId: string | null, params: CategoryListParams) =>
    ["categories", merchantId, "list", params] as const,
  detail: (merchantId: string | null, categoryId: string) =>
    ["categories", merchantId, "detail", categoryId] as const,
};

export function useCategories() {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: categoryKeys.list(merchantId, { active: true, sort: "position", perPage: 50 }),
    queryFn: async (): Promise<POSCategory[]> =>
      (
        await getCategories(merchantId!, {
          active: true,
          sort: "position",
          perPage: 50,
        })
      ).data.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    enabled: !!merchantId,
    staleTime: CATEGORY_STALE_TIME_MS,
  });
}

export function useManagementCategories(params: CategoryListParams = {}) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: categoryKeys.list(merchantId, params),
    queryFn: async () => (await getCategories(merchantId!, params)).data,
    enabled: !!merchantId,
    staleTime: CATEGORY_STALE_TIME_MS,
  });
}

export function useCategory(categoryId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: categoryKeys.detail(merchantId, categoryId),
    queryFn: async () => (await getCategory(merchantId!, categoryId)).data,
    enabled: !!merchantId && categoryId !== "new",
    staleTime: CATEGORY_STALE_TIME_MS,
  });
}

function useInvalidateCategories() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  return async (categoryId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: categoryKeys.all(merchantId) }),
      queryClient.invalidateQueries({ queryKey: ["management-products", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] }),
      categoryId
        ? queryClient.invalidateQueries({ queryKey: categoryKeys.detail(merchantId, categoryId) })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateCategory() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Category.StoreCategoryRequest) =>
      (await createCategory(merchantId!, values)).data,
    onSuccess: async (category) => invalidateCategories(category.id),
  });
}

export function useUpdateCategory(categoryId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Category.UpdateCategoryRequest) =>
      (await updateCategory(merchantId!, categoryId, values)).data,
    onSuccess: async () => invalidateCategories(categoryId),
  });
}

export function useDeleteCategory() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: async (categoryId: string) => deleteCategory(merchantId!, categoryId),
    onSuccess: async (_response, categoryId) => invalidateCategories(categoryId),
  });
}

export function useReorderCategories() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: async (body: ReorderCategoriesRequest) =>
      (await reorderCategories(merchantId!, body)).data,
    onSuccess: async () => invalidateCategories(),
  });
}

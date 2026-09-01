import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
  type SupplierListParams,
} from "@/api/endpoints/suppliers";
import { useAuth } from "@/stores/use-auth";

const SUPPLIERS_PER_PAGE = 25;

export const supplierKeys = {
  all: (merchantId: string | null) => ["suppliers", merchantId] as const,
  list: (merchantId: string | null, params: SupplierListParams) =>
    ["suppliers", merchantId, "list", params] as const,
  detail: (merchantId: string | null, supplierId: string) =>
    ["suppliers", merchantId, "detail", supplierId] as const,
};

export function useSuppliers(params: Omit<SupplierListParams, "page" | "perPage"> = {}) {
  const merchantId = useAuth((state) => state.merchantId);

  return useInfiniteQuery({
    queryKey: supplierKeys.list(merchantId, params),
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

export function useSupplier(supplierId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: supplierKeys.detail(merchantId, supplierId),
    queryFn: async () => (await getSupplier(merchantId!, supplierId)).data,
    enabled: !!merchantId && supplierId !== "new",
  });
}

function useInvalidateSuppliers() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  return async (supplierId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: supplierKeys.all(merchantId) }),
      supplierId
        ? queryClient.invalidateQueries({ queryKey: supplierKeys.detail(merchantId, supplierId) })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateSupplier() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateSuppliers = useInvalidateSuppliers();
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Supplier.StoreSupplierRequest) =>
      (await createSupplier(merchantId!, values)).data,
    onSuccess: async (supplier) => invalidateSuppliers(supplier.id),
  });
}

export function useUpdateSupplier(supplierId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateSuppliers = useInvalidateSuppliers();
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Supplier.UpdateSupplierRequest) =>
      (await updateSupplier(merchantId!, supplierId, values)).data,
    onSuccess: async () => invalidateSuppliers(supplierId),
  });
}

export function useDeleteSupplier() {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateSuppliers = useInvalidateSuppliers();
  return useMutation({
    mutationFn: async (supplierId: string) => deleteSupplier(merchantId!, supplierId),
    onSuccess: async () => invalidateSuppliers(),
  });
}

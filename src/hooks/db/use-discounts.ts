import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiscount,
  deleteDiscount,
  getDiscount,
  getDiscounts,
  updateDiscount,
} from "@/api/endpoints/discounts";
import { useAuth } from "@/stores/use-auth";

const discountKeys = {
  all: (merchantId: string | null) => ["discounts", merchantId] as const,
  detail: (merchantId: string | null, id: string) => ["discount", merchantId, id] as const,
};

type DiscountListItem = App.Data.Merchant.Discount.DiscountData;

function matchesDiscountList(item: DiscountListItem, queryKey: readonly unknown[]): boolean {
  const search = typeof queryKey[2] === "string" ? queryKey[2].toLowerCase() : "";
  const active = queryKey[3] as boolean | undefined;
  return (
    (!search || item.name.toLowerCase().includes(search)) &&
    (active === undefined || item.active === active)
  );
}

function updateCachedDiscountLists(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  update: (items: DiscountListItem[], queryKey: readonly unknown[]) => DiscountListItem[]
) {
  for (const [queryKey, items] of queryClient.getQueriesData<DiscountListItem[]>({
    queryKey: discountKeys.all(merchantId),
  })) {
    if (!items) continue;
    queryClient.setQueryData(queryKey, update(items, queryKey));
  }
}

function useInvalidateDiscounts() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  return async (id?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: discountKeys.all(merchantId) }),
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["management-products", merchantId] }),
      id ? queryClient.invalidateQueries({ queryKey: discountKeys.detail(merchantId, id) }) : null,
    ]);
  };
}

export function useDiscounts(search?: string, active?: boolean) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: [...discountKeys.all(merchantId), search, active],
    queryFn: async () => (await getDiscounts(merchantId!, { search, active })).data,
    enabled: !!merchantId,
    staleTime: 60_000,
  });
}

export function useDiscount(id: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: discountKeys.detail(merchantId, id),
    queryFn: async () => (await getDiscount(merchantId!, id)).data,
    enabled: !!merchantId && id !== "new",
  });
}

export function useCreateDiscount() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDiscounts();
  return useMutation({
    mutationFn: (body: App.Requests.Merchant.Discount.StoreDiscountRequest) =>
      createDiscount(merchantId!, body),
    onSuccess: async (response) => {
      updateCachedDiscountLists(queryClient, merchantId, (items, queryKey) => {
        if (!matchesDiscountList(response.data, queryKey)) return items;
        return [response.data, ...items.filter((item) => item.id !== response.data.id)];
      });
      await invalidate();
    },
  });
}

export function useUpdateDiscount(id: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDiscounts();
  return useMutation({
    mutationFn: (body: App.Requests.Merchant.Discount.UpdateDiscountRequest) =>
      updateDiscount(merchantId!, id, body),
    onSuccess: async (response) => {
      updateCachedDiscountLists(queryClient, merchantId, (items, queryKey) => {
        const withoutCurrent = items.filter((item) => item.id !== id);
        return matchesDiscountList(response.data, queryKey)
          ? [response.data, ...withoutCurrent]
          : withoutCurrent;
      });
      await invalidate(id);
    },
  });
}

export function useDeleteDiscount() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDiscounts();
  return useMutation({
    mutationFn: (id: string) => deleteDiscount(merchantId!, id),
    onSuccess: async (_response, id) => {
      updateCachedDiscountLists(queryClient, merchantId, (items) =>
        items.filter((item) => item.id !== id)
      );
      await invalidate();
    },
  });
}

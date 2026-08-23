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

export type DiscountListItem = App.Data.Merchant.Discount.DiscountData;

export type ProductDiscountChange = {
  current: DiscountListItem | null;
  next: DiscountListItem | null;
};

type CachedProduct = {
  id: string;
  price: number;
  discount: {
    unit: string | null;
    value: number | null;
    price: number | null;
  } | null;
};

function getDiscountProductIds(discount: DiscountListItem): string[] {
  return Object.values(discount.product_ids ?? {});
}

function withDiscountProductIds(
  discount: DiscountListItem,
  productIds: string[]
): DiscountListItem {
  return {
    ...discount,
    products_count: productIds.length,
    product_ids: productIds.reduce<Record<number, string>>((result, id, index) => {
      result[index] = id;
      return result;
    }, {}),
  };
}

function getProductDiscount(
  discount: DiscountListItem | null,
  productPrice: number
): CachedProduct["discount"] {
  if (!discount) return null;

  const price =
    discount.unit === "percentage"
      ? productPrice * (1 - discount.value / 100)
      : productPrice - discount.value;

  return {
    unit: discount.unit,
    value: discount.value,
    price: Math.max(0, price),
  };
}

function updateCachedProductDiscount(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  productId: string,
  discount: DiscountListItem | null
) {
  for (const queryName of ["management-products", "products-raw"] as const) {
    for (const [queryKey, products] of queryClient.getQueriesData<CachedProduct[]>({
      queryKey: [queryName, merchantId],
    })) {
      if (!products) continue;
      queryClient.setQueryData(
        queryKey,
        products.map((product) =>
          product.id === productId
            ? { ...product, discount: getProductDiscount(discount, product.price) }
            : product
        )
      );
    }
  }

  queryClient.setQueryData<CachedProduct | undefined>(
    ["product", merchantId, productId],
    (product) =>
      product ? { ...product, discount: getProductDiscount(discount, product.price) } : product
  );
}

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
  return async (ids?: string | string[], productId?: string) => {
    const discountIds = ids ? (Array.isArray(ids) ? ids : [ids]) : [];
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: discountKeys.all(merchantId) }),
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["management-products", merchantId] }),
      productId
        ? queryClient.invalidateQueries({ queryKey: ["product", merchantId, productId] })
        : null,
      ...discountIds.map((id) =>
        queryClient.invalidateQueries({ queryKey: discountKeys.detail(merchantId, id) })
      ),
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

export function useSetProductDiscount(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDiscounts();
  return useMutation({
    mutationFn: async ({ current, next }: ProductDiscountChange) => {
      if (current?.id === next?.id) return next;

      if (current) {
        const productIds = getDiscountProductIds(current).filter((id) => id !== productId);
        if (productIds.length) {
          await updateDiscount(merchantId!, current.id, { products: productIds });
        } else {
          await deleteDiscount(merchantId!, current.id);
        }
      }

      if (!next) return null;

      const productIds = getDiscountProductIds(next);
      const nextProductIds = productIds.includes(productId)
        ? productIds
        : [...productIds, productId];
      return (
        await updateDiscount(merchantId!, next.id, {
          products: nextProductIds,
        })
      ).data;
    },
    onSuccess: async (response, { current, next }) => {
      const applyCacheUpdates = () => {
        updateCachedDiscountLists(queryClient, merchantId, (items) => {
          const remainingCurrentProductIds = current
            ? getDiscountProductIds(current).filter((id) => id !== productId)
            : [];

          return items.flatMap((item) => {
            if (item.id === current?.id && current?.id !== next?.id) {
              return remainingCurrentProductIds.length
                ? [withDiscountProductIds(item, remainingCurrentProductIds)]
                : [];
            }
            if (item.id === next?.id && response) return [response];
            return [item];
          });
        });
        updateCachedProductDiscount(queryClient, merchantId, productId, next);
      };

      applyCacheUpdates();
      await invalidate(
        [current?.id, next?.id].filter((id): id is string => Boolean(id)),
        productId
      );
      applyCacheUpdates();
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

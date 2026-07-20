import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getPosProducts,
  getProduct,
  getProducts,
  updateProduct,
  uploadProductImage,
  type ProductImageAsset,
} from "@/api/endpoints/products";
import { extractOriginalPrice, extractSellingPrice } from "@/api/mappers/product";
import { useAuth } from "@/stores/useAuth";
import type { POSProduct } from "@/types/pos";

const PRODUCTS_STALE_TIME_MS = 5 * 60 * 1000;

export function mapProduct(raw: App.Data.Merchant.Pos.ProductData): POSProduct {
  return {
    id: raw.id,
    name: raw.name,
    price: extractSellingPrice(raw.discount, raw.price),
    original_price: extractOriginalPrice(raw.discount, raw.price),
    image_url: raw.image?.default ?? null,
    thumbnail_url: raw.image?.thumbnail ?? null,
    category_id: raw.category?.id ?? null,
    stock_enabled: raw.stock.enabled,
    stock_qty: raw.stock.enabled ? raw.stock.qty : null,
    is_active: raw.is_active,
    add_ons: raw.add_ons,
  };
}

function mapManagementProduct(raw: App.Data.Merchant.Product.ProductData): POSProduct {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    original_price: null,
    image_url: raw.image_url,
    thumbnail_url: raw.thumbnail_url,
    category_id: raw.category_id,
    stock_enabled: raw.stock_enabled,
    stock_qty: raw.stock_enabled ? raw.stock : null,
    is_active: raw.active,
    add_ons: [],
  };
}

type ProductListSnapshot = [readonly unknown[], POSProduct[] | undefined];

function optimisticListProduct(payload: ProductFormPayload, id: string): POSProduct {
  return {
    id,
    name: payload.values.name,
    price: payload.values.price,
    original_price: null,
    image_url: payload.image?.uri ?? null,
    thumbnail_url: payload.image?.uri ?? null,
    category_id: payload.values.category_id,
    stock_enabled: payload.values.stock_enabled ?? false,
    stock_qty: payload.values.stock_enabled ? (payload.values.stock ?? 0) : null,
    is_active: payload.values.active ?? true,
    add_ons: [],
  };
}

function productMatchesManagementQuery(product: POSProduct, queryKey: readonly unknown[]): boolean {
  const search = String(queryKey[2] ?? "").toLowerCase();
  const categoryId = queryKey[3] as string | null | undefined;
  const active = queryKey[4] as boolean | undefined;
  return (
    (!search || product.name.toLowerCase().includes(search)) &&
    (!categoryId || product.category_id === categoryId) &&
    (active === undefined || product.is_active === active)
  );
}

function restoreProductLists(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: ProductListSnapshot[]
) {
  for (const [queryKey, data] of snapshots) queryClient.setQueryData(queryKey, data);
}

export function useProductsRaw(search?: string, categoryId?: string | null) {
  const merchantId = useAuth((s) => s.merchantId);
  return useQuery({
    queryKey: ["products-raw", merchantId, search, categoryId],
    queryFn: async () => {
      const res = await getPosProducts(merchantId!, {
        search,
        category_id: categoryId ?? undefined,
      });
      return res.data;
    },
    enabled: !!merchantId,
    staleTime: PRODUCTS_STALE_TIME_MS,
  });
}

export function useProducts(search?: string, categoryId?: string | null) {
  const query = useProductsRaw(search, categoryId);
  return {
    ...query,
    data: query.data?.map(mapProduct),
  };
}

export function useManagementProducts(
  search?: string,
  categoryId?: string | null,
  active?: boolean
) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: ["management-products", merchantId, search, categoryId, active],
    queryFn: async () => {
      const response = await getProducts(merchantId!, {
        search,
        category_id: categoryId ?? undefined,
        active,
      });
      return response.data.map(mapManagementProduct);
    },
    enabled: !!merchantId,
    staleTime: PRODUCTS_STALE_TIME_MS,
  });
}

export function useProduct(id: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: ["product", merchantId, id],
    queryFn: async () => (await getProduct(merchantId!, id)).data,
    enabled: !!merchantId && id !== "new",
    staleTime: PRODUCTS_STALE_TIME_MS,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  const merchantId = useAuth((state) => state.merchantId);

  return async (productId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["management-products", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["categories", merchantId] }),
      productId
        ? queryClient.invalidateQueries({ queryKey: ["product", merchantId, productId] })
        : Promise.resolve(),
    ]);
  };
}

export type ProductFormPayload = {
  values: App.Requests.Merchant.Product.StoreProductRequest;
  image?: ProductImageAsset | null;
};

export function useCreateProduct() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: async ({ values, image }: ProductFormPayload) =>
      (await createProduct(merchantId!, values, image)).data,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["management-products", merchantId] });
      const snapshots = queryClient.getQueriesData<POSProduct[]>({
        queryKey: ["management-products", merchantId],
      });
      const temporaryId = `optimistic-${Date.now()}`;
      const optimistic = optimisticListProduct(payload, temporaryId);

      for (const [queryKey, current] of snapshots) {
        if (!current) continue;
        if (productMatchesManagementQuery(optimistic, queryKey)) {
          queryClient.setQueryData(queryKey, [optimistic, ...current]);
        }
      }
      return { snapshots, temporaryId };
    },
    onError: (_error, _payload, context) => {
      if (context) restoreProductLists(queryClient, context.snapshots);
    },
    onSuccess: (product, _payload, context) => {
      const resolved = mapManagementProduct(product);
      queryClient.setQueriesData<POSProduct[]>(
        { queryKey: ["management-products", merchantId] },
        (current) => current?.map((item) => (item.id === context?.temporaryId ? resolved : item))
      );
      queryClient.setQueryData(["product", merchantId, product.id], product);
    },
    onSettled: async (product) => invalidateProducts(product?.id),
  });
}

export function useUpdateProduct(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: async ({ values, image }: ProductFormPayload) => {
      let product = (
        await updateProduct(merchantId!, productId, {
          ...values,
          description: values.description ?? null,
        })
      ).data;
      if (image) product = (await uploadProductImage(merchantId!, productId, image)).data;
      return product;
    },
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["management-products", merchantId] }),
        queryClient.cancelQueries({ queryKey: ["product", merchantId, productId] }),
      ]);
      const snapshots = queryClient.getQueriesData<POSProduct[]>({
        queryKey: ["management-products", merchantId],
      });
      const detail = queryClient.getQueryData<App.Data.Merchant.Product.ProductData>([
        "product",
        merchantId,
        productId,
      ]);
      const optimistic = optimisticListProduct(payload, productId);
      for (const [queryKey, current] of snapshots) {
        if (!current) continue;
        const next = current
          .map((item) =>
            item.id === productId
              ? {
                  ...item,
                  ...optimistic,
                  original_price: item.original_price,
                  add_ons: item.add_ons,
                  image_url: payload.image?.uri ?? item.image_url,
                  thumbnail_url: payload.image?.uri ?? item.thumbnail_url,
                }
              : item
          )
          .filter((item) => item.id !== productId || productMatchesManagementQuery(item, queryKey));
        queryClient.setQueryData(queryKey, next);
      }
      if (detail) {
        queryClient.setQueryData(["product", merchantId, productId], {
          ...detail,
          ...payload.values,
          image_url: payload.image?.uri ?? detail.image_url,
          thumbnail_url: payload.image?.uri ?? detail.thumbnail_url,
        });
      }
      return { snapshots, detail };
    },
    onError: (_error, _payload, context) => {
      if (!context) return;
      restoreProductLists(queryClient, context.snapshots);
      queryClient.setQueryData(["product", merchantId, productId], context.detail);
    },
    onSuccess: (product) => {
      const resolved = mapManagementProduct(product);
      queryClient.setQueriesData<POSProduct[]>(
        { queryKey: ["management-products", merchantId] },
        (current) => current?.map((item) => (item.id === productId ? resolved : item))
      );
      queryClient.setQueryData(["product", merchantId, productId], product);
    },
    onSettled: async () => invalidateProducts(productId),
  });
}

export function useDeleteProduct(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: async () => deleteProduct(merchantId!, productId),
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["management-products", merchantId] }),
        queryClient.cancelQueries({ queryKey: ["product", merchantId, productId] }),
      ]);
      const snapshots = queryClient.getQueriesData<POSProduct[]>({
        queryKey: ["management-products", merchantId],
      });
      const detail = queryClient.getQueryData(["product", merchantId, productId]);
      queryClient.setQueriesData<POSProduct[]>(
        { queryKey: ["management-products", merchantId] },
        (current) => current?.filter((item) => item.id !== productId)
      );
      queryClient.removeQueries({ queryKey: ["product", merchantId, productId], exact: true });
      return { snapshots, detail };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      restoreProductLists(queryClient, context.snapshots);
      queryClient.setQueryData(["product", merchantId, productId], context.detail);
    },
    onSettled: async () => invalidateProducts(productId),
  });
}

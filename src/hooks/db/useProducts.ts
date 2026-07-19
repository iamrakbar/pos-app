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
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: async ({ values, image }: ProductFormPayload) =>
      (await createProduct(merchantId!, values, image)).data,
    onSuccess: async (product) => invalidateProducts(product.id),
  });
}

export function useUpdateProduct(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: async ({ values, image }: ProductFormPayload) => {
      const product = (
        await updateProduct(merchantId!, productId, {
          ...values,
          description: values.description ?? null,
        })
      ).data;
      if (image) await uploadProductImage(merchantId!, productId, image);
      return product;
    },
    onSuccess: async () => invalidateProducts(productId),
  });
}

export function useDeleteProduct(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateProducts = useInvalidateProducts();

  return useMutation({
    mutationFn: async () => deleteProduct(merchantId!, productId),
    onSuccess: async () => invalidateProducts(productId),
  });
}

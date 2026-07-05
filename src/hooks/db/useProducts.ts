import { useQuery } from '@tanstack/react-query';
import { getPosProducts } from '@/api/endpoints/products';
import { extractOriginalPrice } from '@/api/mappers/product';
import { useAuth } from '@/stores/useAuth';
import type { POSProduct } from '@/types/pos';

const PRODUCTS_STALE_TIME_MS = 5 * 60 * 1000;

export function mapProduct(raw: App.Data.Merchant.Pos.ProductData): POSProduct {
    return {
        id: raw.id,
        name: raw.name,
        price: raw.price,
        original_price: extractOriginalPrice(raw.discount, raw.price),
        image_url: raw.image?.default ?? null,
        thumbnail_url: raw.image?.thumbnail ?? null,
        category_id: raw.category?.id ?? null,
        is_active: raw.is_active,
        add_ons: raw.add_ons,
    };
}

export function useProductsRaw(search?: string, categoryId?: string | null) {
    const merchantId = useAuth((s) => s.merchantId);
    return useQuery({
        queryKey: ['products-raw', merchantId, search, categoryId],
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

export function useProduct(id: string) {
    // No GET /pos/products/:id endpoint — derive from the already-fetched
    // (unfiltered) product list instead.
    const { data: products, ...rest } = useProducts();
    return {
        ...rest,
        data: id === 'new' ? null : (products?.find((p) => p.id === id) ?? null),
    };
}

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/endpoints/products';
import { useAuth } from '@/stores/useAuth';
import type { POSProduct } from '@/types/pos';

const PRODUCTS_STALE_TIME_MS = 5 * 60 * 1000;

// The generated ProductData type doesn't have `add_ons` (no add-ons endpoint
// exists in the given API collection, so add_ons always maps to []) or
// original_price (no discount field), and the live server's thumbnail field
// is actually `image_thumbnail`, not the generated type's `thumbnail_url`.
type RawProduct = App.Data.Merchant.Product.ProductData & { image_thumbnail?: string | null };

export function mapProduct(raw: RawProduct): POSProduct {
    return {
        id: raw.id,
        name: raw.name,
        price: raw.price,
        original_price: null,
        image_url: raw.image_url,
        thumbnail_url: raw.image_thumbnail ?? null,
        category_id: raw.category_id,
        is_active: raw.active,
        add_ons: [],
    };
}

export function useProductsRaw(search?: string, categoryId?: string | null) {
    const merchantId = useAuth((s) => s.merchantId);
    return useQuery({
        queryKey: ['products-raw', merchantId, search, categoryId],
        queryFn: async () => {
            const res = await getProducts(merchantId!, {
                search,
                category_id: categoryId ?? undefined,
            });
            return res.data as RawProduct[];
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
    // No GET /products/:id endpoint in the given collection — derive from the
    // already-fetched (unfiltered) product list instead.
    const { data: products, ...rest } = useProducts();
    return {
        ...rest,
        data: id === 'new' ? null : (products?.find((p) => p.id === id) ?? null),
    };
}

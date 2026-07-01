import { useProductsRaw } from './useProducts';
import type { POSCategory } from '@/types/pos';

// No standalone categories endpoint exists in the given API collection —
// categories are derived from the `category` object embedded on each product.
export function useCategories() {
    const query = useProductsRaw();
    const categories: POSCategory[] = [];
    const seen = new Set<string>();
    for (const product of query.data ?? []) {
        const category = product.category as { id: string; name: string; slug: string } | null;
        if (category && !seen.has(category.id)) {
            seen.add(category.id);
            categories.push({ id: category.id, name: category.name });
        }
    }
    return { ...query, data: categories };
}

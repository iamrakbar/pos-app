import { useQuery } from '@tanstack/react-query';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';
import type { POSProduct, AddOnGroup } from '@/types/pos';

function rowToProduct(row: typeof products.$inferSelect): POSProduct {
    return {
        id: row.id,
        name: row.name,
        price: row.price,
        original_price: row.original_price ?? null,
        image_url: row.image_url ?? null,
        thumbnail_url: row.thumbnail_url ?? null,
        category_id: row.category_id ?? null,
        is_active: row.is_active === 1,
        add_ons: JSON.parse(row.add_ons_json) as AddOnGroup[],
    };
}

export function useProducts(search?: string, categoryId?: string | null) {
    return useQuery<POSProduct[]>({
        queryKey: ['products', search, categoryId],
        queryFn: () => {
            const conditions = [];
            if (search) conditions.push(like(products.name, `%${search}%`));
            if (categoryId) conditions.push(eq(products.category_id, categoryId));

            const rows = conditions.length
                ? db.select().from(products).where(and(...conditions)).all()
                : db.select().from(products).all();

            return rows.map(rowToProduct);
        },
    });
}

export function useProduct(id: string) {
    return useQuery<POSProduct | null>({
        queryKey: ['product', id],
        queryFn: () => {
            if (id === 'new') return null;
            const row = db.select().from(products).where(eq(products.id, id)).get();
            return row ? rowToProduct(row) : null;
        },
        enabled: !!id,
    });
}

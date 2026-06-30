import { useQuery } from '@tanstack/react-query';
import { db } from '@/db';
import { categories } from '@/db/schema';
import type { POSCategory } from '@/types/pos';

export function useCategories() {
    return useQuery<POSCategory[]>({
        queryKey: ['categories'],
        queryFn: () =>
            db.select({ id: categories.id, name: categories.name })
              .from(categories)
              .all(),
    });
}

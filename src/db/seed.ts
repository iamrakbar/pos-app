import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/data/pos-mock';
import { db } from './client';
import { meta, categories, products } from './schema';
import { eq } from 'drizzle-orm';

export function runSeedIfNeeded() {
    const existing = db.select().from(meta).where(eq(meta.key, 'seeded')).get();
    if (existing) return;

    const now = Date.now();

    // Categories
    db.insert(categories).values(
        MOCK_CATEGORIES.map((c) => ({
            id: c.id,
            name: c.name,
            is_dirty: 0,
        }))
    ).run();

    // Products (with add_ons stored as JSON)
    db.insert(products).values(
        MOCK_PRODUCTS.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            original_price: p.original_price ?? null,
            image_url: p.image_url ?? null,
            thumbnail_url: p.thumbnail_url ?? null,
            category_id: p.category_id ?? null,
            is_active: p.is_active ? 1 : 0,
            add_ons_json: JSON.stringify(p.add_ons),
            created_at: now,
            updated_at: now,
            is_dirty: 0,
        }))
    ).run();

    db.insert(meta).values({ key: 'seeded', value: '1' }).run();
}

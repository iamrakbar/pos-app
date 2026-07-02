import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_TABLES } from '@/data/pos-mock';
import { db } from './client';
import { meta, categories, products, areas, tables } from './schema';
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

    // Areas (unique from tables)
    const uniqueAreas = Array.from(
        new Map(MOCK_TABLES.map((t) => [t.area_id, { id: t.area_id, name: t.area_name }])).values()
    );
    db.insert(areas).values(uniqueAreas).run();

    // Tables
    db.insert(tables).values(
        MOCK_TABLES.map((t) => ({
            id: t.id,
            area_id: t.area_id,
            area_name: t.area_name,
            name: t.name,
            pax: t.pax,
        }))
    ).run();

    db.insert(meta).values({ key: 'seeded', value: '1' }).run();
}

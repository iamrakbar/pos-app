import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_TABLES, MOCK_PAYMENT_GROUPS } from '@/data/pos-mock';
import { MOCK_ORDERS } from '@/data/orders-mock';
import { db } from './client';
import { meta, categories, products, areas, tables, payment_methods, orders, order_items } from './schema';
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

    // Payment methods (flatten groups)
    const allPayments = MOCK_PAYMENT_GROUPS.flatMap((g) =>
        g.payments.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            fee_rate: p.fee_rate,
            group_type: g.group_type,
            group_label: g.group_label,
        }))
    );
    db.insert(payment_methods).values(allPayments).run();

    // Orders + order items
    for (const o of MOCK_ORDERS) {
        const totalQty = o.items.reduce((s, i) => s + i.qty, 0);
        const fee = o.total - o.subtotal;
        db.insert(orders).values({
            id: o.id,
            transaction_id: o.transaction_id,
            order_type: o.order_type,
            table_name: o.table ?? null,
            payment_method: o.payment_method,
            status: o.status,
            subtotal: o.subtotal,
            total: o.total,
            total_qty: totalQty,
            customer_type: o.customer_type,
            customer_name: o.customer_name ?? null,
            notes: o.notes ?? null,
            created_at: o.created_at,
            is_dirty: 0,
        }).run();

        db.insert(order_items).values(
            o.items.map((item, idx) => ({
                id: `${o.id}-${idx}`,
                order_id: o.id,
                product_name: item.name,
                qty: item.qty,
                unit_price: item.price,
            }))
        ).run();
    }

    db.insert(meta).values({ key: 'seeded', value: '1' }).run();
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/db';
import { orders, order_items } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { MockOrder, OrderStatus } from '@/data/orders-mock';

function rowsToOrders(
    orderRows: (typeof orders.$inferSelect)[],
    itemRows: (typeof order_items.$inferSelect)[],
): MockOrder[] {
    const itemsByOrder = new Map<string, (typeof order_items.$inferSelect)[]>();
    for (const item of itemRows) {
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        itemsByOrder.set(item.order_id, list);
    }
    return orderRows.map((o) => ({
        id: o.id,
        transaction_id: o.transaction_id,
        order_type: o.order_type as 'dine-in' | 'takeaway',
        table: o.table_name ?? null,
        payment_method: o.payment_method,
        status: o.status as OrderStatus,
        subtotal: o.subtotal,
        total: o.total,
        customer_type: o.customer_type as 'merchant' | 'registered',
        customer_name: o.customer_name ?? null,
        notes: o.notes ?? null,
        created_at: o.created_at,
        items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
            name: i.product_name,
            qty: i.qty,
            price: i.unit_price,
        })),
    }));
}

export function useOrders(status?: OrderStatus | 'all') {
    return useQuery<MockOrder[]>({
        queryKey: ['orders', status],
        queryFn: () => {
            const orderRows =
                status && status !== 'all'
                    ? db.select().from(orders).where(eq(orders.status, status)).all()
                    : db.select().from(orders).all();

            if (orderRows.length === 0) return [];

            const ids = orderRows.map((o) => o.id);
            const itemRows = db.select().from(order_items).where(inArray(order_items.order_id, ids)).all();
            return rowsToOrders(orderRows, itemRows);
        },
    });
}

export function useOrder(id: string | undefined) {
    return useQuery<MockOrder | null>({
        queryKey: ['order', id],
        queryFn: () => {
            if (!id) return null;
            const row = db.select().from(orders).where(eq(orders.id, id)).get();
            if (!row) return null;
            const items = db.select().from(order_items).where(eq(order_items.order_id, id)).all();
            return rowsToOrders([row], items)[0] ?? null;
        },
        enabled: !!id,
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            Promise.resolve(
                db.update(orders).set({ status, is_dirty: 1 }).where(eq(orders.id, id)).run()
            ),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', id] });
        },
    });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/db';
import { orders, order_items } from '@/db/schema';
import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';

export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { products: cartProducts, totalPrice } = useCartStore.getState();
            const { checkoutForm, paymentSession } = usePOSStore.getState();

            if (!paymentSession || cartProducts.length === 0) return null;

            const orderId = `ord-${Date.now()}`;
            const subtotal = totalPrice();
            const feeAmount = paymentSession.amount - subtotal;
            const totalQty = cartProducts.reduce((s, i) => s + i.qty, 0);

            db.insert(orders).values({
                id: orderId,
                transaction_id: paymentSession.transaction_id,
                order_type: checkoutForm.order_type,
                table_name: null,
                payment_method: paymentSession.payment_type,
                status: 'completed',
                subtotal,
                total: paymentSession.amount,
                total_qty: totalQty,
                customer_type: checkoutForm.customer_type,
                customer_name: null,
                notes: checkoutForm.notes || null,
                created_at: new Date().toISOString(),
                is_dirty: 1,
            }).run();

            db.insert(order_items).values(
                cartProducts.map((item, idx) => ({
                    id: `${orderId}-${idx}`,
                    order_id: orderId,
                    product_name: item.name,
                    qty: item.qty,
                    unit_price: item.price,
                }))
            ).run();

            return orderId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

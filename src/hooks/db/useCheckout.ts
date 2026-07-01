import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkout } from '@/api/endpoints/checkout';
import { useAuth } from '@/stores/useAuth';
import { useCartStore } from '@/stores/useCartStore';
import { buildCartProducts } from './useCart';
import type { CheckoutFormValues } from '@/schemas/checkout';

export function useCheckout() {
    const merchantId = useAuth((s) => s.merchantId);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (form: CheckoutFormValues) => {
            const products = buildCartProducts(useCartStore.getState().products);

            const body: App.Requests.Merchant.Checkout.CheckoutRequest = {
                customer_type: form.customer_type,
                guest_id: form.customer_type === 'guest' ? form.guest_id : undefined,
                customer_id: form.customer_type === 'customer' ? form.customer_id : undefined,
                order_type: form.order_type,
                table_id: form.order_type === 'dine-in' ? form.table_id : undefined,
                pickup_time: form.order_type === 'takeaway' ? form.pickup_time : undefined,
                payment_id: form.payment_id!,
                notes: form.notes || undefined,
                products,
            };

            const res = await checkout(merchantId!, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

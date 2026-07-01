import { useMutation } from '@tanstack/react-query';
import { validateCart } from '@/api/endpoints/cart';
import { useAuth } from '@/stores/useAuth';
import { useCartStore } from '@/stores/useCartStore';
import type { CartItem } from '@/types/cart';

export function buildCartProducts(
    items: CartItem[],
): App.Requests.Merchant.Checkout.CartValidateRequest['products'] {
    return items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        notes: item.notes ?? undefined,
        add_ons: item.add_ons.length > 0 ? item.add_ons : undefined,
    }));
}

export function useValidateCart() {
    const merchantId = useAuth((s) => s.merchantId);
    return useMutation({
        mutationFn: async () => {
            const products = buildCartProducts(useCartStore.getState().products);
            return validateCart(merchantId!, { products });
        },
    });
}

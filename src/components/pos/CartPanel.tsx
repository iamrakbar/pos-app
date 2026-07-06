import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { formatRupiah } from '@/utils/format';
import { Button, Typography, useThemeColor } from 'heroui-native';
import type { JSX } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CartItemRow from './CartItemRow';

export default function CartPanel(): JSX.Element {
    const [themeColorMuted, themeColorDangerSoftForeground] = useThemeColor([
        'muted',
        'danger-soft-foreground',
    ]);
    const products = useCartStore((s) => s.products);
    const totalQty = useCartStore((s) => s.totalQty);
    const totalPrice = useCartStore((s) => s.totalPrice);
    const clearCart = useCartStore((s) => s.clearCart);
    const openCheckoutModal = usePOSStore((s) => s.openCheckoutModal);

    const itemCount = totalQty();
    const subtotal = totalPrice();

    return (
        <View className="flex-1 bg-surface border-l border-border">
            {/* Header */}
            <View className="flex-row items-center justify-between h-18 px-5">
                <Typography.Heading type="h6" className="text-foreground">
                    Cart
                </Typography.Heading>
                <Typography type="body-sm" color="muted">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Typography>
            </View>
            <View className="px-5 pb-3">
                {products.length > 0 && (
                    <Button
                        variant="danger-soft"
                        size="sm"
                        onPress={clearCart}
                        className="self-start"
                    >
                        <Ionicons name="trash-outline" size={16} color={themeColorDangerSoftForeground} />
                        <Button.Label>Empty Cart</Button.Label>
                    </Button>
                )}
            </View>

            {/* Cart items */}
            <ScrollView
                className="flex-1 px-5"
                contentContainerClassName="pb-3"
                showsVerticalScrollIndicator={false}
            >
                {products.length === 0 ? (
                    <View className="items-center justify-center py-16 gap-2">
                        <Ionicons name="cart-outline" size={40} color={themeColorMuted} />
                        <Typography type="body-sm" color="muted" align="center">
                            Cart is empty.{'\n'}Add products to get started.
                        </Typography>
                    </View>
                ) : (
                    products.map((item) => (
                        <CartItemRow key={item.id} item={item} />
                    ))
                )}
            </ScrollView>

            {/* Footer */}
            <View className="px-5 py-4 gap-3">
                <View className="flex-row items-center justify-between">
                    <Typography type="body-sm" color="muted">Subtotal</Typography>
                    <Typography weight="semibold" className="tabular-nums">
                        {formatRupiah(subtotal)}
                    </Typography>
                </View>
                <Button
                    className="w-full"
                    onPress={openCheckoutModal}
                    isDisabled={products.length === 0}
                >
                    Checkout
                </Button>
            </View>
        </View>
    );
}

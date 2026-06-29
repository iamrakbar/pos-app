import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { formatRupiah } from '@/utils/format';
import { Button, Text } from 'heroui-native';
import type { JSX } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CartItemRow from './CartItemRow';

export default function CartPanel(): JSX.Element {
  const products = useCartStore((s) => s.products);
  const totalQty = useCartStore((s) => s.totalQty);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCheckoutModal = usePOSStore((s) => s.openCheckoutModal);

  const itemCount = totalQty();
  const subtotal = totalPrice();

  return (
    <View className="flex-1 bg-background border-l border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Text className="text-base font-semibold text-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        {products.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onPress={clearCart}
            className="border-danger"
          >
            <Ionicons name="trash-outline" size={12} color="#ef4444" />
            <Button.Label className="text-danger text-xs ml-1">Empty cart</Button.Label>
          </Button>
        )}
      </View>

      {/* Cart items */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12 gap-2">
            <Ionicons name="cart-outline" size={40} color="#9ca3af" />
            <Text className="text-sm text-muted-foreground text-center">
              Cart is empty.{'\n'}Add products to get started.
            </Text>
          </View>
        ) : (
          products.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View className="px-4 py-4 border-t border-border gap-3">
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted-foreground">Subtotal</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatRupiah(subtotal)}
          </Text>
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

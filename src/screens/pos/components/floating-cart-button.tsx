import { useCartStore } from "@/stores/use-cart-store";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const FLOATING_CART_BUTTON_SPACE = 88;

export default function FloatingCartButton(): JSX.Element | null {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("accent-foreground");
  const products = useCartStore((state) => state.products);
  const itemCount = products.reduce((total, product) => total + product.qty, 0);
  const subtotal = products.reduce((total, product) => total + product.subtotal, 0);

  if (itemCount === 0) return null;

  const countLabel = itemCount > 99 ? "99+" : String(itemCount);

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center px-4"
      style={{ bottom: Math.max(insets.bottom, 16) }}
    >
      <Button
        className="w-full max-w-xl justify-between"
        onPress={() => router.push("/pos/cart")}
        accessibilityLabel={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}, ${formatRupiah(subtotal)}`}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="cart-outline" size={18} color={foreground} />
          <Button.Label>
            Cart · {countLabel} {itemCount === 1 ? "item" : "items"}
          </Button.Label>
        </View>
        <Button.Label className="tabular-nums">{formatRupiah(subtotal)}</Button.Label>
      </Button>
    </View>
  );
}

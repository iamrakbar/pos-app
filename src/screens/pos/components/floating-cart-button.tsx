import { useCartStore } from "@/stores/use-cart-store";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/stores/use-locale";

export const FLOATING_CART_BUTTON_SPACE = 88;

export default function FloatingCartButton(): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("accent-foreground");
  const products = useCartStore((state) => state.products);
  const itemCount = products.reduce((total, product) => total + product.qty, 0);
  const subtotal = products.reduce((total, product) => total + product.subtotal, 0);
  const previousItemCount = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  useEffect(() => {
    const didAddItem = itemCount > previousItemCount.current;
    previousItemCount.current = itemCount;

    if (!didAddItem) return;

    if (!prefersReducedMotion) {
      scale.set(
        withSequence(
          withTiming(1.025, { duration: 90 }),
          withSpring(1, { duration: 220, dampingRatio: 0.8 })
        )
      );
    }
  }, [itemCount, prefersReducedMotion, scale]);

  if (itemCount === 0) return null;

  const countLabel = itemCount > 99 ? "99+" : String(itemCount);
  const itemsLabel = t(itemCount === 1 ? "pos.cartItemsOne" : "pos.cartItemsOther", {
    count: itemCount,
  });
  const displayItemsLabel = t(itemCount === 1 ? "pos.cartItemsOne" : "pos.cartItemsOther", {
    count: countLabel,
  });

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center p-4 bg-background border-t border-border"
      style={{ bottom: Math.max(insets.bottom, 16) }}
    >
      <Animated.View className="w-full items-center" style={animatedStyle}>
        <Button
          className="w-full justify-between"
          onPress={() => router.push("/pos/cart")}
          accessibilityLabel={t("pos.openCartAccessibility", {
            items: itemsLabel,
            subtotal: formatRupiah(subtotal),
          })}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name={"cart-outline"} size={18} color={foreground} />
            <Button.Label>{displayItemsLabel}</Button.Label>
          </View>
          <Button.Label className="tabular-nums">{formatRupiah(subtotal)}</Button.Label>
        </Button>
      </Animated.View>
    </View>
  );
}

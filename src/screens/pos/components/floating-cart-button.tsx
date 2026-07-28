import { useCartStore } from "@/stores/use-cart-store";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
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

export const FLOATING_CART_BUTTON_SPACE = 88;

export default function FloatingCartButton(): JSX.Element | null {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("accent-foreground");
  const products = useCartStore((state) => state.products);
  const itemCount = products.reduce((total, product) => total + product.qty, 0);
  const subtotal = products.reduce((total, product) => total + product.subtotal, 0);
  const previousItemCount = useRef(0);
  const [isShowingAddedFeedback, setIsShowingAddedFeedback] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  useEffect(() => {
    const didAddItem = itemCount > previousItemCount.current;
    previousItemCount.current = itemCount;

    if (!didAddItem) return;

    setIsShowingAddedFeedback(true);
    if (!prefersReducedMotion) {
      scale.set(
        withSequence(
          withTiming(1.025, { duration: 90 }),
          withSpring(1, { duration: 220, dampingRatio: 0.8 })
        )
      );
    }

    const feedbackTimer = setTimeout(() => setIsShowingAddedFeedback(false), 800);
    return () => clearTimeout(feedbackTimer);
  }, [itemCount, prefersReducedMotion, scale]);

  if (itemCount === 0) return null;

  const countLabel = itemCount > 99 ? "99+" : String(itemCount);

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 items-center px-4"
      style={{ bottom: Math.max(insets.bottom, 16) }}
    >
      <Animated.View className="w-full items-center" style={animatedStyle}>
        <Button
          className="w-full max-w-xl justify-between"
          onPress={() => router.push("/pos/cart")}
          accessibilityLabel={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}, ${formatRupiah(subtotal)}`}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={isShowingAddedFeedback ? "checkmark-circle" : "cart-outline"}
              size={18}
              color={foreground}
            />
            <Button.Label>
              {isShowingAddedFeedback ? "Added" : "Cart"} · {countLabel}{" "}
              {itemCount === 1 ? "item" : "items"}
            </Button.Label>
          </View>
          <Button.Label className="tabular-nums">{formatRupiah(subtotal)}</Button.Label>
        </Button>
      </Animated.View>
    </View>
  );
}

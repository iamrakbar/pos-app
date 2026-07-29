import CartContent from "@/screens/pos/components/cart-content";
import type { JSX } from "react";
import { View } from "react-native";

export default function CartScreen(): JSX.Element {
  return (
    <View className="flex-1 pb-safe">
      <CartContent />
    </View>
  );
}

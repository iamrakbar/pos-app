import type { JSX } from "react";
import { View } from "react-native";
import CartContent from "./cart-content";

export default function CartPanel(): JSX.Element {
  return (
    <View className="flex-1 border-l border-border">
      <CartContent />
    </View>
  );
}

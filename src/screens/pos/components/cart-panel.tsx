import type { JSX } from "react";
import { View } from "react-native";
import CartContent from "./cart-content";
import { Separator } from "heroui-native";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function CartPanel(): JSX.Element {
  const { height, isWide } = useResponsiveLayout();
  return (
    <View className="flex-1 flex-row">
      {isWide && <Separator orientation="vertical" />}
      <CartContent />
    </View>
  );
}

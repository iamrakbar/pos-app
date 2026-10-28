import { Separator } from "panelui-native";
import type { JSX } from "react";
import { View } from "react-native";
import CartContent from "./cart-content";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function CartPanel(): JSX.Element {
  const { isWide } = useResponsiveLayout();
  return (
    <View className="flex-1 flex-row">
      {isWide && <Separator orientation="vertical" />}
      <CartContent />
    </View>
  );
}

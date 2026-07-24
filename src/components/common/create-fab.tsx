import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { FAB } from "heroui-native-pro";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreateFABProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

export default function CreateFAB({
  accessibilityLabel,
  onPress,
}: CreateFABProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const accentForeground = useThemeColor("accent-foreground");

  return (
    <FAB
      className="absolute right-6 z-50"
      style={{ bottom: Math.max(insets.bottom, 24) }}
      isOpen={false}
      onOpenChange={() => undefined}
    >
      <FAB.Trigger
        accessibilityLabel={accessibilityLabel}
        classNames={{ container: "bg-accent" }}
        onPress={onPress}
      >
        <Ionicons name="add" size={22} color={accentForeground} />
      </FAB.Trigger>
    </FAB>
  );
}

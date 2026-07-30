import AppIcon from "@/components/common/app-icon";
import { useNavigation } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { useTranslation } from "@/stores/use-locale";

type DrawerNavigation = {
  openDrawer: () => void;
};

type DrawerMenuButtonProps = {
  accessibilityLabel?: string;
};

export default function DrawerMenuButton({
  accessibilityLabel,
}: DrawerMenuButtonProps): JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<DrawerNavigation>();
  const themeColorForeground = useThemeColor("foreground");

  return (
    <Button
      variant="ghost"
      isIconOnly
      onPress={() => navigation.openDrawer()}
      accessibilityLabel={accessibilityLabel ?? t("navigation.openNavigation")}
    >
      <AppIcon name="menu-outline" size={24} color={themeColorForeground} />
    </Button>
  );
}

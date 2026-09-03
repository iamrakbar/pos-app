import AppIcon from "@/components/common/app-icon";
import { useTranslation } from "@/stores/use-locale";
import { Button, Spinner, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { View } from "react-native";

export function SheetHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}): React.JSX.Element {
  const [themeColorForeground] = useThemeColor(["foreground"]);
  const { t } = useTranslation();

  return (
    <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
      <Typography type="h4" weight="semibold">
        {title}
      </Typography>
      <Typography type="body-sm" color="muted" numberOfLines={2}>
        {description}
      </Typography>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        className="absolute right-3 top-3"
        onPress={onClose}
        accessibilityLabel={t("common.close")}
      >
        <AppIcon name="close-outline" size={20} color={themeColorForeground} />
      </Button>
    </View>
  );
}

export function SheetLoading(): React.JSX.Element {
  return (
    <View className="items-center justify-center py-20">
      <Spinner size="sm" />
    </View>
  );
}

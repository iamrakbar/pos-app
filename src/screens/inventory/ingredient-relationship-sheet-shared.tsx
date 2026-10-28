import { Button as PanelButton, Typography } from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTranslation } from "@/stores/use-locale";
import React from "react";
import { View } from "react-native";

export function SheetHeader({
  title,
  description,
  action,
  onClose,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  onClose: () => void;
}): React.JSX.Element {
  const [themeColorForeground] = useCSSVariable(["--color-foreground"]) as [string];
  const { t } = useTranslation();

  return (
    <View className="bg-surface gap-2 px-6 pb-5 pr-16 pt-8">
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Typography type="h4" weight="semibold">
            {title}
          </Typography>
          <Typography type="body-sm" muted numberOfLines={2}>
            {description}
          </Typography>
        </View>
        {action}
      </View>
      <PanelButton
        variant="ghost"
        size="icon"

        className="absolute right-3 top-3"
        onPress={onClose}
        accessibilityLabel={t("common.close")}
      >
        <AppIcon icon={AppIcons.close} size={20} color={themeColorForeground} />
      </PanelButton>
    </View>
  );
}

import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTranslation } from "@/stores/use-locale";
import { TrueSheet, type TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { Button, Typography } from "panelui-native";
import type { ReactNode, Ref } from "react";
import { View } from "react-native";

type FormSheetProps = {
  sheetRef: Ref<TrueSheet>;
  detents: TrueSheetProps["detents"];
  backgroundColor?: TrueSheetProps["backgroundColor"];
  onDidDismiss: () => void;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export default function FormSheet({
  sheetRef,
  detents,
  backgroundColor,
  onDidDismiss,
  onClose,
  title,
  description,
  children,
  footer,
}: FormSheetProps) {
  const { t } = useTranslation();
  return (
    <TrueSheet
      ref={sheetRef}
      detents={detents}
      scrollable
      backgroundColor={backgroundColor}
      cornerRadius={24}
      grabber
      dimmed
      onDidDismiss={onDidDismiss}
      header={
        <View className="bg-surface gap-2 px-6 pb-5 pr-16 pt-8">
          <Typography type="h4" weight="semibold">
            {title}
          </Typography>
          <Typography type="body-sm" muted>
            {description}
          </Typography>
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel={t("common.close")}
            className="absolute right-3 top-3"
            onPress={onClose}
          >
            <AppIcon icon={AppIcons.close} size={20} />
          </Button>
        </View>
      }
      footer={<View className="bg-surface">{footer}</View>}
    >
      {children}
    </TrueSheet>
  );
}

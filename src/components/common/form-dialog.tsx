import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTranslation } from "@/stores/use-locale";
import { Button, Dialog } from "panelui-native";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
  style,
}: FormDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        dismissible={false}
        className={
          wide
            ? "w-full max-w-lg self-center overflow-hidden p-0"
            : "w-full max-w-md self-center overflow-hidden p-0"
        }
        style={style}
      >
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => onOpenChange(false)}
        >
          <AppIcon icon={AppIcons.close} size={20} />
        </Button>
        <View className="gap-2 px-6 pb-5 pr-16 pt-8">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
        </View>
        {children}
        {footer}
      </Dialog.Content>
    </Dialog>
  );
}

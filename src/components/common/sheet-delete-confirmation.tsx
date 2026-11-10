import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTranslation } from "@/stores/use-locale";
import { Button, Dialog } from "panelui-native";
import { View } from "react-native";

type SheetDeleteConfirmationProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isPending: boolean;
  onDelete: () => void;
};

export default function SheetDeleteConfirmation({
  open,
  onOpenChange,
  title,
  description,
  isPending,
  onDelete,
}: SheetDeleteConfirmationProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content dismissible={false} className="w-full max-w-md self-center">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => onOpenChange(false)}
        >
          <AppIcon icon={AppIcons.close} size={20} />
        </Button>
        <View className="mb-5 gap-1.5">
          <View className="pr-10">
            <Dialog.Title>{title}</Dialog.Title>
          </View>
          <Dialog.Description>{description}</Dialog.Description>
        </View>
        <View className="flex-row items-center gap-3">
          <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={isPending}
            onPress={onDelete}
          >
            {isPending ? t("common.deleting") : t("common.delete")}
          </Button>
        </View>
      </Dialog.Content>
    </Dialog>
  );
}

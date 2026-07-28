import { Button, Dialog } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import DialogCloseButton from "@/components/common/dialog-close-button";
import { useTranslation } from "@/stores/use-locale";

type LogoutConfirmationDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

export default function LogoutConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: LogoutConfirmationDialogProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
          <DialogCloseButton />
          <View className="mb-5 gap-1.5 pr-10">
            <Dialog.Title>{t("logout.title")}</Dialog.Title>
            <Dialog.Description>{t("logout.description")}</Dialog.Description>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
              <Button.Label>{t("common.cancel")}</Button.Label>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              <Button.Label>{t("logout.confirm")}</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

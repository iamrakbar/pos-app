import { Button, Dialog } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import DialogCloseButton from "@/components/common/DialogCloseButton";

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
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
          <DialogCloseButton />
          <View className="mb-5 gap-1.5 pr-10">
            <Dialog.Title>Log out?</Dialog.Title>
            <Dialog.Description>
              You’ll need to sign in again to access this merchant workspace.
            </Dialog.Description>
          </View>
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              <Button.Label>Log out</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

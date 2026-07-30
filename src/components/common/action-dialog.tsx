import DialogCloseButton from "@/components/common/dialog-close-button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Button, Dialog } from "heroui-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type ActionVariant = "primary" | "danger";

export type ActionDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  cancelLabel?: string;
  actionLabel?: string;
  actionVariant?: ActionVariant;
  isActionDisabled?: boolean;
  onAction?: () => void | Promise<void>;
};

export default function ActionDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  cancelLabel,
  actionLabel,
  actionVariant = "primary",
  isActionDisabled = false,
  onAction,
}: ActionDialogProps): React.JSX.Element {
  const { isCompact } = useResponsiveLayout();
  const { t } = useTranslation();

  const handleAction = async () => {
    await onAction?.();
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
          <DialogCloseButton />
          <View className="mb-5 gap-1.5 pr-10">
            <Dialog.Title>{title}</Dialog.Title>
            {description ? <Dialog.Description>{description}</Dialog.Description> : null}
          </View>
          <View className={`gap-3 ${isCompact ? "" : "flex-row justify-end"}`}>
            <Button
              variant="ghost"
              size="sm"
              className={isCompact ? "w-full" : undefined}
              onPress={() => onOpenChange(false)}
            >
              <Button.Label>{cancelLabel ?? t("common.cancel")}</Button.Label>
            </Button>
            {actionLabel ? (
              <Button
                variant={actionVariant}
                size="sm"
                className={isCompact ? "w-full" : undefined}
                isDisabled={isActionDisabled}
                onPress={handleAction}
              >
                <Button.Label>{actionLabel}</Button.Label>
              </Button>
            ) : null}
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

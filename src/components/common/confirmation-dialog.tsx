import { useTranslation } from "@/stores/use-locale";
import { Button, Dialog } from "panelui-native";

type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
};

export function ConfirmationDialogContent({
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
}: Omit<ConfirmationDialogProps, "open" | "onOpenChange">) {
  const { t } = useTranslation();
  return (
    <Dialog.Content>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>{description}</Dialog.Description>
      <Dialog.Footer>
        <Dialog.Close>
          <Button variant="ghost" size="sm">
            {t("common.cancel")}
          </Button>
        </Dialog.Close>
        <Button variant="destructive" size="sm" disabled={disabled} onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  );
}

export default function ConfirmationDialog({
  open,
  onOpenChange,
  ...content
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ConfirmationDialogContent {...content} />
    </Dialog>
  );
}

import type { PrinterPrompt } from "@/hooks/printer/use-receipt-printer";
import { useTranslation } from "@/stores/use-locale";
import { Button, Dialog } from "panelui-native";

type PrinterPromptDialogProps = {
  prompt: PrinterPrompt | null;
  onClose: () => void;
  onAction: () => void;
};

export default function PrinterPromptDialog({
  prompt,
  onClose,
  onAction,
}: PrinterPromptDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={prompt !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Title>{prompt?.title}</Dialog.Title>
        {prompt?.message ? <Dialog.Description>{prompt.message}</Dialog.Description> : null}
        <Dialog.Footer>
          <Dialog.Close>
            <Button variant="ghost" size="sm">
              {prompt?.actionLabel ? t("common.cancel") : t("common.close")}
            </Button>
          </Dialog.Close>
          {prompt?.actionLabel ? (
            <Button size="sm" onPress={onAction}>
              {prompt.actionLabel}
            </Button>
          ) : null}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

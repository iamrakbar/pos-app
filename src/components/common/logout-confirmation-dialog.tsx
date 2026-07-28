import type { JSX } from "react";
import { useTranslation } from "@/stores/use-locale";
import ActionDialog from "@/components/common/action-dialog";

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
    <ActionDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("logout.title")}
      description={t("logout.description")}
      cancelLabel={t("common.cancel")}
      actionLabel={t("logout.confirm")}
      actionVariant="danger"
      onAction={onConfirm}
    />
  );
}

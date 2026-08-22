import ActionDialog from "@/components/common/action-dialog";
import AppIcon from "@/components/common/app-icon";
import DialogCloseButton from "@/components/common/dialog-close-button";
import { useAuth } from "@/stores/use-auth";
import { useCartStore } from "@/stores/use-cart-store";
import { useParkedOrdersStore } from "@/stores/use-parked-orders-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { resetCurrentOrder } from "@/stores/reset-current-order";
import type { ParkedOrder } from "@/types/parked-order";
import {
  Button,
  Dialog,
  Input,
  Label,
  Surface,
  TextField,
  Typography,
  useThemeColor,
} from "heroui-native";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type TriggerMode = "park" | "list";

type ParkedOrdersPanelProps = {
  mode: TriggerMode;
  isDisabled?: boolean;
};

function formatDraftTime(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ParkedOrdersPanel({
  mode,
  isDisabled = false,
}: ParkedOrdersPanelProps): JSX.Element {
  const { t } = useTranslation();
  const merchantId = useAuth((state) => state.merchantId);
  const merchant_id = useCartStore((state) => state.merchant_id);
  const table_id = useCartStore((state) => state.table_id);
  const products = useCartStore((state) => state.products);
  const notes = useCartStore((state) => state.notes);
  const checkoutForm = usePOSStore((state) => state.checkoutForm);
  const replaceCart = useCartStore((state) => state.replaceCart);
  const replaceCheckoutForm = usePOSStore((state) => state.replaceCheckoutForm);
  const drafts = useParkedOrdersStore((state) => state.drafts);
  const parkOrder = useParkedOrdersStore((state) => state.parkOrder);
  const removeOrder = useParkedOrdersStore((state) => state.removeOrder);
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ParkedOrder | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ParkedOrder | null>(null);
  const [colorMuted] = useThemeColor(["accent", "muted"]);

  const merchantDrafts = drafts
    .filter((draft) => draft.merchant_id === merchantId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const openPanel = () => {
    setLabel("");
    setIsOpen(true);
  };

  const handlePark = () => {
    if (!merchantId || products.length === 0) return;
    parkOrder(merchantId, label, { merchant_id, table_id, products, notes }, checkoutForm);
    resetCurrentOrder();
    setLabel("");
    setIsOpen(false);
  };

  const handleRestore = (draft: ParkedOrder) => {
    if (products.length > 0) {
      setRestoreTarget(draft);
      return;
    }

    resetCurrentOrder();
    replaceCart(draft.cart);
    replaceCheckoutForm(draft.checkout_form);
    removeOrder(draft.merchant_id, draft.id);
    setIsOpen(false);
  };

  const confirmRestoreAfterClear = () => {
    if (!restoreTarget) return;
    resetCurrentOrder();
    replaceCart(restoreTarget.cart);
    replaceCheckoutForm(restoreTarget.checkout_form);
    removeOrder(restoreTarget.merchant_id, restoreTarget.id);
    setRestoreTarget(null);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={mode === "park" ? "ghost" : "secondary"}
        size="sm"
        isIconOnly={mode === "park"}
        isDisabled={isDisabled || !merchantId}
        onPress={openPanel}
        accessibilityLabel={mode === "park" ? t("pos.parkOrder") : t("pos.parkedOrders")}
      >
        {mode === "list" ? (
          <Button.Label>
            {t("pos.parkedOrdersCount", { count: merchantDrafts.length })}
          </Button.Label>
        ) : (
          <AppIcon name="save-outline" size={18} color={colorMuted} />
        )}
      </Button>

      <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="w-full max-w-md self-center">
            <DialogCloseButton />
            <Dialog.Title className="pr-10">
              {mode === "park" ? t("pos.parkOrder") : t("pos.parkedOrders")}
            </Dialog.Title>
            <Dialog.Description>
              {mode === "park" ? t("pos.parkOrderDescription") : t("pos.parkedOrdersDescription")}
            </Dialog.Description>

            {mode === "park" ? (
              <View className="mt-5 gap-4">
                <TextField>
                  <Label>{t("pos.parkedOrderName")}</Label>
                  <Input
                    value={label}
                    onChangeText={setLabel}
                    placeholder={t("pos.parkedOrderNamePlaceholder")}
                    returnKeyType="done"
                  />
                </TextField>
                <Button onPress={handlePark}>
                  <Button.Label>{t("pos.parkOrder")}</Button.Label>
                </Button>
              </View>
            ) : (
              <View className="mt-5 gap-3">
                {merchantDrafts.length === 0 ? (
                  <Surface variant="secondary" className="items-center gap-1 p-5">
                    <AppIcon name="time-outline" size={22} />
                    <Typography weight="semibold">{t("pos.parkedOrdersEmpty")}</Typography>
                    <Typography type="body-sm" color="muted" className="text-center">
                      {t("pos.parkedOrdersEmptyDescription")}
                    </Typography>
                  </Surface>
                ) : (
                  merchantDrafts.map((draft) => (
                    <Surface
                      key={draft.id}
                      variant="secondary"
                      className="flex-row items-center gap-3 p-3"
                    >
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Typography weight="semibold" numberOfLines={1}>
                          {draft.label}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                          {t("pos.parkedOrderMeta", {
                            count: draft.cart.products.reduce((total, item) => total + item.qty, 0),
                            time: formatDraftTime(draft.updated_at),
                          })}
                        </Typography>
                      </View>
                      <Button size="sm" variant="primary" onPress={() => handleRestore(draft)}>
                        <Button.Label>{t("pos.resumeOrder")}</Button.Label>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        onPress={() => setDeleteTarget(draft)}
                        accessibilityLabel={t("pos.deleteParkedOrder", { label: draft.label })}
                      >
                        <AppIcon name="trash-outline" size={17} />
                      </Button>
                    </Surface>
                  ))
                )}
              </View>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <ActionDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("pos.deleteParkedOrderTitle")}
        description={t("pos.deleteParkedOrderDescription", { label: deleteTarget?.label ?? "" })}
        actionLabel={t("common.delete")}
        actionVariant="danger"
        onAction={() => {
          if (merchantId && deleteTarget) removeOrder(merchantId, deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <ActionDialog
        isOpen={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        title={t("pos.replaceActiveOrderTitle")}
        description={t("pos.replaceActiveOrderDescription")}
        actionLabel={t("pos.clearAndResume")}
        actionVariant="danger"
        onAction={confirmRestoreAfterClear}
      />
    </>
  );
}

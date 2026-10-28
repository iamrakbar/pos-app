import {
  Surface,
  Typography,
  Button as PanelDialogButton,
  Dialog as PanelDialog,
  Input as PanelInput,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useAuth } from "@/stores/use-auth";
import { useCartStore } from "@/stores/use-cart-store";
import { useParkedOrdersStore } from "@/stores/use-parked-orders-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { resetCurrentOrder } from "@/stores/reset-current-order";
import { formatTime } from "@/utils/format";
import type { ParkedOrder } from "@/types/parked-order";
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
  return formatTime(value);
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
  const [colorAcent, colorMuted, colorDanger] = useCSSVariable([
    "--color-primary",
    "--color-muted-foreground",
    "--color-destructive",
  ]) as [string, string, string];

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
      <PanelDialogButton
        variant={mode === "park" ? "ghost" : "secondary"}
        size={mode === "park" ? "icon" : "sm"}
        disabled={isDisabled || !merchantId}
        onPress={openPanel}
        accessibilityLabel={mode === "park" ? t("pos.parkOrder") : t("pos.parkedOrders")}
        startContent={
          mode === "list" ? (
            <AppIcon icon={AppIcons.queue} size={18} color={colorAcent} />
          ) : undefined
        }
      >
        {mode === "list" ? (
          String(merchantDrafts.length)
        ) : (
          <AppIcon icon={AppIcons.save} size={21} color={colorMuted} />
        )}
      </PanelDialogButton>

      <PanelDialog open={isOpen} onOpenChange={setIsOpen}>
        <PanelDialog.Content className="w-full max-w-md self-center">
          <PanelDialogButton
            variant="ghost"
            size="icon"
            accessibilityLabel={t("common.close")}
            className="absolute right-3 top-3 z-50"
            onPress={() => setIsOpen(false)}
          >
            ×
          </PanelDialogButton>
          <PanelDialog.Title className="pr-10">
            {mode === "park" ? t("pos.parkOrder") : t("pos.parkedOrders")}
          </PanelDialog.Title>
          <PanelDialog.Description>
            {mode === "park" ? t("pos.parkOrderDescription") : t("pos.parkedOrdersDescription")}
          </PanelDialog.Description>

          {mode === "park" ? (
            <View className="mt-5 gap-4">
              <PanelInput
                label={t("pos.parkedOrderName")}
                value={label}
                onChangeText={setLabel}
                placeholder={t("pos.parkedOrderNamePlaceholder")}
                returnKeyType="done"
              />
              <PanelDialogButton onPress={handlePark}>{t("pos.parkOrder")}</PanelDialogButton>
            </View>
          ) : (
            <View className="mt-5 gap-3">
              {merchantDrafts.length === 0 ? (
                <Surface variant="secondary" className="items-center gap-1 p-5">
                  <AppIcon icon={AppIcons.time} size={22} color={colorMuted} />
                  <Typography weight="semibold">{t("pos.parkedOrdersEmpty")}</Typography>
                  <Typography type="body-sm" muted className="text-center">
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
                      <Typography type="body-xs" muted>
                        {t("pos.parkedOrderMeta", {
                          count: draft.cart.products.reduce((total, item) => total + item.qty, 0),
                          time: formatDraftTime(draft.updated_at),
                        })}
                      </Typography>
                    </View>
                    <PanelDialogButton
                      size="sm"
                      variant="primary"
                      onPress={() => handleRestore(draft)}
                    >
                      {t("pos.resumeOrder")}
                    </PanelDialogButton>
                    <PanelDialogButton
                      size="icon"
                      variant="ghost"
                      onPress={() => setDeleteTarget(draft)}
                      accessibilityLabel={t("pos.deleteParkedOrder", { label: draft.label })}
                    >
                      <AppIcon icon={AppIcons.trash} size={17} color={colorDanger} />
                    </PanelDialogButton>
                  </Surface>
                ))
              )}
            </View>
          )}
        </PanelDialog.Content>
      </PanelDialog>

      <PanelDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <PanelDialog.Content dismissible={false} className="w-full max-w-md self-center">
          <PanelDialogButton
            variant="ghost"
            size="icon"
            accessibilityLabel={t("common.close")}
            className="absolute right-3 top-3 z-50"
            onPress={() => setDeleteTarget(null)}
          >
            ×
          </PanelDialogButton>
          <View className="mb-5 gap-1.5">
            <View className="pr-10">
              <PanelDialog.Title>{t("pos.deleteParkedOrderTitle")}</PanelDialog.Title>
            </View>
            <PanelDialog.Description>
              {t("pos.deleteParkedOrderDescription", { label: deleteTarget?.label ?? "" })}
            </PanelDialog.Description>
          </View>
          <View className="flex-row items-center gap-3">
            <PanelDialogButton variant="ghost" size="sm" onPress={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </PanelDialogButton>
            <PanelDialogButton
              variant="destructive"
              size="sm"
              className="flex-1"
              onPress={() => {
                if (merchantId && deleteTarget) removeOrder(merchantId, deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {t("common.delete")}
            </PanelDialogButton>
          </View>
        </PanelDialog.Content>
      </PanelDialog>

      <PanelDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
      >
        <PanelDialog.Content dismissible={false} className="w-full max-w-md self-center">
          <PanelDialogButton
            variant="ghost"
            size="icon"
            accessibilityLabel={t("common.close")}
            className="absolute right-3 top-3 z-50"
            onPress={() => setRestoreTarget(null)}
          >
            ×
          </PanelDialogButton>
          <View className="mb-5 gap-1.5">
            <View className="pr-10">
              <PanelDialog.Title>{t("pos.replaceActiveOrderTitle")}</PanelDialog.Title>
            </View>
            <PanelDialog.Description>
              {t("pos.replaceActiveOrderDescription")}
            </PanelDialog.Description>
          </View>
          <View className="flex-row items-center gap-3">
            <PanelDialogButton variant="ghost" size="sm" onPress={() => setRestoreTarget(null)}>
              {t("common.cancel")}
            </PanelDialogButton>
            <PanelDialogButton
              variant="destructive"
              size="sm"
              className="flex-1"
              onPress={confirmRestoreAfterClear}
            >
              {t("pos.clearAndResume")}
            </PanelDialogButton>
          </View>
        </PanelDialog.Content>
      </PanelDialog>
    </>
  );
}

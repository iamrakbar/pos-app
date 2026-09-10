import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import AdjustStockOverlay from "@/screens/inventory/adjust-stock-overlay";
import RecordMovementOverlay from "@/screens/inventory/record-movement-overlay";
import type { Ingredient } from "@/screens/inventory/ingredient-stock-overlay-utils";
import { formatDateTime, formatInventoryQuantity, formatRupiah } from "@/utils/format";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, Card, Chip, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import { useFocusEffect, useRouter } from "expo-router";
import { SheetHeader } from "@/screens/inventory/ingredient-relationship-sheet-shared";

type IngredientDetailSheetProps = {
  ingredient: Ingredient;
  sheetRef: React.RefObject<TrueSheet | null>;
  onEdit: () => void;
  onShowSupplierOffers: () => void;
  onShowMovements: () => void;
};

function IngredientStatus({ ingredient }: { ingredient: Ingredient }): React.JSX.Element {
  const { t } = useTranslation();
  const isLowStock =
    ingredient.reorder_point > 0 && ingredient.current_stock <= ingredient.reorder_point;
  const status = !ingredient.active ? "inactive" : isLowStock ? "lowStock" : "active";
  const statusPresentation = (
    { active: "success", lowStock: "warning", inactive: "danger" } as const
  )[status];

  return (
    <Chip color={statusPresentation} size="sm" variant="soft">
      <Chip.Label>
        {status === "inactive"
          ? t("common.inactive")
          : status === "lowStock"
            ? t("ingredients.lowStock")
            : t("common.active")}
      </Chip.Label>
    </Chip>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View className="min-w-0 flex-1 rounded-2xl bg-surface-secondary p-4">
      <Typography type="body-xs" color="muted" numberOfLines={1}>
        {label}
      </Typography>
      <Typography type="body-sm" weight="semibold" className="mt-1" numberOfLines={1}>
        {value}
      </Typography>
    </View>
  );
}

function DetailAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof AppIcon>["icon"];
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const [themeColorAccent] = useThemeColor(["accent"]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="min-w-0 flex-1"
      onPress={onPress}
      accessibilityLabel={label}
    >
      <AppIcon icon={icon} size={17} color={themeColorAccent} />
      <Button.Label numberOfLines={1}>{label}</Button.Label>
    </Button>
  );
}

export default function IngredientDetailSheet({
  ingredient,
  sheetRef,
  onEdit,
  onShowSupplierOffers,
  onShowMovements,
}: IngredientDetailSheetProps): React.JSX.Element {
  const { t } = useTranslation();
  const [themeColorForeground] = useThemeColor(["foreground"]);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = React.useState(false);
  const [isRecordMovementOpen, setIsRecordMovementOpen] = React.useState(false);

  const dismissThen = async (action: () => void) => {
    await sheetRef.current?.dismiss().catch(() => undefined);
    action();
  };

  return (
    <>
      <TrueSheet
        ref={sheetRef}
        detents={[0.8, 1]}
        scrollable
        grabber
        cornerRadius={24}
        maxContentWidth={900}
        header={
          <SheetHeader
            title={ingredient.name}
            description={t("ingredients.detailsTitle")}
            onClose={() => void sheetRef.current?.dismiss()}
          />
        }
        footer={
          <View className="border-t border-border bg-surface px-5 pb-safe pt-4">
            <View className="flex-row gap-2">
              <DetailAction
                icon={AppIcons.pencil}
                label={t("ingredients.editTitle")}
                onPress={() => void dismissThen(onEdit)}
              />
              <DetailAction
                icon={AppIcons.options}
                label={t("ingredients.adjustStock")}
                onPress={() => void dismissThen(() => setIsAdjustStockOpen(true))}
              />
              <DetailAction
                icon={AppIcons.addCircle}
                label={t("ingredients.recordMovement")}
                onPress={() => void dismissThen(() => setIsRecordMovementOpen(true))}
              />
            </View>
          </View>
        }
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-4 px-5 pb-20 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <Card className="gap-3">
            <Card.Header>
              <View className="flex-row items-center justify-between gap-3">
                <View className="gap-2 flex-1">
                  <Card.Title>{t("ingredients.inventoryDetails")}</Card.Title>
                  <Card.Description>
                    {t("ingredients.inventoryDetailsDescription")}
                  </Card.Description>
                </View>
                <IngredientStatus ingredient={ingredient} />
              </View>
            </Card.Header>
            <Card.Body className="gap-3">
              <View className="gap-1 rounded-2xl bg-accent-soft p-4">
                <Typography type="body-xs" color="muted">
                  {t("ingredients.currentStock")}
                </Typography>
                <Typography type="h2" weight="bold" className="tabular-nums">
                  {formatInventoryQuantity(ingredient.current_stock)} {ingredient.base_unit}
                </Typography>
              </View>
              <View className="flex-row gap-3">
                <DetailMetric
                  label={t("ingredients.reorderPoint")}
                  value={`${formatInventoryQuantity(ingredient.reorder_point)} ${ingredient.base_unit}`}
                />
                <DetailMetric label={t("ingredients.unit")} value={ingredient.base_unit} />
              </View>
            </Card.Body>
          </Card>

          <Card className="gap-3">
            <Card.Header>
              <Card.Title>{t("ingredients.detailsTitle")}</Card.Title>
            </Card.Header>
            <Card.Body className="gap-3">
              <View className="flex-row gap-3">
                <DetailMetric
                  label={t("ingredients.costPerUnit")}
                  value={
                    ingredient.cost_per_unit === null ? "—" : formatRupiah(ingredient.cost_per_unit)
                  }
                />
                <DetailMetric
                  label={t("ingredients.supplier")}
                  value={ingredient.preferred_supplier?.name ?? "—"}
                />
              </View>
              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  className="min-w-0 flex-1"
                  onPress={() => void dismissThen(onShowMovements)}
                >
                  <AppIcon icon={AppIcons.swapVertical} size={18} color={themeColorForeground} />
                  <Button.Label numberOfLines={1}>
                    {t("ingredients.inventoryMovements")}
                  </Button.Label>
                </Button>
                <Button
                  variant="outline"
                  className="min-w-0 flex-1"
                  onPress={() => void dismissThen(onShowSupplierOffers)}
                >
                  <AppIcon icon={AppIcons.people} size={18} color={themeColorForeground} />
                  <Button.Label numberOfLines={1}>{t("ingredients.supplierOffers")}</Button.Label>
                </Button>
              </View>
              <Typography type="body-xs" color="muted" className="px-3 pt-2">
                {t("ingredients.updatedAt")}: {formatDateTime(ingredient.updated_at)}
              </Typography>
            </Card.Body>
          </Card>
        </ScrollView>
      </TrueSheet>
      <AdjustStockOverlay
        ingredient={ingredient}
        isOpen={isAdjustStockOpen}
        onOpenChange={setIsAdjustStockOpen}
      />
      <RecordMovementOverlay
        ingredient={ingredient}
        isOpen={isRecordMovementOpen}
        onOpenChange={setIsRecordMovementOpen}
      />
    </>
  );
}

export function IngredientDetailCoordinator({
  ingredient,
  openRequest,
}: {
  ingredient: Ingredient | null;
  openRequest: number;
}): React.JSX.Element | null {
  const router = useRouter();
  const detailSheetRef = React.useRef<TrueSheet | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!ingredient || openRequest === 0) return;
      void detailSheetRef.current?.present(0).catch(() => undefined);
    }, [ingredient, openRequest])
  );

  if (!ingredient) return null;

  const navigateFromSheet = async (action: () => void) => {
    await detailSheetRef.current?.dismiss().catch(() => undefined);
    action();
  };

  return (
    <IngredientDetailSheet
      ingredient={ingredient}
      sheetRef={detailSheetRef}
      onEdit={() =>
        void navigateFromSheet(() =>
          router.push(`/settings/inventory/ingredients/${ingredient.id}`)
        )
      }
      onShowSupplierOffers={() =>
        void navigateFromSheet(() =>
          router.push(`/settings/inventory/ingredients/${ingredient.id}/supplier-offers`)
        )
      }
      onShowMovements={() =>
        void navigateFromSheet(() =>
          router.push(`/settings/inventory/ingredients/${ingredient.id}/movements`)
        )
      }
    />
  );
}

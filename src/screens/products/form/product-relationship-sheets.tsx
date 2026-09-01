import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useProductRecipe } from "@/hooks/db/use-products";
import type { InventoryMovementType } from "@/api/endpoints/inventory-audit";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, Chip, Spinner, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Table } from "heroui-native-pro";
import React from "react";
import { ScrollView, View } from "react-native";

type Movement = App.Data.Merchant.Inventory.InventoryMovementData;
type RecipeIngredient = App.Data.Merchant.Inventory.RecipeIngredientData;

type ProductRelationshipSheetsProps = {
  productId: string;
  productName: string;
  showMovements: boolean;
  showRecipe: boolean;
  movementsSheetRef: React.RefObject<TrueSheet | null>;
  recipeSheetRef: React.RefObject<TrueSheet | null>;
};

const MOVEMENT_TYPE_COLORS: Record<
  InventoryMovementType,
  "accent" | "success" | "warning" | "danger"
> = {
  opening: "success",
  purchase: "success",
  sale: "accent",
  reversal: "warning",
  adjustment: "accent",
  waste: "danger",
  damage: "danger",
  return: "warning",
};

function formatSignedQuantity(value: number): string {
  const quantity = formatInventoryQuantity(Math.abs(value));
  return value > 0 ? `+${quantity}` : value < 0 ? `-${quantity}` : quantity;
}

function SheetHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}): React.JSX.Element {
  const [themeColorForeground] = useThemeColor(["foreground"]);
  const { t } = useTranslation();

  return (
    <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
      <Typography type="h4" weight="semibold">
        {title}
      </Typography>
      <Typography type="body-sm" color="muted" numberOfLines={2}>
        {description}
      </Typography>
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        className="absolute right-3 top-3"
        onPress={onClose}
        accessibilityLabel={t("common.close")}
      >
        <AppIcon name="close-outline" size={20} color={themeColorForeground} />
      </Button>
    </View>
  );
}

function SheetLoading(): React.JSX.Element {
  return (
    <View className="items-center justify-center py-20">
      <Spinner size="sm" />
    </View>
  );
}

function MovementTypeChip({ type }: { type: InventoryMovementType }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Chip color={MOVEMENT_TYPE_COLORS[type]} size="sm" variant="soft">
      <Chip.Label>{t(`movements.types.${type}` as TranslationKey)}</Chip.Label>
    </Chip>
  );
}

function MovementSourceChip({ source }: { source: string }): React.JSX.Element {
  return (
    <Chip color="default" size="sm" variant="soft">
      <Chip.Label numberOfLines={1} ellipsizeMode="tail">
        {normalizeInventorySource(source)}
      </Chip.Label>
    </Chip>
  );
}

function MovementsTable({ movements }: { movements: Movement[] }): React.JSX.Element {
  const { t } = useTranslation();
  const [themeColorMuted] = useThemeColor(["muted"]);

  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="w-full self-center">
        <Table.Content className="w-full">
          <Table.Header>
            <Table.Column id="type" width={140}>
              {t("movements.type")}
            </Table.Column>
            <Table.Column id="quantity" width={150}>
              {t("movements.quantity")}
            </Table.Column>
            <Table.Column id="balance_after" width={150}>
              {t("movements.balanceAfter")}
            </Table.Column>
            <Table.Column id="cost_per_unit" width={160}>
              {t("movements.costPerUnit")}
            </Table.Column>
            <Table.Column id="source" width={160}>
              {t("movements.source")}
            </Table.Column>
            <Table.Column id="reason" width={220}>
              {t("movements.reason")}
            </Table.Column>
            <Table.Column id="actor" width={170}>
              {t("movements.actor")}
            </Table.Column>
            <Table.Column id="moved_at" width={180}>
              {t("movements.movedAt")}
            </Table.Column>
          </Table.Header>
          <Table.Body
            items={movements}
            keyExtractor={(movement) => movement.id}
            renderEmptyState={() => (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="swap-vertical-outline" size={22} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("productForm.inventoryMovementsEmpty")}</EmptyState.Title>
                  <EmptyState.Description>
                    {t("productForm.inventoryMovementsEmptyDescription")}
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          >
            {(movement) => (
              <Table.Row id={movement.id}>
                <Table.Cell>
                  <MovementTypeChip type={movement.type} />
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatSignedQuantity(movement.quantity)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatInventoryQuantity(movement.balance_after)}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {movement.cost_per_unit === null ? "—" : formatRupiah(movement.cost_per_unit)}
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  <MovementSourceChip source={movement.source} />
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>{movement.reason ?? "—"}</Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  {movement.actor?.name ?? "—"}
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatDateTime(movement.moved_at)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

function RecipeTable({ ingredients }: { ingredients: RecipeIngredient[] }): React.JSX.Element {
  const { t } = useTranslation();
  const [themeColorMuted] = useThemeColor(["muted"]);

  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="w-full self-center">
        <Table.Content className="w-full">
          <Table.Header>
            <Table.Column id="ingredient" width={220}>
              {t("productForm.recipeIngredient")}
            </Table.Column>
            <Table.Column id="quantity" width={150}>
              {t("productForm.recipeQuantity")}
            </Table.Column>
            <Table.Column id="unit" width={150}>
              {t("productForm.recipeUnit")}
            </Table.Column>
            <Table.Column id="cost_contribution" width={190}>
              {t("productForm.recipeCostContribution")}
            </Table.Column>
          </Table.Header>
          <Table.Body
            items={ingredients}
            keyExtractor={(ingredient) => ingredient.ingredient_id}
            renderEmptyState={() => (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="restaurant-outline" size={22} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("productForm.recipeEmpty")}</EmptyState.Title>
                  <EmptyState.Description>
                    {t("productForm.recipeEmptyDescription")}
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          >
            {(ingredient) => (
              <Table.Row id={ingredient.ingredient_id}>
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  <Typography weight="semibold" numberOfLines={1}>
                    {ingredient.name}
                  </Typography>
                </Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {formatInventoryQuantity(ingredient.quantity)}
                </Table.Cell>
                <Table.Cell textProps={{ numberOfLines: 1 }}>{ingredient.unit}</Table.Cell>
                <Table.Cell textProps={{ className: "tabular-nums" }}>
                  {ingredient.cost_contribution === null
                    ? "—"
                    : formatRupiah(ingredient.cost_contribution)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

export default function ProductRelationshipSheets({
  productId,
  productName,
  showMovements,
  showRecipe,
  movementsSheetRef,
  recipeSheetRef,
}: ProductRelationshipSheetsProps): React.JSX.Element {
  const { t } = useTranslation();
  const movementsQuery = useInventoryMovements({ productId }, { enabled: showMovements });
  const recipeQuery = useProductRecipe(productId, showRecipe);
  const movements = movementsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const recipe = recipeQuery.data;

  return (
    <>
      {showMovements ? (
        <TrueSheet
          ref={movementsSheetRef}
          detents={[0.65, 1]}
          scrollable
          grabber
          cornerRadius={24}
          maxContentWidth={1100}
          header={
            <SheetHeader
              title={t("productForm.inventoryMovements")}
              description={`${productName} · ${t("productForm.inventoryMovementsDescription")}`}
              onClose={() => void movementsSheetRef.current?.dismiss()}
            />
          }
        >
          <ScrollView
            className="flex-1 bg-surface-secondary"
            contentContainerClassName="px-4 py-4"
            showsVerticalScrollIndicator={false}
          >
            {movementsQuery.isLoading ? (
              <SheetLoading />
            ) : movementsQuery.isError ? (
              <ErrorState error={movementsQuery.error} onRetry={movementsQuery.refetch} />
            ) : (
              <MovementsTable movements={movements} />
            )}
            {movementsQuery.hasNextPage ? (
              <View className="flex-row items-center justify-end pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => void movementsQuery.fetchNextPage()}
                  isDisabled={movementsQuery.isFetchingNextPage}
                >
                  <Button.Label>
                    {movementsQuery.isFetchingNextPage
                      ? t("movements.loadingMore")
                      : t("movements.loadMore")}
                  </Button.Label>
                </Button>
              </View>
            ) : null}
          </ScrollView>
        </TrueSheet>
      ) : null}

      {showRecipe ? (
        <TrueSheet
          ref={recipeSheetRef}
          detents={[0.65, 1]}
          scrollable
          grabber
          cornerRadius={24}
          maxContentWidth={900}
          header={
            <SheetHeader
              title={t("productForm.recipe")}
              description={`${productName} · ${t("productForm.recipeDescription")}`}
              onClose={() => void recipeSheetRef.current?.dismiss()}
            />
          }
        >
          <ScrollView
            className="flex-1 bg-surface-secondary"
            contentContainerClassName="gap-4 px-4 py-4"
            showsVerticalScrollIndicator={false}
          >
            {recipeQuery.isLoading ? (
              <SheetLoading />
            ) : recipeQuery.isError ? (
              <ErrorState error={recipeQuery.error} onRetry={recipeQuery.refetch} />
            ) : (
              <>
                {recipe ? (
                  <View className="flex-row items-center justify-between gap-3 rounded-panel-inner bg-surface px-4 py-3">
                    <Typography type="body-sm" color="muted">
                      {t("productForm.recipeEstimatedUnitCogs")}
                    </Typography>
                    <Typography weight="semibold" className="tabular-nums">
                      {formatRupiah(recipe.estimated_unit_cogs)}
                    </Typography>
                  </View>
                ) : null}
                <RecipeTable ingredients={recipe?.ingredients ?? []} />
              </>
            )}
          </ScrollView>
        </TrueSheet>
      ) : null}
    </>
  );
}

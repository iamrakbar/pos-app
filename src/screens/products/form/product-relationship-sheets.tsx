import AppIcon from "@/components/common/app-icon";
import InventoryMovementsTable from "@/components/common/inventory-movements-table";
import ErrorState from "@/components/common/error-state";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useProductRecipe } from "@/hooks/db/use-products";
import { useTranslation } from "@/stores/use-locale";
import { formatInventoryQuantity, formatRupiah } from "@/utils/format";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, Spinner, Typography, useThemeColor } from "heroui-native";
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
  const movementsQuery = useInventoryMovements({ productId }, { enabled: showMovements });
  const recipeQuery = useProductRecipe(productId, showRecipe);
  const movements = movementsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const recipe = recipeQuery.data;

  return (
    <>
      {showMovements ? (
        <ProductMovementsSheet
          productName={productName}
          sheetRef={movementsSheetRef}
          query={movementsQuery}
          movements={movements}
        />
      ) : null}

      {showRecipe ? (
        <ProductRecipeSheet
          productName={productName}
          sheetRef={recipeSheetRef}
          query={recipeQuery}
          recipe={recipe}
        />
      ) : null}
    </>
  );
}

function ProductMovementsSheet({
  productName,
  sheetRef,
  query,
  movements,
}: {
  productName: string;
  sheetRef: React.RefObject<TrueSheet | null>;
  query: ReturnType<typeof useInventoryMovements>;
  movements: Movement[];
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.65, 1]}
      scrollable
      grabber
      cornerRadius={24}
      maxContentWidth={1100}
      header={
        <SheetHeader
          title={t("productForm.inventoryMovements")}
          description={`${productName} · ${t("productForm.inventoryMovementsDescription")}`}
          onClose={() => void sheetRef.current?.dismiss()}
        />
      }
    >
      <ScrollView
        className="flex-1 bg-surface-secondary"
        contentContainerClassName="px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading ? (
          <SheetLoading />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          <InventoryMovementsTable
            movements={movements}
            emptyTitle={t("productForm.inventoryMovementsEmpty")}
            emptyDescription={t("productForm.inventoryMovementsEmptyDescription")}
            variant="secondary"
          />
        )}
        {query.hasNextPage ? (
          <View className="flex-row items-center justify-end pt-3">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => void query.fetchNextPage()}
              isDisabled={query.isFetchingNextPage}
            >
              <Button.Label>
                {query.isFetchingNextPage ? t("movements.loadingMore") : t("movements.loadMore")}
              </Button.Label>
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </TrueSheet>
  );
}

function ProductRecipeSheet({
  productName,
  sheetRef,
  query,
  recipe,
}: {
  productName: string;
  sheetRef: React.RefObject<TrueSheet | null>;
  query: ReturnType<typeof useProductRecipe>;
  recipe: ReturnType<typeof useProductRecipe>["data"];
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.65, 1]}
      scrollable
      grabber
      cornerRadius={24}
      maxContentWidth={900}
      header={
        <SheetHeader
          title={t("productForm.recipe")}
          description={`${productName} · ${t("productForm.recipeDescription")}`}
          onClose={() => void sheetRef.current?.dismiss()}
        />
      }
    >
      <ScrollView
        className="flex-1 bg-surface-secondary"
        contentContainerClassName="gap-4 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading ? (
          <SheetLoading />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
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
  );
}

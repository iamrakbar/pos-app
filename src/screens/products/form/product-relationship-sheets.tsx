import {
  Typography,
  Spinner,
  Chip as PanelMovementChip,
  EmptyState as PanelMovementEmpty,
  Table as PanelMovementTable,
  Typography as PanelMovementText,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Button as PanelButton,
  Label as PanelLabel,
  Input as PanelInput,
} from "panelui-native";
import {
  MOVEMENT_TYPE_COLORS,
  MOVEMENT_TABLE_COLUMNS,
  MOVEMENT_TABLE_WIDTH,
  formatSignedQuantity,
} from "@/utils/inventory-movement-table";
import { getErrorMessage } from "@/api/api-error";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useIngredients } from "@/hooks/db/use-ingredients";
import { useProductRecipe, useUpdateProductRecipe } from "@/hooks/db/use-products";
import { useLocalizedNumberInputList } from "@/hooks/use-localized-number-input";
import { QUANTITY_FORMAT_OPTIONS } from "@/screens/inventory/ingredient-stock-overlay-utils";
import {
  getCompatibleUnits,
  toRecipeDraft,
  validateRecipeDraft,
  type InventoryUnit,
  type RecipeDraftLine,
} from "@/schemas/product-recipe";
import { useTranslation } from "@/stores/use-locale";
import {
  formatDateTime,
  formatInventoryQuantity,
  formatRupiah,
  normalizeInventorySource,
} from "@/utils/format";
import type { TranslationKey } from "@/locales";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import React from "react";
import { FlatList, ScrollView, View } from "react-native";

type Movement = App.Data.Merchant.Inventory.InventoryMovementData;

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
  const [themeColorForeground] = useCSSVariable(["--color-foreground"]) as [string];
  const { t } = useTranslation();

  return (
    <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
      <Typography type="h4" weight="semibold">
        {title}
      </Typography>
      <Typography type="body-sm" muted numberOfLines={2}>
        {description}
      </Typography>
      <PanelButton
        variant="ghost"
        size="icon"

        className="absolute right-3 top-3"
        onPress={onClose}
        accessibilityLabel={t("common.close")}
      >
        <AppIcon icon={AppIcons.close} size={20} color={themeColorForeground} />
      </PanelButton>
    </View>
  );
}

function RecipeEditor({
  draft,
  ingredients,
  onChange,
  onRemove,
  onOpenPicker,
}: {
  draft: RecipeDraftLine[];
  ingredients: App.Data.Merchant.Inventory.IngredientData[];
  onChange: (index: number, line: RecipeDraftLine) => void;
  onRemove: (index: number) => void;
  onOpenPicker: (kind: RecipePickerKind, index: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const getQuantityInput = useLocalizedNumberInputList(QUANTITY_FORMAT_OPTIONS);
  const [themeColorDanger] = useCSSVariable(["--color-destructive"]) as [string];
  const ingredientOptions = ingredients.map((ingredient) => ({
    value: ingredient.id,
    label: ingredient.name,
  }));

  return (
    <View className="gap-3">
      {draft.map((line, index) => {
        const quantityInput = getQuantityInput(line.id, line.quantity, (quantity) =>
          onChange(index, { ...line, quantity })
        );
        const quantityNumber = Number(line.quantity);
        const ingredient = ingredients.find((item) => item.id === line.ingredient_id);
        const unitOptions = ingredient
          ? getCompatibleUnits(ingredient.base_unit).map((unit) => ({
              value: unit,
              label: t(`ingredients.units.${unit}` as TranslationKey),
            }))
          : [];

        return (
          <View key={line.id} className="gap-3 rounded-xl bg-surface px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <Typography type="body-sm" weight="semibold">
                {t("productForm.recipeIngredient")} {index + 1}
              </Typography>
              <PanelButton
                variant="ghost"
                size="icon"

                accessibilityLabel={t("productForm.recipeRemoveIngredientAccessibility")}
                onPress={() => onRemove(index)}
              >
                <AppIcon icon={AppIcons.trash} size={17} color={themeColorDanger} />
              </PanelButton>
            </View>
            <View className="gap-1.5">
              <PanelLabel isRequired>{t("productForm.recipeIngredient")}</PanelLabel>
              <RecipePickerTrigger
                label={t("productForm.recipeIngredient")}
                value={
                  ingredientOptions.find((option) => option.value === line.ingredient_id)?.label
                }
                onPress={() => onOpenPicker("ingredient", index)}
              >
                {t("productForm.recipeIngredient")}
              </RecipePickerTrigger>
            </View>
            <View className="flex-row gap-3">
              <PanelInput
                containerClassName="flex-1"
                label={t("productForm.recipeQuantity")}
                keyboardType="decimal-pad"
                isRequired
                {...quantityInput}
                startContent={
                  <PanelButton
                    size="icon"
                    variant="ghost"
                    accessibilityLabel={t("productForm.decreaseAccessibility", {
                      field: t("productForm.recipeQuantity"),
                    })}
                    disabled={Number.isFinite(quantityNumber) && quantityNumber <= 0}
                    onPress={() =>
                      onChange(index, {
                        ...line,
                        quantity: String(Math.max(0, (quantityNumber || 0) - 1)),
                      })
                    }
                  >
                    −
                  </PanelButton>
                }
                endContent={
                  <PanelButton
                    size="icon"
                    variant="ghost"
                    accessibilityLabel={t("productForm.increaseAccessibility", {
                      field: t("productForm.recipeQuantity"),
                    })}
                    onPress={() =>
                      onChange(index, { ...line, quantity: String((quantityNumber || 0) + 1) })
                    }
                  >
                    +
                  </PanelButton>
                }
              />
              <View className="min-w-0 flex-1 gap-1.5">
                <PanelLabel isRequired>{t("productForm.recipeUnit")}</PanelLabel>
                <RecipePickerTrigger
                  label={t("productForm.recipeUnit")}
                  value={unitOptions.find((option) => option.value === line.unit)?.label}
                  onPress={() => onOpenPicker("unit", index)}
                  disabled={!ingredient}
                >
                  {t("productForm.recipeUnit")}
                </RecipePickerTrigger>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

type RecipePickerKind = "ingredient" | "unit";

type RecipePickerOption = {
  value: string;
  label: string;
};

function RecipePickerTrigger({
  label,
  value,
  onPress,
  disabled = false,
  children,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  children: string;
}): React.JSX.Element {
  const [themeColorMuted] = useCSSVariable(["--color-muted-foreground"]) as [string];

  return (
    <PanelButton
      variant="outline"
      className="min-w-0 justify-between"
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
    >
      <Typography
        type="body-sm"
        numberOfLines={1}
        className={value ? undefined : "text-muted-foreground"}
      >
        {value ?? children}
      </Typography>
      <AppIcon icon={AppIcons.chevronDown} size={17} color={themeColorMuted} />
    </PanelButton>
  );
}

function RecipePickerSheet({
  sheetRef,
  title,
  description,
  options,
  selectedValue,
  onSelect,
  onDidDismiss,
}: {
  sheetRef: React.RefObject<TrueSheet | null>;
  title: string;
  description: string;
  options: RecipePickerOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onDidDismiss: () => void;
}): React.JSX.Element {
  const [themeColorAccent] = useCSSVariable(["--color-primary"]) as [string];

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.5, 1]}
      scrollable
      grabber
      cornerRadius={24}
      maxContentWidth={600}
      onDidDismiss={onDidDismiss}
      header={
        <SheetHeader
          title={title}
          description={description}
          onClose={() => void sheetRef.current?.dismiss()}
        />
      }
    >
      <FlatList
        data={options}
        keyExtractor={(option) => option.value}
        renderItem={({ item: option }) => {
          const isSelected = option.value === selectedValue;

          return (
            <PanelButton
              variant={isSelected ? "secondary" : "ghost"}
              className="min-w-0 justify-between"
              accessibilityLabel={option.label}
              onPress={() => {
                onSelect(option.value);
                void sheetRef.current?.dismiss();
              }}
            >
              <Typography type="body-sm" numberOfLines={1}>
                {option.label}
              </Typography>
              {isSelected ? (
                <AppIcon icon={AppIcons.checkmark} size={18} color={themeColorAccent} />
              ) : null}
            </PanelButton>
          );
        }}
        className="flex-1 bg-surface-secondary"
        contentContainerClassName="gap-2 px-4 py-4"
        showsVerticalScrollIndicator={false}
      ></FlatList>
    </TrueSheet>
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
          productId={productId}
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
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;

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
          <View className="items-center justify-center py-20">
            <Spinner size="sm" label={t("movements.loadingMore")} />
          </View>
        ) : query.isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
            <PanelErrorAlert variant="destructive">
              <PanelErrorAlert.Indicator />
              <PanelErrorAlert.Content>
                <PanelErrorAlert.Description>
                  {getErrorMessage(query.error)}
                </PanelErrorAlert.Description>
              </PanelErrorAlert.Content>
            </PanelErrorAlert>
            <PanelErrorButton variant="outline" onPress={() => void query.refetch()}>
              {t("common.retry")}
            </PanelErrorButton>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ width: MOVEMENT_TABLE_WIDTH }}>
              <PanelMovementTable columns={MOVEMENT_TABLE_COLUMNS} className="bg-secondary">
                <PanelMovementTable.Header>
                  <PanelMovementTable.Row>
                    <PanelMovementTable.Head>{t("movements.type")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.quantity")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.balanceAfter")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.costPerUnit")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.source")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.reason")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.actor")}</PanelMovementTable.Head>
                    <PanelMovementTable.Head>{t("movements.movedAt")}</PanelMovementTable.Head>
                  </PanelMovementTable.Row>
                </PanelMovementTable.Header>
                {movements.length ? (
                  <PanelMovementTable.Body>
                    {movements.map((movement) => (
                      <PanelMovementTable.Row key={movement.id}>
                        <PanelMovementTable.Cell>
                          <PanelMovementChip
                            variant={MOVEMENT_TYPE_COLORS[movement.type]}
                            size="sm"
                          >
                            {t(`movements.types.${movement.type}` as TranslationKey)}
                          </PanelMovementChip>
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell labelClassName="tabular-nums">
                          {formatSignedQuantity(movement.quantity)}
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell labelClassName="tabular-nums">
                          {formatInventoryQuantity(movement.balance_after)}
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell labelClassName="tabular-nums">
                          {movement.cost_per_unit === null
                            ? "—"
                            : formatRupiah(movement.cost_per_unit)}
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell>
                          <PanelMovementChip variant="default" size="sm">
                            <PanelMovementText type="body-xs" numberOfLines={1}>
                              {normalizeInventorySource(movement.source)}
                            </PanelMovementText>
                          </PanelMovementChip>
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell>
                          <PanelMovementText type="body-sm" numberOfLines={1}>
                            {movement.reason ?? "—"}
                          </PanelMovementText>
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell>
                          <PanelMovementText type="body-sm" numberOfLines={1}>
                            {movement.actor?.name ?? "—"}
                          </PanelMovementText>
                        </PanelMovementTable.Cell>
                        <PanelMovementTable.Cell labelClassName="tabular-nums">
                          {formatDateTime(movement.moved_at)}
                        </PanelMovementTable.Cell>
                      </PanelMovementTable.Row>
                    ))}
                  </PanelMovementTable.Body>
                ) : (
                  <PanelMovementTable.Empty>
                    <PanelMovementEmpty className="py-16">
                      <PanelMovementEmpty.Header>
                        <PanelMovementEmpty.Media variant="icon">
                          <AppIcon icon={AppIcons.swapVertical} size={22} color={themeColorMuted} />
                        </PanelMovementEmpty.Media>
                        <PanelMovementEmpty.Title>
                          {t("productForm.inventoryMovementsEmpty")}
                        </PanelMovementEmpty.Title>
                        <PanelMovementEmpty.Description>
                          {t("productForm.inventoryMovementsEmptyDescription")}
                        </PanelMovementEmpty.Description>
                      </PanelMovementEmpty.Header>
                    </PanelMovementEmpty>
                  </PanelMovementTable.Empty>
                )}
              </PanelMovementTable>
            </View>
          </ScrollView>
        )}
        {query.hasNextPage ? (
          <View className="flex-row items-center justify-end pt-3">
            <PanelButton
              size="sm"
              variant="ghost"
              onPress={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t("movements.loadingMore") : t("movements.loadMore")}
            </PanelButton>
          </View>
        ) : null}
      </ScrollView>
    </TrueSheet>
  );
}

function useProductRecipeEditor(
  productId: string,
  recipe: ReturnType<typeof useProductRecipe>["data"],
  t: ReturnType<typeof useTranslation>["t"],
  toast: ReturnType<typeof useToast>["toast"]
) {
  const ingredientsQuery = useIngredients();
  const recipeMutation = useUpdateProductRecipe(productId);
  const ingredients = ingredientsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<RecipeDraftLine[]>([]);
  const [recipeError, setRecipeError] = React.useState<string | undefined>();

  const beginEditing = () => {
    setDraft(toRecipeDraft(recipe));
    setRecipeError(undefined);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(toRecipeDraft(recipe));
    setRecipeError(undefined);
    setIsEditing(false);
  };

  const addLine = () => {
    const nextIngredient = ingredients.find(
      (ingredient) => !draft.some((line) => line.ingredient_id === ingredient.id)
    );
    if (!nextIngredient) {
      setRecipeError(t("productForm.recipeNoIngredientsAvailable"));
      return;
    }
    setRecipeError(undefined);
    setDraft((current) => [
      ...current,
      {
        id: `new-${Date.now()}-${current.length}`,
        ingredient_id: nextIngredient.id,
        quantity: "",
        unit: nextIngredient.base_unit,
      },
    ]);
  };

  const saveRecipe = async () => {
    const validation = validateRecipeDraft(draft, ingredients, t);
    if ("error" in validation) {
      setRecipeError(validation.error);
      return;
    }

    try {
      await recipeMutation.mutateAsync({ ingredients: validation.lines });
      toast.show({ variant: "success", label: t("productForm.recipeSaved") });
      setRecipeError(undefined);
      setIsEditing(false);
    } catch (error) {
      setRecipeError(error instanceof Error ? error.message : t("productForm.recipeSaveFailed"));
      toast.show({ variant: "destructive", label: t("productForm.recipeSaveFailed") });
    }
  };

  const resetEditor = () => {
    setIsEditing(false);
    setRecipeError(undefined);
  };

  return {
    ingredients,
    ingredientsQuery,
    recipeError,
    isEditing,
    draft,
    recipeMutation,
    beginEditing,
    cancelEditing,
    addLine,
    saveRecipe,
    setDraft,
    resetEditor,
  };
}

function RecipeEditingFooter({
  isLoadingIngredients,
  hasIngredientError,
  isSaving,
  onAddLine,
  onCancel,
  onSave,
}: {
  isLoadingIngredients: boolean;
  hasIngredientError: boolean;
  isSaving: boolean;
  onAddLine: () => void;
  onCancel: () => void;
  onSave: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const isDisabled = isLoadingIngredients || hasIngredientError || isSaving;

  return (
    <View className="border-t border-separator bg-surface px-4 pb-safe pt-3">
      <View className="flex-row gap-2">
        <PanelButton
          size="sm"
          variant="outline"
          onPress={onAddLine}
          disabled={isDisabled}
          className="min-w-0 flex-1"
          accessibilityLabel={t("productForm.recipeAddIngredient")}
        >
          <Typography type="body-sm" numberOfLines={1}>
            {t("productForm.recipeAddIngredient")}
          </Typography>
        </PanelButton>
        <PanelButton size="sm" variant="ghost" onPress={onCancel} disabled={isSaving}>
          {t("productForm.recipeCancel")}
        </PanelButton>
        <PanelButton size="sm" onPress={onSave} disabled={isDisabled}>
          {isSaving ? t("common.saving") : t("productForm.recipeSave")}
        </PanelButton>
      </View>
    </View>
  );
}

function RecipeReadFooter({ onEdit }: { onEdit: () => void }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View className="border-t border-separator bg-surface px-4 pb-safe pt-3">
      <PanelButton size="sm" variant="outline" onPress={onEdit}>
        {t("productForm.recipeEdit")}
      </PanelButton>
    </View>
  );
}

function RecipeSheetEditingBody({
  ingredientsQuery,
  ingredients,
  draft,
  onChange,
  onRemove,
  onOpenPicker,
}: {
  ingredientsQuery: ReturnType<typeof useIngredients>;
  ingredients: App.Data.Merchant.Inventory.IngredientData[];
  draft: RecipeDraftLine[];
  onChange: (index: number, line: RecipeDraftLine) => void;
  onRemove: (index: number) => void;
  onOpenPicker: (kind: RecipePickerKind, index: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  if (ingredientsQuery.isLoading)
    return (
      <View className="items-center justify-center py-20">
        <Spinner size="sm" label={t("movements.loadingMore")} />
      </View>
    );
  if (ingredientsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(ingredientsQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void ingredientsQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }
  return (
    <RecipeEditor
      draft={draft}
      ingredients={ingredients}
      onChange={onChange}
      onRemove={onRemove}
      onOpenPicker={onOpenPicker}
    />
  );
}

function RecipeSheetBody({
  query,
  recipe,
  isEditing,
  ingredientsQuery,
  ingredients,
  draft,
  recipeError,
  onChange,
  onRemove,
  onOpenPicker,
}: {
  query: ReturnType<typeof useProductRecipe>;
  recipe: ReturnType<typeof useProductRecipe>["data"];
  isEditing: boolean;
  ingredientsQuery: ReturnType<typeof useIngredients>;
  ingredients: App.Data.Merchant.Inventory.IngredientData[];
  draft: RecipeDraftLine[];
  recipeError?: string;
  onChange: (index: number, line: RecipeDraftLine) => void;
  onRemove: (index: number) => void;
  onOpenPicker: (kind: RecipePickerKind, index: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const recipeEmptyColor = useCSSVariable("--color-muted-foreground") as string;

  return (
    <ScrollView
      className="flex-1 bg-surface-secondary"
      contentContainerClassName="gap-4 px-4 pb-24 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {query.isLoading ? (
        <View className="items-center justify-center py-20">
          <Spinner size="sm" label={t("movements.loadingMore")} />
        </View>
      ) : query.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
          <PanelErrorAlert variant="destructive">
            <PanelErrorAlert.Indicator />
            <PanelErrorAlert.Content>
              <PanelErrorAlert.Description>
                {getErrorMessage(query.error)}
              </PanelErrorAlert.Description>
            </PanelErrorAlert.Content>
          </PanelErrorAlert>
          <PanelErrorButton variant="outline" onPress={() => void query.refetch()}>
            {t("common.retry")}
          </PanelErrorButton>
        </View>
      ) : (
        <>
          {recipe ? (
            <View className="flex-row items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3">
              <Typography type="body-sm" muted>
                {t("productForm.recipeEstimatedUnitCogs")}
              </Typography>
              <Typography weight="semibold" className="tabular-nums">
                {formatRupiah(recipe.estimated_unit_cogs)}
              </Typography>
            </View>
          ) : null}
          {isEditing ? (
            <>
              <RecipeSheetEditingBody
                ingredientsQuery={ingredientsQuery}
                ingredients={ingredients}
                draft={draft}
                onChange={onChange}
                onRemove={onRemove}
                onOpenPicker={onOpenPicker}
              />
              {recipeError ? (
                <Typography className="text-destructive">{recipeError}</Typography>
              ) : null}
            </>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ width: 710 }}>
                <PanelMovementTable
                  className="bg-secondary"
                  columns={[220, 150, 150, 190].map((width) => ({ width }))}
                >
                  <PanelMovementTable.Header>
                    <PanelMovementTable.Row>
                      <PanelMovementTable.Head>
                        {t("productForm.recipeIngredient")}
                      </PanelMovementTable.Head>
                      <PanelMovementTable.Head>
                        {t("productForm.recipeQuantity")}
                      </PanelMovementTable.Head>
                      <PanelMovementTable.Head>
                        {t("productForm.recipeUnit")}
                      </PanelMovementTable.Head>
                      <PanelMovementTable.Head>
                        {t("productForm.recipeCostContribution")}
                      </PanelMovementTable.Head>
                    </PanelMovementTable.Row>
                  </PanelMovementTable.Header>
                  {recipe?.ingredients.length ? (
                    <PanelMovementTable.Body>
                      {recipe.ingredients.map((ingredient) => (
                        <PanelMovementTable.Row key={ingredient.ingredient_id}>
                          <PanelMovementTable.Cell>
                            <PanelMovementText weight="semibold" numberOfLines={1}>
                              {ingredient.name}
                            </PanelMovementText>
                          </PanelMovementTable.Cell>
                          <PanelMovementTable.Cell labelClassName="tabular-nums">
                            {formatInventoryQuantity(ingredient.quantity)}
                          </PanelMovementTable.Cell>
                          <PanelMovementTable.Cell>
                            <PanelMovementText numberOfLines={1}>
                              {t(`ingredients.units.${ingredient.unit}` as TranslationKey)}
                            </PanelMovementText>
                          </PanelMovementTable.Cell>
                          <PanelMovementTable.Cell labelClassName="tabular-nums">
                            {ingredient.cost_contribution === null
                              ? "—"
                              : formatRupiah(ingredient.cost_contribution)}
                          </PanelMovementTable.Cell>
                        </PanelMovementTable.Row>
                      ))}
                    </PanelMovementTable.Body>
                  ) : (
                    <PanelMovementTable.Empty>
                      <PanelMovementEmpty className="py-16">
                        <PanelMovementEmpty.Header>
                          <PanelMovementEmpty.Media variant="icon">
                            <AppIcon
                              icon={AppIcons.restaurant}
                              size={22}
                              color={recipeEmptyColor}
                            />
                          </PanelMovementEmpty.Media>
                          <PanelMovementEmpty.Title>
                            {t("productForm.recipeEmpty")}
                          </PanelMovementEmpty.Title>
                          <PanelMovementEmpty.Description>
                            {t("productForm.recipeEmptyDescription")}
                          </PanelMovementEmpty.Description>
                        </PanelMovementEmpty.Header>
                      </PanelMovementEmpty>
                    </PanelMovementTable.Empty>
                  )}
                </PanelMovementTable>
              </View>
            </ScrollView>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ProductRecipeSheet({
  productId,
  productName,
  sheetRef,
  query,
  recipe,
}: {
  productId: string;
  productName: string;
  sheetRef: React.RefObject<TrueSheet | null>;
  query: ReturnType<typeof useProductRecipe>;
  recipe: ReturnType<typeof useProductRecipe>["data"];
}): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    ingredients,
    ingredientsQuery,
    recipeError,
    isEditing,
    draft,
    recipeMutation,
    beginEditing,
    cancelEditing,
    addLine,
    saveRecipe,
    setDraft,
    resetEditor,
  } = useProductRecipeEditor(productId, recipe, t, toast);
  const pickerRef = React.useRef<TrueSheet>(null);
  const [activePicker, setActivePicker] = React.useState<
    { kind: RecipePickerKind; index: number } | undefined
  >();

  const openPicker = (kind: RecipePickerKind, index: number) => {
    setActivePicker({ kind, index });
  };

  React.useEffect(() => {
    if (activePicker) void pickerRef.current?.present();
  }, [activePicker]);

  const pickerLine = activePicker ? draft[activePicker.index] : undefined;
  const pickerIngredient = pickerLine
    ? ingredients.find((ingredient) => ingredient.id === pickerLine.ingredient_id)
    : undefined;
  const pickerOptions: RecipePickerOption[] =
    activePicker?.kind === "unit"
      ? pickerIngredient
        ? getCompatibleUnits(pickerIngredient.base_unit).map((unit) => ({
            value: unit,
            label: t(`ingredients.units.${unit}` as TranslationKey),
          }))
        : []
      : ingredients.map((ingredient) => ({ value: ingredient.id, label: ingredient.name }));

  const handlePickerSelect = (value: string) => {
    if (!activePicker) return;

    if (activePicker.kind === "ingredient") {
      const nextIngredient = ingredients.find((ingredient) => ingredient.id === value);
      if (!nextIngredient) return;
      setDraft((current) =>
        current.map((line, index) =>
          index === activePicker.index
            ? { ...line, ingredient_id: nextIngredient.id, unit: nextIngredient.base_unit }
            : line
        )
      );
      return;
    }

    setDraft((current) =>
      current.map((line, index) =>
        index === activePicker.index ? { ...line, unit: value as InventoryUnit } : line
      )
    );
  };

  return (
    <>
      <TrueSheet
        ref={sheetRef}
        detents={[0.65, 1]}
        scrollable
        grabber
        cornerRadius={24}
        maxContentWidth={900}
        onDidDismiss={() => {
          resetEditor();
          setActivePicker(undefined);
        }}
        header={
          <SheetHeader
            title={t("productForm.recipe")}
            description={`${productName} · ${t("productForm.recipeDescription")}`}
            onClose={() => void sheetRef.current?.dismiss()}
          />
        }
        footer={
          isEditing ? (
            <RecipeEditingFooter
              isLoadingIngredients={ingredientsQuery.isLoading}
              hasIngredientError={ingredientsQuery.isError}
              isSaving={recipeMutation.isPending}
              onAddLine={addLine}
              onCancel={cancelEditing}
              onSave={() => void saveRecipe()}
            />
          ) : (
            <RecipeReadFooter onEdit={beginEditing} />
          )
        }
      >
        <RecipeSheetBody
          query={query}
          recipe={recipe}
          isEditing={isEditing}
          ingredientsQuery={ingredientsQuery}
          ingredients={ingredients}
          draft={draft}
          recipeError={recipeError}
          onOpenPicker={openPicker}
          onChange={(index, line) =>
            setDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? line : item))
            )
          }
          onRemove={(index) =>
            setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))
          }
        />
      </TrueSheet>
      <RecipePickerSheet
        sheetRef={pickerRef}
        title={
          activePicker?.kind === "unit"
            ? t("productForm.recipeUnit")
            : t("productForm.recipeIngredient")
        }
        description={t("productForm.recipeDescription")}
        options={pickerOptions}
        selectedValue={activePicker?.kind === "unit" ? pickerLine?.unit : pickerLine?.ingredient_id}
        onSelect={handlePickerSelect}
        onDidDismiss={() => setActivePicker(undefined)}
      />
    </>
  );
}

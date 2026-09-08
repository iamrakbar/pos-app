import AppIcon from "@/components/common/app-icon";
import InventoryMovementsTable from "@/components/common/inventory-movements-table";
import ErrorState from "@/components/common/error-state";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { useIngredients } from "@/hooks/db/use-ingredients";
import { useProductRecipe, useUpdateProductRecipe } from "@/hooks/db/use-products";
import { FormNumberField } from "@/components/common/form-number-field";
import { QUANTITY_FORMAT_OPTIONS } from "@/screens/inventory/ingredient-stock-overlay-utils";
import {
  getCompatibleUnits,
  toRecipeDraft,
  validateRecipeDraft,
  type InventoryUnit,
  type RecipeDraftLine,
} from "@/schemas/product-recipe";
import { useTranslation } from "@/stores/use-locale";
import { formatInventoryQuantity, formatRupiah } from "@/utils/format";
import type { TranslationKey } from "@/locales";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, Label, Spinner, Typography, useThemeColor, useToast } from "heroui-native";
import { EmptyState, Table } from "heroui-native-pro";
import React from "react";
import { FlatList, ScrollView, View } from "react-native";

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
                <Table.Cell textProps={{ numberOfLines: 1 }}>
                  {t(`ingredients.units.${ingredient.unit}` as TranslationKey)}
                </Table.Cell>
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
  const [themeColorDanger] = useThemeColor(["danger"]);
  const ingredientOptions = ingredients.map((ingredient) => ({
    value: ingredient.id,
    label: ingredient.name,
  }));

  return (
    <View className="gap-3">
      {draft.map((line, index) => {
        const ingredient = ingredients.find((item) => item.id === line.ingredient_id);
        const unitOptions = ingredient
          ? getCompatibleUnits(ingredient.base_unit).map((unit) => ({
              value: unit,
              label: t(`ingredients.units.${unit}` as TranslationKey),
            }))
          : [];

        return (
          <View key={line.id} className="gap-3 rounded-panel-inner bg-surface px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <Typography type="body-sm" weight="semibold">
                {t("productForm.recipeIngredient")} {index + 1}
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                accessibilityLabel={t("productForm.recipeRemoveIngredientAccessibility")}
                onPress={() => onRemove(index)}
              >
                <AppIcon name="trash-outline" size={17} color={themeColorDanger} />
              </Button>
            </View>
            <View className="gap-1.5">
              <Label isRequired>{t("productForm.recipeIngredient")}</Label>
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
              <FormNumberField
                className="flex-1"
                label={t("productForm.recipeQuantity")}
                value={line.quantity}
                onChange={(quantity) => onChange(index, { ...line, quantity })}
                minValue={0}
                showStepper
                inputVariant="secondary"
                formatOptions={QUANTITY_FORMAT_OPTIONS}
                isRequired
              />
              <View className="min-w-0 flex-1 gap-1.5">
                <Label isRequired>{t("productForm.recipeUnit")}</Label>
                <RecipePickerTrigger
                  label={t("productForm.recipeUnit")}
                  value={unitOptions.find((option) => option.value === line.unit)?.label}
                  onPress={() => onOpenPicker("unit", index)}
                  isDisabled={!ingredient}
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
  isDisabled = false,
  children,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  isDisabled?: boolean;
  children: string;
}): React.JSX.Element {
  const [themeColorMuted] = useThemeColor(["muted"]);

  return (
    <Button
      variant="outline"
      className="min-w-0 justify-between"
      onPress={onPress}
      isDisabled={isDisabled}
      accessibilityLabel={label}
    >
      <Button.Label numberOfLines={1} className={value ? undefined : "text-muted"}>
        {value ?? children}
      </Button.Label>
      <AppIcon name="chevron-down-outline" size={17} color={themeColorMuted} />
    </Button>
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
  const [themeColorAccent] = useThemeColor(["accent"]);

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
            <Button
              variant={isSelected ? "secondary" : "ghost"}
              className="min-w-0 justify-between"
              onPress={() => {
                onSelect(option.value);
                void sheetRef.current?.dismiss();
              }}
            >
              <Button.Label numberOfLines={1}>{option.label}</Button.Label>
              {isSelected ? (
                <AppIcon name="checkmark-outline" size={18} color={themeColorAccent} />
              ) : null}
            </Button>
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
      toast.show({ variant: "danger", label: t("productForm.recipeSaveFailed") });
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
        <Button
          size="sm"
          variant="outline"
          onPress={onAddLine}
          isDisabled={isDisabled}
          className="min-w-0 flex-1"
        >
          <Button.Label numberOfLines={1}>{t("productForm.recipeAddIngredient")}</Button.Label>
        </Button>
        <Button size="sm" variant="ghost" onPress={onCancel} isDisabled={isSaving}>
          <Button.Label>{t("productForm.recipeCancel")}</Button.Label>
        </Button>
        <Button size="sm" onPress={onSave} isDisabled={isDisabled}>
          <Button.Label>{isSaving ? t("common.saving") : t("productForm.recipeSave")}</Button.Label>
        </Button>
      </View>
    </View>
  );
}

function RecipeReadFooter({ onEdit }: { onEdit: () => void }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View className="border-t border-separator bg-surface px-4 pb-safe pt-3">
      <Button size="sm" variant="outline" onPress={onEdit}>
        <Button.Label>{t("productForm.recipeEdit")}</Button.Label>
      </Button>
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
  if (ingredientsQuery.isLoading) return <SheetLoading />;
  if (ingredientsQuery.isError) {
    return <ErrorState error={ingredientsQuery.error} onRetry={ingredientsQuery.refetch} />;
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

  return (
    <ScrollView
      className="flex-1 bg-surface-secondary"
      contentContainerClassName="gap-4 px-4 pb-24 pt-4"
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
              {recipeError ? <Typography className="text-danger">{recipeError}</Typography> : null}
            </>
          ) : (
            <RecipeTable ingredients={recipe?.ingredients ?? []} />
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

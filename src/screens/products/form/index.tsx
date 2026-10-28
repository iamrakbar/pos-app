import {
  Typography,
  Separator,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Button as PanelButton,
  Label as PanelLabel,
  Dialog as PanelDialog,
  Input as PanelInput,
  Select as PanelSelect,
  Textarea as PanelTextarea,
  Typography as PanelTypography,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Card,
  Switch as PanelSwitch,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  Controller,
  useController,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { Image } from "expo-image";
import { Platform, Pressable, View } from "react-native";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { getErrorMessage } from "@/api/api-error";
import type { ProductImageAsset } from "@/api/endpoints/products";
import { useCategories } from "@/hooks/db/use-categories";
import {
  useDiscounts,
  useSetProductDiscount,
  type DiscountListItem,
} from "@/hooks/db/use-discounts";
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useProductInventory,
  useUpdateProduct,
  useUpdateProductInventory,
} from "@/hooks/db/use-products";
import { useInventoryMovements } from "@/hooks/db/use-inventory-audit";
import { createProductSchema, type ProductFormValues } from "@/schemas/product";
import {
  getProductInventoryCapabilities,
  toProductInventoryPayload,
} from "@/schemas/product-inventory";
import { PRODUCT_INVENTORY_MODES, type ProductInventory } from "@/types/product-inventory";
import ProductAddOnsCard from "./product-add-ons-card";
import NewProductAddOnsCard from "./new-product-add-ons-card";
import ProductRelationshipSheets from "./product-relationship-sheets";
import { ProductAdjustStockOverlay, ProductOpeningBalanceOverlay } from "./product-stock-overlays";
import QuickCategoryFormOverlay from "./quick-category-form-overlay";
import QuickDiscountFormOverlay from "./quick-discount-form-overlay";
import { saveProduct, toProductPayload } from "./product-form-save";
import { applyProductServerErrors } from "./product-form-errors";
import {
  formatInventoryQuantity,
  formatRupiah,
  IDR_NUMBER_FIELD_FORMAT_OPTIONS,
  RUPIAH_PREFIX,
} from "@/utils/format";
import { useTranslation } from "@/stores/use-locale";
import { useAuth } from "@/stores/use-auth";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";
import { hasMerchantFeature } from "@/utils/merchant-features";
import type { Translate, TranslationKey } from "@/locales";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const PRODUCT_IMAGE_MAX_EDGE = 1600;
const PRODUCT_IMAGE_QUALITY = 0.82;
const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
async function optimizeProductImage(
  asset: ImagePicker.ImagePickerAsset,
  t: Translate
): Promise<ProductImageAsset> {
  const context = ImageManipulator.manipulate(asset.uri);
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_EDGE / Math.max(asset.width, asset.height));

  if (scale < 1) {
    context.resize({
      width: Math.round(asset.width * scale),
      height: Math.round(asset.height * scale),
    });
  }

  const renderedImage = await context.renderAsync();
  const optimizedImage = await renderedImage.saveAsync({
    compress: PRODUCT_IMAGE_QUALITY,
    format: SaveFormat.JPEG,
  });
  let size: number;
  if (Platform.OS === "web") {
    const response = await fetch(optimizedImage.uri);
    if (!response.ok) {
      throw new Error(t("productForm.imageReadFailed", { status: response.status }));
    }
    size = (await response.blob()).size;
  } else {
    size = new File(optimizedImage.uri).size ?? 0;
  }

  if (size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error(t("productForm.imageTooLarge"));
  }

  return {
    uri: optimizedImage.uri,
    name: `product-${Date.now()}.jpg`,
    type: "image/jpeg",
  };
}

async function selectProductImage({
  t,
  toast,
  setValue,
}: {
  t: Translate;
  toast: ReturnType<typeof useToast>["toast"];
  setValue: UseFormSetValue<ProductFormValues>;
}): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    toast.show({
      variant: "warning",
      label: t("productForm.photoPermission"),
      description: t("productForm.photoPermissionDescription"),
    });
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled) return;

  try {
    setValue("image", await optimizeProductImage(result.assets[0], t), {
      shouldDirty: true,
      shouldValidate: true,
    });
  } catch (error: unknown) {
    toast.show({
      variant: "destructive",
      label: t("productForm.imagePreparationFailed"),
      description: getErrorMessage(error),
    });
  }
}

async function removeProduct({
  deleteMutation,
  setIsDeleteOpen,
  toast,
  t,
  router,
}: {
  deleteMutation: ReturnType<typeof useDeleteProduct>;
  setIsDeleteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toast: ReturnType<typeof useToast>["toast"];
  t: Translate;
  router: ReturnType<typeof useRouter>;
}): Promise<void> {
  try {
    await deleteMutation.mutateAsync();
    setIsDeleteOpen(false);
    toast.show({ variant: "success", label: t("productForm.deleted") });
    router.back();
  } catch (error: unknown) {
    toast.show({
      variant: "destructive",
      label: t("productForm.deleteFailed"),
      description: getErrorMessage(error),
    });
  }
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header className="pb-2 p-0">
      <View className="gap-1">
        <Card.Title>{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </View>
    </Card.Header>
  );
}

function ToggleRow({
  title,
  description,
  isSelected,
  onSelectedChange,
}: {
  title: string;
  description: string;
  isSelected: boolean;
  onSelectedChange: (isSelected: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-4 py-1">
      <View className="flex-1 gap-0.5">
        <Typography type="body-sm" weight="semibold">
          {title}
        </Typography>
        <Typography type="body-xs" muted>
          {description}
        </Typography>
      </View>
      <PanelSwitch value={isSelected} onValueChange={onSelectedChange} label={title} />
    </View>
  );
}

function ProductImageCard({
  imageUri,
  accentColor,
  onSelect,
}: {
  imageUri: string | null | undefined;
  accentColor: string;
  onSelect: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 overflow-hidden p-4">
      <SectionHeading
        title={t("productForm.imageTitle")}
        description={t("productForm.imageDescription")}
      />
      <Card.Content className="items-center pt-2 p-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("productForm.chooseImageAccessibility")}
          onPress={onSelect}
          className="aspect-video w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-surface-secondary active:opacity-80"
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
            />
          ) : (
            <>
              <View className="size-14 items-center justify-center rounded-full bg-accent">
                <AppIcon icon={AppIcons.image} size={26} color={accentColor} />
              </View>
              <View className="items-center gap-1 px-6">
                <Typography type="body-sm" weight="semibold">
                  {t("productForm.addImage")}
                </Typography>
                <Typography type="body-xs" muted align="center">
                  {t("productForm.imageRequirements")}
                </Typography>
              </View>
            </>
          )}
        </Pressable>
      </Card.Content>
      <Card.Footer className="pt-0 p-0">
        <Typography type="body-xs" muted>
          {t("productForm.imageAvailability")}
        </Typography>
      </Card.Footer>
    </Card>
  );
}

function ProductDetailsCard({
  control,
  errors,
  categoryOptions,
  areCategoriesLoading,
  didCategoriesFail,
  onRetryCategories,
  onAddCategory,
}: {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  categoryOptions: { value: string; label: string }[];
  areCategoriesLoading: boolean;
  didCategoriesFail: boolean;
  onRetryCategories: () => void;
  onAddCategory: () => void;
}) {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const [themeColorForeground] = useCSSVariable(["--color-foreground"]) as [string];

  return (
    <Card className="gap-3 overflow-hidden p-4">
      <SectionHeading
        title={t("productForm.detailsTitle")}
        description={t("productForm.detailsDescription")}
      />
      <Card.Content className="gap-4 p-0">
        <Controller
          control={control}
          name="category_id"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <PanelLabel isRequired isInvalid={Boolean(errors.category_id)}>
                {t("productForm.category")}
              </PanelLabel>
              <View className="flex-row items-center gap-2">
                <PanelSelect
                  presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
                  value={value}
                  onValueChange={onChange}
                  disabled={areCategoriesLoading || didCategoriesFail}
                  className="flex-1"
                  triggerClassName={errors.category_id ? "border-destructive" : undefined}
                  placeholder={t("productForm.selectCategory")}
                  title={t("productForm.category")}
                >
                  {categoryOptions.map((option) => (
                    <PanelSelect.Item key={option.value} {...option} />
                  ))}
                </PanelSelect>
                <PanelButton
                  variant="ghost"
                  size="icon"

                  accessibilityLabel={t("productForm.addCategoryAccessibility")}
                  onPress={onAddCategory}
                >
                  <AppIcon icon={AppIcons.add} size={18} color={themeColorForeground} />
                </PanelButton>
              </View>
              {didCategoriesFail ? (
                <View className="flex-row items-center justify-between gap-3">
                  <PanelTypography type="body-xs" className="flex-1 text-destructive">
                    {t("productForm.categoriesFailed")}
                  </PanelTypography>
                  <PanelButton size="sm" variant="ghost" onPress={onRetryCategories}>
                    {t("common.retry")}
                  </PanelButton>
                </View>
              ) : errors.category_id?.message ? (
                <PanelTypography type="body-xs" className="text-destructive">
                  {errors.category_id.message}
                </PanelTypography>
              ) : areCategoriesLoading ? (
                <PanelTypography type="body-xs" muted>
                  {t("categories.loading")}
                </PanelTypography>
              ) : categoryOptions.length === 0 ? (
                <PanelTypography type="body-xs" className="text-warning">
                  {t("productForm.noCategories")}
                </PanelTypography>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("productForm.name")}
              placeholder={t("productForm.namePlaceholder")}
              variant="filled"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.name?.message}
              isRequired
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelTextarea
              ref={ref}
              label={t("productForm.description")}
              placeholder={t("productForm.descriptionPlaceholder")}
              variant="filled"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.description?.message}
              rows={3}
              description={t("productForm.descriptionHelp")}
            />
          )}
        />
      </Card.Content>
    </Card>
  );
}

function ProductInventoryFields({
  control,
  errors,
  inventory,
  isNew,
  inventoryEnabled,
  inventoryRecipeEnabled,
}: {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  inventory: ProductInventory | undefined;
  isNew: boolean;
  inventoryEnabled: boolean;
  inventoryRecipeEnabled: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const inventoryMode = useWatch({ control, name: "inventory_mode" });
  const {
    field: { value: costValue, onChange: costChange, onBlur: costBlur, ref: costRef },
  } = useController({ control, name: "inventory_cost" });
  const { localizedInputProps: costInput } = useLocalizedNumberInput({
    value: costValue,
    onChange: costChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: costBlur },
  });
  const {
    field: { value: alertValue, onChange: changeAlert, onBlur: blurAlert, ref: alertRef },
  } = useController({ control, name: "stock_alert" });
  const { localizedInputProps: alertInput } = useLocalizedNumberInput({
    value: alertValue,
    onChange: changeAlert,
    formatOptions: { useGrouping: false, maximumFractionDigits: 0 },
    minValue: 0,
    inputProps: { onBlur: blurAlert },
  });
  if (!inventoryEnabled) return <></>;
  const capabilities = getProductInventoryCapabilities(inventoryMode, isNew);
  const hideRecipeStock = inventoryMode === "recipe" && !inventoryRecipeEnabled;
  const modeOptions = PRODUCT_INVENTORY_MODES.filter(
    (mode) => mode !== "recipe" || inventoryRecipeEnabled || inventoryMode === "recipe"
  ).map((mode) => ({
    value: mode,
    label: t(`productForm.inventoryModes.${mode}` as TranslationKey),
  }));

  return (
    <>
      <Controller
        control={control}
        name="inventory_mode"
        render={({ field: { value, onChange } }) => (
          <View className="gap-1.5">
            <PanelLabel isRequired isInvalid={Boolean(errors.inventory_mode)}>
              {t("productForm.inventoryMode")}
            </PanelLabel>
            <PanelSelect
              presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
              value={value}
              onValueChange={(next) => {
                if (next === "recipe" && !inventoryRecipeEnabled && inventoryMode !== "recipe")
                  return;
                onChange(next);
              }}
              triggerClassName={errors.inventory_mode ? "border-destructive" : undefined}
              placeholder={t("productForm.inventoryModePlaceholder")}
              title={t("productForm.inventoryMode")}
            >
              {modeOptions.map((option) => (
                <PanelSelect.Item key={option.value} {...option} />
              ))}
            </PanelSelect>
            <PanelTypography type="body-xs" muted>
              {t(`productForm.inventoryModeDescriptions.${inventoryMode}` as TranslationKey)}
            </PanelTypography>
          </View>
        )}
      />
      {capabilities.showInventoryCost ? (
        <View className="flex-row flex-wrap gap-3">
          <PanelInput
            ref={costRef}
            containerClassName="flex-1"
            label={t("productForm.inventoryCost")}
            placeholder={t("productForm.inventoryCostPlaceholder")}
            description={t("productForm.inventoryCostDescription")}
            errorMessage={errors.inventory_cost?.message}
            variant="filled"
            keyboardType="numeric"
            startContent={
              <PanelTypography type="body-sm" weight="medium" muted>
                {RUPIAH_PREFIX}
              </PanelTypography>
            }
            interactiveContent={false}
            {...costInput}
          />
          {capabilities.showStockAlert ? (
            <View className="flex-1 gap-2">
              <View className="flex-row items-end gap-2">
                <PanelButton
                  variant="outline"
                  size="icon"
                  disabled={Number(alertValue || 0) <= 0}
                  accessibilityLabel={t("productForm.decreaseAccessibility", {
                    field: t("productForm.lowStockAlert"),
                  })}
                  onPress={() => changeAlert(String(Math.max(0, Number(alertValue || 0) - 1)))}
                >
                  -
                </PanelButton>
                <PanelInput
                  className="flex-1"
                  label={t("productForm.lowStockAlert")}
                  keyboardType="number-pad"
                  {...alertInput}
                  errorMessage={errors.stock_alert?.message}
                  ref={alertRef}
                />
                <PanelButton
                  variant="outline"
                  size="icon"
                  accessibilityLabel={t("productForm.increaseAccessibility", {
                    field: t("productForm.lowStockAlert"),
                  })}
                  onPress={() => changeAlert(String(Number(alertValue || 0) + 1))}
                >
                  +
                </PanelButton>
              </View>
              {!errors.stock_alert?.message ? (
                <PanelTypography type="body-xs" muted>
                  {t("productForm.lowStockDescription")}
                </PanelTypography>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
      {capabilities.showCurrentStock && !hideRecipeStock && inventory ? (
        <View className="rounded-xl bg-surface-secondary px-4 py-3">
          <Typography type="body-xs" muted>
            {t("productForm.currentStock")}
          </Typography>
          <Typography type="body-sm" weight="semibold" className="tabular-nums">
            {formatInventoryQuantity(inventory.stock)}
          </Typography>
        </View>
      ) : null}
      {capabilities.showRecipe && inventoryRecipeEnabled && inventory ? (
        <View className="rounded-xl bg-surface-secondary px-4 py-3">
          <Typography type="body-xs" muted>
            {t("productForm.recipeEstimatedUnitCogs")}
          </Typography>
          <Typography type="body-sm" weight="semibold" className="tabular-nums">
            {formatRupiah(inventory.estimated_unit_cogs)}
          </Typography>
        </View>
      ) : null}
    </>
  );
}

function ProductInventoryActions({
  control,
  isNew,
  inventoryRecipeEnabled,
  canShowOpeningBalance,
  onShowMovements,
  onShowRecipe,
  onShowOpeningBalance,
  onShowAdjustment,
}: {
  control: Control<ProductFormValues>;
  isNew: boolean;
  inventoryRecipeEnabled: boolean;
  canShowOpeningBalance: boolean;
  onShowMovements?: () => void;
  onShowRecipe?: () => void;
  onShowOpeningBalance?: () => void;
  onShowAdjustment?: () => void;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const [themeColorForeground] = useCSSVariable(["--color-foreground"]) as [string];
  const inventoryMode = useWatch({ control, name: "inventory_mode" });
  const actions = getProductInventoryActions({
    inventoryMode,
    isNew,
    inventoryRecipeEnabled,
    canShowOpeningBalance,
    onShowMovements,
    onShowRecipe,
    onShowOpeningBalance,
    onShowAdjustment,
    t,
  });

  if (actions.length === 0) return null;

  return (
    <Card.Footer className="flex-row flex-wrap gap-2 pt-0 p-0">
      {actions.map((action) => (
        <PanelButton
          key={action.key}
          size="sm"
          variant="outline"
          className="min-w-0 flex-1 px-1"
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
        >
          <AppIcon icon={action.icon} size={16} color={themeColorForeground} />
          <PanelTypography type="body-xs" numberOfLines={1}>
            {action.label}
          </PanelTypography>
        </PanelButton>
      ))}
    </Card.Footer>
  );
}

type ProductInventoryAction = {
  key: string;
  icon: React.ComponentProps<typeof AppIcon>["icon"];
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function getProductInventoryActions({
  inventoryMode,
  isNew,
  inventoryRecipeEnabled,
  canShowOpeningBalance,
  onShowMovements,
  onShowRecipe,
  onShowOpeningBalance,
  onShowAdjustment,
  t,
}: {
  inventoryMode: ProductFormValues["inventory_mode"];
  isNew: boolean;
  inventoryRecipeEnabled: boolean;
  canShowOpeningBalance: boolean;
  onShowMovements?: () => void;
  onShowRecipe?: () => void;
  onShowOpeningBalance?: () => void;
  onShowAdjustment?: () => void;
  t: Translate;
}): ProductInventoryAction[] {
  if (isNew) return [];

  const capabilities = getProductInventoryCapabilities(inventoryMode, isNew);
  const actions: ProductInventoryAction[] = [];
  if (capabilities.showOpeningBalance && canShowOpeningBalance && onShowOpeningBalance) {
    actions.push({
      key: "opening-balance",
      icon: AppIcons.addCircle,
      label: t("productForm.openingBalance"),
      accessibilityLabel: t("productForm.showOpeningBalanceAccessibility"),
      onPress: onShowOpeningBalance,
    });
  }
  if (capabilities.showAdjustment && onShowAdjustment) {
    actions.push({
      key: "adjust-stock",
      icon: AppIcons.options,
      label: t("productForm.adjustStock"),
      accessibilityLabel: t("productForm.showAdjustStockAccessibility"),
      onPress: onShowAdjustment,
    });
  }
  if (
    capabilities.showMovements &&
    onShowMovements &&
    (inventoryRecipeEnabled || inventoryMode !== "recipe")
  ) {
    actions.push({
      key: "movements",
      icon: AppIcons.swapVertical,
      label: t("productForm.inventoryMovements"),
      accessibilityLabel: t("productForm.showInventoryMovementsAccessibility"),
      onPress: onShowMovements,
    });
  }
  if (capabilities.showRecipe && onShowRecipe) {
    actions.push({
      key: "recipe",
      icon: AppIcons.restaurant,
      label: t("productForm.recipe"),
      accessibilityLabel: t("productForm.showRecipeAccessibility"),
      onPress: onShowRecipe,
    });
  }
  return actions;
}

function InventoryCard({
  control,
  errors,
  inventory,
  isNew,
  inventoryEnabled,
  inventoryRecipeEnabled,
  canShowOpeningBalance,
  onShowMovements,
  onShowRecipe,
  onShowOpeningBalance,
  onShowAdjustment,
}: {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  inventory: ProductInventory | undefined;
  isNew: boolean;
  inventoryEnabled: boolean;
  inventoryRecipeEnabled: boolean;
  canShowOpeningBalance: boolean;
  onShowMovements?: () => void;
  onShowRecipe?: () => void;
  onShowOpeningBalance?: () => void;
  onShowAdjustment?: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 overflow-hidden p-4">
      <SectionHeading
        title={t("productForm.inventoryTitle")}
        description={t("productForm.inventoryDescription")}
      />
      <Card.Content className="gap-4 p-0">
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("productForm.code")}
              placeholder={t("productForm.codePlaceholder")}
              variant="filled"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.code?.message}
              autoCapitalize="characters"
              description={t("productForm.codeHelp")}
            />
          )}
        />
        <Separator />
        <ProductInventoryFields
          control={control}
          errors={errors}
          inventory={inventory}
          isNew={isNew}
          inventoryEnabled={inventoryEnabled}
          inventoryRecipeEnabled={inventoryRecipeEnabled}
        />
      </Card.Content>
      {inventoryEnabled ? (
        <ProductInventoryActions
          control={control}
          isNew={isNew}
          inventoryRecipeEnabled={inventoryRecipeEnabled}
          canShowOpeningBalance={canShowOpeningBalance}
          onShowMovements={onShowMovements}
          onShowRecipe={inventoryRecipeEnabled ? onShowRecipe : undefined}
          onShowOpeningBalance={onShowOpeningBalance}
          onShowAdjustment={onShowAdjustment}
        />
      ) : null}
    </Card>
  );
}

function PricingCard({
  control,
  error,
  productId,
  discount,
  onAddDiscount,
}: {
  control: Control<ProductFormValues>;
  error?: string;
  productId?: string;
  discount?: App.Data.Merchant.Product.ProductDiscountData | null;
  onAddDiscount?: () => void;
}) {
  const { t } = useTranslation();
  const {
    field: { value: price, onChange: priceChange, onBlur: priceBlur, ref: priceRef },
  } = useController({ control, name: "price" });
  const { localizedInputProps: priceInput } = useLocalizedNumberInput({
    value: price,
    onChange: priceChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: priceBlur },
  });
  const numericPrice = Number(price);
  const discountedPrice =
    discount && Number.isFinite(numericPrice)
      ? Math.max(
          0,
          discount.unit === "percentage"
            ? numericPrice * (1 - discount.value / 100)
            : numericPrice - discount.value
        )
      : null;

  return (
    <Card className="gap-3 overflow-hidden p-4">
      <SectionHeading
        title={t("productForm.pricingTitle")}
        description={t("productForm.pricingDescription")}
      />
      <Card.Content className="gap-4 p-0">
        <View className="flex-row flex-wrap gap-3">
          <PanelInput
            ref={priceRef}
            containerClassName="flex-1"
            label={t("productForm.price")}
            placeholder="0"
            errorMessage={error}
            variant="filled"
            isRequired
            keyboardType="numeric"
            startContent={
              <PanelTypography type="body-sm" weight="medium" muted>
                {RUPIAH_PREFIX}
              </PanelTypography>
            }
            interactiveContent={false}
            {...priceInput}
          />
          {discountedPrice !== null ? (
            <View className="flex-1 gap-1">
              <PanelLabel>{t("productForm.discountPrice")}</PanelLabel>
              <Typography type="body-sm" weight="medium">
                {formatRupiah(discountedPrice)}
              </Typography>
            </View>
          ) : null}
        </View>
        {productId && onAddDiscount ? (
          <>
            <Separator />
            <ProductDiscountField productId={productId} onAdd={onAddDiscount} />
          </>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function formatDiscountOptionLabel(discount: DiscountListItem, t: Translate): string {
  const value =
    discount.unit === "percentage" ? `${discount.value}%` : formatRupiah(discount.value);
  const name = discount.name.trim().endsWith(value)
    ? discount.name.trim()
    : `${discount.name.trim()} ${value}`;
  return `${name} ${t("discounts.productCountSuffix", { count: discount.products_count })}`;
}

type ProductDiscountOption = {
  value: string;
  label: string;
  description: string;
  discount: DiscountListItem;
};

function getProductDiscountOptions(
  discounts: DiscountListItem[],
  currentDiscount: DiscountListItem | undefined,
  t: Translate
): ProductDiscountOption[] {
  const options: ProductDiscountOption[] = [];
  for (const discount of discounts) {
    if (!discount.active && discount.id !== currentDiscount?.id) continue;
    options.push({
      value: discount.id,
      label: formatDiscountOptionLabel(discount, t),
      description: discount.active ? t("common.active") : t("common.inactive"),
      discount,
    });
  }
  return options;
}

function ProductDiscountField({ productId, onAdd }: { productId: string; onAdd: () => void }) {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const { toast } = useToast();
  const [themeColorForeground, themeColorMuted] = useCSSVariable([
    "--color-foreground",
    "--color-muted-foreground",
  ]) as [string, string];
  const discountsQuery = useDiscounts();
  const setProductDiscount = useSetProductDiscount(productId);
  const discounts = discountsQuery.data ?? [];
  const discountByProductId = new Map<string, DiscountListItem>();
  for (const discount of discounts) {
    for (const assignedProductId of Object.values(discount.product_ids ?? {})) {
      discountByProductId.set(assignedProductId, discount);
    }
  }
  const currentDiscount = discountByProductId.get(productId);
  const discountOptions = getProductDiscountOptions(discounts, currentDiscount, t);
  const selectedOption = discountOptions.find(
    (option) => option.discount.id === currentDiscount?.id
  );

  const handleChange = async (value?: string) => {
    const nextDiscount = discounts.find((discount) => discount.id === value) ?? null;
    if (!nextDiscount || nextDiscount.id === currentDiscount?.id) return;

    try {
      await setProductDiscount.mutateAsync({
        current: currentDiscount ?? null,
        next: nextDiscount,
      });
      toast.show({ variant: "success", label: t("productForm.discountUpdated") });
    } catch {
      toast.show({
        variant: "destructive",
        label: t("productForm.discountUpdateFailed"),
        description: t("productForm.discountUpdateFailedDescription"),
      });
    }
  };

  const handleRemove = async () => {
    if (!currentDiscount) return;

    try {
      await setProductDiscount.mutateAsync({ current: currentDiscount, next: null });
      toast.show({ variant: "success", label: t("productForm.discountRemoved") });
    } catch {
      toast.show({
        variant: "destructive",
        label: t("productForm.discountUpdateFailed"),
        description: t("productForm.discountUpdateFailedDescription"),
      });
    }
  };

  return (
    <View className="gap-1.5">
      <PanelLabel>{t("productForm.discountOptional")}</PanelLabel>
      <View className="flex-row items-center gap-2">
        <PanelSelect
          presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
          value={selectedOption?.value}
          valueLabel={selectedOption?.label}
          placeholder={t("productForm.selectDiscount")}
          title={t("productForm.discountOptional")}
          onValueChange={(value) => void handleChange(value)}
          disabled={
            discountsQuery.isLoading ||
            discountsQuery.isError ||
            discountOptions.length === 0 ||
            setProductDiscount.isPending
          }
          className="flex-1"
        >
          {discountOptions.map((option) => (
            <PanelSelect.Item
              key={option.value}
              value={option.value}
              label={`${option.label} · ${option.description}`}
            />
          ))}
        </PanelSelect>
        <PanelButton
          variant="ghost"
          size="icon"

          accessibilityLabel={t("productForm.addDiscountAccessibility")}
          onPress={onAdd}
          disabled={setProductDiscount.isPending}
        >
          <AppIcon icon={AppIcons.add} size={18} color={themeColorForeground} />
        </PanelButton>
        {currentDiscount ? (
          <PanelButton
            variant="ghost"
            size="icon"

            accessibilityLabel={t("productForm.removeDiscountAccessibility")}
            onPress={() => void handleRemove()}
            disabled={setProductDiscount.isPending}
          >
            <AppIcon icon={AppIcons.close} size={18} color={themeColorMuted} />
          </PanelButton>
        ) : null}
      </View>
      {discountsQuery.isLoading ? (
        <PanelTypography type="body-xs" muted>
          {t("productForm.discountLoading")}
        </PanelTypography>
      ) : discountsQuery.isError ? (
        <PanelTypography type="body-xs" className="text-destructive">
          {t("productForm.discountUnavailable")}
        </PanelTypography>
      ) : (
        <PanelTypography type="body-xs" muted>
          {t("productForm.discountHelp")}
        </PanelTypography>
      )}
    </View>
  );
}

function AvailabilityCard({ control }: { control: Control<ProductFormValues> }) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 overflow-hidden p-4">
      <SectionHeading title={t("productForm.availabilityTitle")} />
      <Card.Content className="gap-4 p-0">
        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              title={t("common.active")}
              description={t("productForm.activeDescription")}
              isSelected={value}
              onSelectedChange={onChange}
            />
          )}
        />
      </Card.Content>
    </Card>
  );
}

function SaveProductCard({
  isNew,
  isCompact,
  isSaving,
  serverError,
  onCancel,
  onSubmit,
}: {
  isNew: boolean;
  isCompact: boolean;
  isSaving: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: React.ComponentProps<typeof PanelButton>["onPress"];
}) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 gap-3 pt-2">
      {serverError ? (
        <Typography type="body-xs" className="text-destructive">
          {serverError}
        </Typography>
      ) : null}
      <View className="flex-row gap-3">
        <PanelButton variant="ghost" onPress={onCancel} disabled={isSaving}>
          {t("common.cancel")}
        </PanelButton>
        <PanelButton className="flex-1" onPress={onSubmit} disabled={isSaving}>
          {isSaving
            ? t("common.saving")
            : isNew
              ? t("productForm.create")
              : t("productForm.saveChanges")}
        </PanelButton>
      </View>
    </View>
  );
}

type ProductFormMode = "new" | "edit";
type ProductCategoryState = "loading" | "error" | "ready";
type ProductFormLayout = "compact" | "regular";
type ProductFormStatus = "idle" | "saving";
type ProductOverlayState = "closed" | "open";
type ProductDeleteState = "closed" | "open" | "deleting";

function getProductCategoryState(isLoading: boolean, isError: boolean): ProductCategoryState {
  if (isLoading) return "loading";
  if (isError) return "error";
  return "ready";
}

function getProductDeleteState(isDeleting: boolean, isOpen: boolean): ProductDeleteState {
  if (isDeleting) return "deleting";
  return isOpen ? "open" : "closed";
}

function getProductOverlayState(isOpen: boolean): ProductOverlayState {
  return isOpen ? "open" : "closed";
}

function canRecordProductOpeningBalance({
  isNew,
  inventoryMode,
  movementsQuery,
}: {
  isNew: boolean;
  inventoryMode: ProductFormValues["inventory_mode"];
  movementsQuery: ReturnType<typeof useInventoryMovements>;
}): boolean {
  if (isNew || inventoryMode !== "manual" || !movementsQuery.isSuccess) return false;

  const hasMovements = movementsQuery.data?.pages.some((page) => page.data.length > 0) ?? false;
  return !hasMovements && !movementsQuery.hasNextPage;
}

function ProductInventorySheets({
  isNew,
  product,
  inventoryState,
  movementsSheetRef,
  recipeSheetRef,
}: {
  isNew: boolean;
  product: App.Data.Merchant.Product.ProductData | undefined;
  inventoryState: {
    mode: App.Requests.Merchant.InventoryModeEnum;
    inventoryEnabled: boolean;
    inventoryRecipeEnabled: boolean;
  };
  movementsSheetRef: React.MutableRefObject<TrueSheet | null>;
  recipeSheetRef: React.MutableRefObject<TrueSheet | null>;
}): React.JSX.Element | null {
  if (isNew || !product || !inventoryState.inventoryEnabled) return null;

  const capabilities = getProductInventoryCapabilities(inventoryState.mode, isNew);
  const showMovements =
    capabilities.showMovements &&
    (inventoryState.inventoryRecipeEnabled || inventoryState.mode !== "recipe");
  const showRecipe = inventoryState.inventoryRecipeEnabled && capabilities.showRecipe;
  if (!showMovements && !showRecipe) return null;

  return (
    <ProductRelationshipSheets
      productId={product.id}
      productName={product.name}
      showMovements={showMovements}
      showRecipe={showRecipe}
      movementsSheetRef={movementsSheetRef}
      recipeSheetRef={recipeSheetRef}
    />
  );
}

function ProductFormContent({
  mode,
  categoryState,
  inventoryState,
  layout,
  formStatus,
  quickCategoryState,
  quickDiscountState,
  deleteState,
  id,
  t,
  product,
  control,
  errors,
  setValue,
  categoryOptions,
  onRetryCategories,
  onAddCategory,
  imageUri,
  accentColor,
  onSelectImage,
  discount,
  onAddDiscount,
  onShowMovements,
  onShowRecipe,
  onShowOpeningBalance,
  onShowAdjustment,
  canShowOpeningBalance,
  addOns,
  onAddOn,
  onEditAddOn,
  onCancel,
  onSubmit,
  movementsSheetRef,
  recipeSheetRef,
  onQuickCategoryChange,
  onCategoryCreated,
  onQuickDiscountChange,
  onDiscountCreated,
  onDeleteChange,
  onDelete,
}: {
  mode: ProductFormMode;
  categoryState: ProductCategoryState;
  inventoryState: {
    mode: App.Requests.Merchant.InventoryModeEnum;
    data: ProductInventory | undefined;
    inventoryEnabled: boolean;
    inventoryRecipeEnabled: boolean;
  };
  layout: ProductFormLayout;
  formStatus: ProductFormStatus;
  quickCategoryState: ProductOverlayState;
  quickDiscountState: ProductOverlayState;
  deleteState: ProductDeleteState;
  id: string;
  t: Translate;
  product: App.Data.Merchant.Product.ProductData | undefined;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  categoryOptions: { value: string; label: string }[];
  onRetryCategories: () => void;
  onAddCategory: () => void;
  imageUri: string | null | undefined;
  accentColor: string;
  onSelectImage: () => void;
  discount: App.Data.Merchant.Product.ProductDiscountData | null;
  onAddDiscount?: () => void;
  onShowMovements?: () => void;
  onShowRecipe?: () => void;
  onShowOpeningBalance?: () => void;
  onShowAdjustment?: () => void;
  canShowOpeningBalance: boolean;
  addOns: App.Data.Merchant.Product.ProductAddOnData[];
  onAddOn: () => void;
  onEditAddOn: (id: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  movementsSheetRef: React.MutableRefObject<TrueSheet | null>;
  recipeSheetRef: React.MutableRefObject<TrueSheet | null>;
  onQuickCategoryChange: (isOpen: boolean) => void;
  onCategoryCreated: (category: { id: string; name: string }) => void;
  onQuickDiscountChange: (isOpen: boolean) => void;
  onDiscountCreated: () => void;
  onDeleteChange: (isOpen: boolean) => void;
  onDelete: () => void;
}): React.JSX.Element {
  const isNew = mode === "new";
  const areCategoriesLoading = categoryState === "loading";
  const didCategoriesFail = categoryState === "error";
  const isCompact = layout === "compact";
  const isSaving = formStatus === "saving";
  const isQuickCategoryOpen = quickCategoryState === "open";
  const isQuickDiscountOpen = quickDiscountState === "open";
  const isDeleteOpen = deleteState !== "closed";
  const isDeleting = deleteState === "deleting";
  const themeColorDanger = useCSSVariable("--color-destructive") as string;

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? t("productForm.newTitle") : t("productForm.editTitle") }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={themeColorDanger}
            accessibilityLabel={t("productForm.deleteAccessibility")}
            onPress={onDeleteChange.bind(null, true)}
          />
        </Stack.Toolbar>
      ) : null}

      <View className="flex-1 bg-background">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-3xl gap-4">
            <ProductDetailsCard
              control={control}
              errors={errors}
              categoryOptions={categoryOptions}
              areCategoriesLoading={areCategoriesLoading}
              didCategoriesFail={didCategoriesFail}
              onRetryCategories={onRetryCategories}
              onAddCategory={onAddCategory}
            />

            <ProductImageCard
              imageUri={imageUri}
              accentColor={accentColor}
              onSelect={onSelectImage}
            />

            <PricingCard
              control={control}
              error={errors.price?.message}
              productId={!isNew ? id : undefined}
              discount={discount}
              onAddDiscount={onAddDiscount}
            />

            <InventoryCard
              control={control}
              errors={errors}
              inventory={inventoryState.data}
              isNew={isNew}
              inventoryEnabled={inventoryState.inventoryEnabled}
              inventoryRecipeEnabled={inventoryState.inventoryRecipeEnabled}
              canShowOpeningBalance={canShowOpeningBalance}
              onShowMovements={onShowMovements}
              onShowRecipe={inventoryState.inventoryRecipeEnabled ? onShowRecipe : undefined}
              onShowOpeningBalance={onShowOpeningBalance}
              onShowAdjustment={onShowAdjustment}
            />

            <AvailabilityCard control={control} />

            {isNew ? (
              <NewProductAddOnsCard control={control} errors={errors} setValue={setValue} />
            ) : (
              <ProductAddOnsCard addOns={addOns} onAdd={onAddOn} onEdit={onEditAddOn} />
            )}

            <SaveProductCard
              isNew={isNew}
              isCompact={isCompact}
              isSaving={isSaving}
              serverError={errors.root?.server?.message}
              onCancel={onCancel}
              onSubmit={onSubmit}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>

      <ProductInventorySheets
        isNew={isNew}
        product={product}
        inventoryState={inventoryState}
        movementsSheetRef={movementsSheetRef}
        recipeSheetRef={recipeSheetRef}
      />

      <QuickCategoryFormOverlay
        isOpen={isQuickCategoryOpen}
        onOpenChange={onQuickCategoryChange}
        onCreated={onCategoryCreated}
      />

      {!isNew ? (
        <QuickDiscountFormOverlay
          isOpen={isQuickDiscountOpen}
          productId={id}
          onOpenChange={onQuickDiscountChange}
          onCreated={onDiscountCreated}
        />
      ) : null}

      <PanelDialog open={isDeleteOpen} onOpenChange={onDeleteChange}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("productForm.deleteTitle")}</PanelDialog.Title>
          <PanelDialog.Description>{t("productForm.deleteDescription")}</PanelDialog.Description>
          <PanelDialog.Footer>
            <PanelDialog.Close>
              <PanelButton variant="ghost" size="sm">
                {t("common.cancel")}
              </PanelButton>
            </PanelDialog.Close>
            <PanelButton variant="destructive" size="sm" disabled={isDeleting} onPress={onDelete}>
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </PanelButton>
          </PanelDialog.Footer>
        </PanelDialog.Content>
      </PanelDialog>
    </>
  );
}

function getProductFormCategoryOptions(
  categories: { id: string; name: string }[],
  createdCategory: { id: string; name: string } | null
): { value: string; label: string }[] {
  const categoryItems =
    createdCategory && !categories.some((item) => item.id === createdCategory.id)
      ? [...categories, createdCategory]
      : categories;

  return categoryItems.map((item) => ({ value: item.id, label: item.name }));
}

function getProductFormViewData(
  product: App.Data.Merchant.Product.ProductData | undefined,
  imageUri: string | null | undefined
): {
  imageUri: string | null | undefined;
} {
  return {
    imageUri: imageUri ?? product?.image.default,
  };
}

function getProductFormLoadState({
  isNew,
  productQuery,
  productInventoryQuery,
  inventoryEnabled,
  t,
}: {
  isNew: boolean;
  productQuery: ReturnType<typeof useProduct>;
  productInventoryQuery: ReturnType<typeof useProductInventory>;
  inventoryEnabled: boolean;
  t: Translate;
}): React.JSX.Element | null {
  if (!isNew && productQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("productForm.loading")}
        </PanelLoadingText>
      </View>
    );
  }

  if (!isNew && productQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(productQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void productQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  if (!isNew && inventoryEnabled && productInventoryQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("productForm.inventoryLoading")}
        </PanelLoadingText>
      </View>
    );
  }

  if (!isNew && inventoryEnabled && productInventoryQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(productInventoryQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void productInventoryQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  return null;
}

function ProductFormOverlays({
  id,
  isNew,
  isOpeningBalanceOpen,
  isAdjustmentOpen,
  onOpeningBalanceChange,
  onAdjustmentChange,
}: {
  id: string;
  isNew: boolean;
  isOpeningBalanceOpen: boolean;
  isAdjustmentOpen: boolean;
  onOpeningBalanceChange: (isOpen: boolean) => void;
  onAdjustmentChange: (isOpen: boolean) => void;
}): React.JSX.Element | null {
  if (isNew) return null;

  return (
    <>
      <ProductOpeningBalanceOverlay
        productId={id}
        isOpen={isOpeningBalanceOpen}
        onOpenChange={onOpeningBalanceChange}
      />
      <ProductAdjustStockOverlay
        productId={id}
        isOpen={isAdjustmentOpen}
        onOpenChange={onAdjustmentChange}
      />
    </>
  );
}

export default function ProductFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const themeColorAccent = useCSSVariable("--color-primary") as string;
  const [createdProductId, setCreatedProductId] = React.useState<string | null>(null);
  const productId = createdProductId ?? id;
  const isNew = id === "new" && createdProductId === null;
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const { data: merchantProfile } = useMerchantProfile();
  const merchantFeatures = merchantProfile?.features ?? activeMerchant?.features;
  const inventoryEnabled = hasMerchantFeature(merchantFeatures, "inventory");
  const inventoryRecipeEnabled = hasMerchantFeature(merchantFeatures, "inventory_recipe");
  const productQuery = useProduct(productId);
  const productInventoryQuery = useProductInventory(productId, { enabled: inventoryEnabled });
  const categoriesQuery = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct(productId);
  const updateInventoryMutation = useUpdateProductInventory();
  const deleteProductMutation = useDeleteProduct(productId);
  const [createdCategory, setCreatedCategory] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = React.useState(false);
  const [isQuickDiscountOpen, setIsQuickDiscountOpen] = React.useState(false);
  const [isOpeningBalanceOpen, setIsOpeningBalanceOpen] = React.useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = React.useState(false);
  const movementsSheetRef = React.useRef<TrueSheet | null>(null);
  const recipeSheetRef = React.useRef<TrueSheet | null>(null);
  const categoryOptions = getProductFormCategoryOptions(
    categoriesQuery.data ?? [],
    createdCategory
  );
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedProductId = React.useRef<string | null>(null);
  const productSchema = createProductSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category_id: "",
      name: "",
      description: "",
      price: "",
      code: "",
      inventory_mode: "unlimited",
      inventory_cost: "",
      stock_alert: "",
      active: true,
      image: null,
      add_ons: [],
    },
  });
  const imageAsset = useWatch({ control, name: "image" });
  const inventoryMode = useWatch({ control, name: "inventory_mode" });
  const productMovementsQuery = useInventoryMovements(
    { productId },
    { enabled: !isNew && inventoryMode === "manual" }
  );
  const canShowOpeningBalance = canRecordProductOpeningBalance({
    isNew,
    inventoryMode,
    movementsQuery: productMovementsQuery,
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    const product = productQuery.data;
    const inventory = productInventoryQuery.data;
    if (
      isNew ||
      !product ||
      (inventoryEnabled && !inventory) ||
      hydratedProductId.current === product.id
    )
      return;

    reset({
      category_id: product.category?.id ?? "",
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      code: product.code ?? "",
      inventory_mode: inventory?.inventory_mode ?? "unlimited",
      inventory_cost: inventory?.cost == null ? "" : String(inventory.cost),
      stock_alert: inventory?.stock_alert == null ? "" : String(inventory.stock_alert),
      active: product.active,
      image: null,
      add_ons: [],
    });
    hydratedProductId.current = product.id;
  }, [inventoryEnabled, isNew, productInventoryQuery.data, productQuery.data, reset]);

  const loadState = getProductFormLoadState({
    isNew,
    productQuery,
    productInventoryQuery,
    inventoryEnabled,
    t,
  });
  if (loadState) return loadState;

  const isSaving =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    updateInventoryMutation.isPending;
  const product = productQuery.data;
  const inventory = productInventoryQuery.data;
  const { imageUri } = getProductFormViewData(product, imageAsset?.uri);

  const showProductMovements = () => {
    void movementsSheetRef.current?.present(0).catch(() => undefined);
  };

  const showProductRecipe = () => {
    void recipeSheetRef.current?.present(0).catch(() => undefined);
  };

  const applyServerErrors = (error: unknown) => {
    return applyProductServerErrors(error, setError);
  };

  const handleSelectImage = async () => {
    await selectProductImage({ t, toast, setValue });
  };

  const handleProductCreated = (createdId: string) => {
    hydratedProductId.current = createdId;
    setCreatedProductId(createdId);
  };

  const submitProduct = async (values: ProductFormValues) => {
    await saveProduct({
      catalogPayload: toProductPayload(values),
      isNew,
      createMutation: createProductMutation,
      updateMutation: updateProductMutation,
      updateInventoryMutation,
      inventoryValues: toProductInventoryPayload(values),
      inventoryEnabled,
      inventoryRecipeEnabled,
      applyServerErrors,
      setError,
      toast,
      t,
      router,
      onProductCreated: handleProductCreated,
    });
  };

  const handleDelete = async () => {
    await removeProduct({
      deleteMutation: deleteProductMutation,
      setIsDeleteOpen,
      toast,
      t,
      router,
    });
  };

  return (
    <>
      <ProductFormContent
        mode={isNew ? "new" : "edit"}
        categoryState={getProductCategoryState(categoriesQuery.isLoading, categoriesQuery.isError)}
        inventoryState={{
          mode: inventoryMode,
          data: inventory,
          inventoryEnabled,
          inventoryRecipeEnabled,
        }}
        layout={isCompact ? "compact" : "regular"}
        formStatus={isSaving ? "saving" : "idle"}
        quickCategoryState={getProductOverlayState(isQuickCategoryOpen)}
        quickDiscountState={getProductOverlayState(isQuickDiscountOpen)}
        deleteState={getProductDeleteState(deleteProductMutation.isPending, isDeleteOpen)}
        id={productId}
        t={t}
        product={product}
        control={control}
        errors={errors}
        setValue={setValue}
        categoryOptions={categoryOptions}
        onRetryCategories={() => void categoriesQuery.refetch()}
        onAddCategory={() => setIsQuickCategoryOpen(true)}
        imageUri={imageUri}
        accentColor={themeColorAccent}
        onSelectImage={handleSelectImage}
        discount={productQuery.data?.discount ?? null}
        onAddDiscount={() => setIsQuickDiscountOpen(true)}
        onShowMovements={showProductMovements}
        onShowRecipe={showProductRecipe}
        onShowOpeningBalance={() => setIsOpeningBalanceOpen(true)}
        onShowAdjustment={() => setIsAdjustmentOpen(true)}
        canShowOpeningBalance={canShowOpeningBalance}
        addOns={productQuery.data?.add_ons ?? []}
        onAddOn={() => router.push(`/products/${productId}/add-ons/new`)}
        onEditAddOn={(addOnId) => router.push(`/products/${productId}/add-ons/${addOnId}`)}
        onCancel={() => router.back()}
        onSubmit={() => void handleSubmit(submitProduct)()}
        movementsSheetRef={movementsSheetRef}
        recipeSheetRef={recipeSheetRef}
        onQuickCategoryChange={setIsQuickCategoryOpen}
        onCategoryCreated={(category) => {
          setCreatedCategory(category);
          setValue("category_id", category.id, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        onQuickDiscountChange={setIsQuickDiscountOpen}
        onDiscountCreated={() => void productQuery.refetch()}
        onDeleteChange={setIsDeleteOpen}
        onDelete={handleDelete}
      />
      <ProductFormOverlays
        id={productId}
        isNew={isNew}
        isOpeningBalanceOpen={isOpeningBalanceOpen}
        isAdjustmentOpen={isAdjustmentOpen}
        onOpeningBalanceChange={setIsOpeningBalanceOpen}
        onAdjustmentChange={setIsAdjustmentOpen}
      />
    </>
  );
}

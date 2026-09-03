import AppIcon from "@/components/common/app-icon";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Description,
  Input,
  Label,
  Select,
  Separator,
  Switch,
  TextArea,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  useOverlayPresentation,
  type OverlayChoicePresentation,
} from "@/hooks/use-overlay-presentation";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetError,
  type UseFormSetValue,
} from "react-hook-form";
import { Image } from "expo-image";
import { Platform, Pressable, View } from "react-native";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import ActionDialog from "@/components/common/action-dialog";
import { FormNumberField, RupiahField } from "@/components/common/form-number-field";
import { getErrorMessage, isApiError } from "@/api/api-error";
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
  useUpdateProduct,
  type ProductFormPayload,
} from "@/hooks/db/use-products";
import { createProductSchema, type ProductFormValues } from "@/schemas/product";
import ProductAddOnsCard from "./product-add-ons-card";
import NewProductAddOnsCard from "./new-product-add-ons-card";
import ProductRelationshipSheets from "./product-relationship-sheets";
import QuickCategoryFormOverlay from "./quick-category-form-overlay";
import QuickDiscountFormOverlay from "./quick-discount-form-overlay";
import { formatRupiah } from "@/utils/format";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const PRODUCT_IMAGE_MAX_EDGE = 1600;
const PRODUCT_IMAGE_QUALITY = 0.82;
const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const PRODUCT_FORM_FIELDS = new Set<keyof ProductFormValues>([
  "category_id",
  "name",
  "description",
  "price",
  "code",
  "stock_enabled",
  "stock",
  "stock_alert",
  "active",
  "image",
]);

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

function toProductPayload(values: ProductFormValues): ProductFormPayload {
  return {
    values: {
      name: values.name.trim(),
      code: values.code.trim() || null,
      category_id: values.category_id,
      description: values.description.trim() || null,
      price: Number(values.price),
      stock_enabled: values.stock_enabled,
      stock: values.stock_enabled ? Number(values.stock) : null,
      stock_alert: values.stock_enabled && values.stock_alert ? Number(values.stock_alert) : null,
      active: values.active,
      add_ons:
        values.add_ons.length > 0
          ? values.add_ons.map((addOn) => ({
              name: addOn.name.trim(),
              required: addOn.required,
              multiple: addOn.multiple,
              min: addOn.required && addOn.multiple ? Number(addOn.min) : addOn.required ? 1 : 0,
              max: addOn.multiple ? Number(addOn.max) : 1,
              options: addOn.options.map((option) => ({
                name: option.name.trim(),
                price: Number(option.price),
              })),
            }))
          : undefined,
    },
    image: values.image,
  };
}

function applyProductServerErrors(
  error: unknown,
  setError: UseFormSetError<ProductFormValues>
): boolean {
  if (!isApiError(error) || !error.errors) return false;
  let applied = false;

  for (const [field, messages] of Object.entries(error.errors)) {
    if (PRODUCT_FORM_FIELDS.has(field as keyof ProductFormValues) && messages[0]) {
      setError(field as keyof ProductFormValues, { type: "server", message: messages[0] });
      applied = true;
    }
  }

  return applied;
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
      variant: "danger",
      label: t("productForm.imagePreparationFailed"),
      description: getErrorMessage(error),
    });
  }
}

async function saveProduct({
  values,
  isNew,
  createMutation,
  updateMutation,
  applyServerErrors,
  setError,
  toast,
  t,
  router,
}: {
  values: ProductFormValues;
  isNew: boolean;
  createMutation: ReturnType<typeof useCreateProduct>;
  updateMutation: ReturnType<typeof useUpdateProduct>;
  applyServerErrors: (error: unknown) => boolean;
  setError: UseFormSetError<ProductFormValues>;
  toast: ReturnType<typeof useToast>["toast"];
  t: Translate;
  router: ReturnType<typeof useRouter>;
}): Promise<void> {
  try {
    await (isNew
      ? createMutation.mutateAsync(toProductPayload(values))
      : updateMutation.mutateAsync(toProductPayload(values)));
    toast.show({
      variant: "success",
      label: isNew ? t("productForm.created") : t("productForm.updated"),
    });
    router.back();
  } catch (error: unknown) {
    const hasFieldErrors = applyServerErrors(error);
    const message = hasFieldErrors ? t("productForm.checkFields") : getErrorMessage(error);
    setError("root.server", { type: "server", message });
    toast.show({
      variant: "danger",
      label: isNew ? t("productForm.createFailed") : t("productForm.updateFailed"),
      description: message,
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
      variant: "danger",
      label: t("productForm.deleteFailed"),
      description: getErrorMessage(error),
    });
  }
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header className="pb-2">
      <View className="gap-1">
        <Card.Title>{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </View>
    </Card.Header>
  );
}

function ProductNumberField({
  label,
  placeholder,
  description,
  required,
  value,
  onChangeText,
  error,
  step = 1,
}: {
  label: string;
  placeholder: string;
  description?: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  step?: number;
}) {
  return (
    <RupiahField
      className="flex-1"
      label={label}
      placeholder={placeholder}
      inputVariant="secondary"
      value={value}
      onChange={onChangeText}
      minValue={0}
      step={step}
      isRequired={required}
      isInvalid={!!error}
    >
      {error ? (
        <Description className="text-danger">{error}</Description>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </RupiahField>
  );
}

function ProductNumberStepper({
  label,
  description,
  required,
  value,
  onChangeText,
  error,
}: {
  label: string;
  description?: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <FormNumberField
      className="flex-1"
      label={label}
      value={value}
      onChange={onChangeText}
      minValue={0}
      step={1}
      showStepper
      decreaseAccessibilityLabel={t("productForm.decreaseAccessibility", { field: label })}
      increaseAccessibilityLabel={t("productForm.increaseAccessibility", { field: label })}
      isRequired={required}
      isInvalid={!!error}
    >
      {error ? (
        <Description className="text-danger">{error}</Description>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </FormNumberField>
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
        <Typography type="body-xs" color="muted">
          {description}
        </Typography>
      </View>
      <Switch isSelected={isSelected} onSelectedChange={onSelectedChange} />
    </View>
  );
}

function DeleteProductDialog({
  isOpen,
  isDeleting,
  onOpenChange,
  onDelete,
}: {
  isOpen: boolean;
  isDeleting: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <ActionDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("productForm.deleteTitle")}
      description={t("productForm.deleteDescription")}
      actionLabel={isDeleting ? t("common.deleting") : t("common.delete")}
      actionVariant="danger"
      isActionDisabled={isDeleting}
      onAction={onDelete}
    />
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
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title={t("productForm.imageTitle")}
        description={t("productForm.imageDescription")}
      />
      <Card.Body className="items-center pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("productForm.chooseImageAccessibility")}
          onPress={onSelect}
          className="aspect-video w-full items-center justify-center gap-3 overflow-hidden rounded-panel-inner bg-surface-secondary active:opacity-80"
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
            />
          ) : (
            <>
              <View className="size-14 items-center justify-center rounded-full bg-accent-soft">
                <AppIcon name="image-outline" size={26} color={accentColor} />
              </View>
              <View className="items-center gap-1 px-6">
                <Typography type="body-sm" weight="semibold">
                  {t("productForm.addImage")}
                </Typography>
                <Typography type="body-xs" color="muted" className="text-center">
                  {t("productForm.imageRequirements")}
                </Typography>
              </View>
            </>
          )}
        </Pressable>
      </Card.Body>
      <Card.Footer className="pt-0">
        <Typography type="body-xs" color="muted">
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
  const [themeColorForeground] = useThemeColor(["foreground"]);

  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title={t("productForm.detailsTitle")}
        description={t("productForm.detailsDescription")}
      />
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="category_id"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <Label isRequired isInvalid={Boolean(errors.category_id)}>
                {t("productForm.category")}
              </Label>
              <View className="flex-row items-center gap-2">
                <Select
                  presentation={choicePresentation}
                  value={categoryOptions.find((option) => option.value === value)}
                  onValueChange={(option) => onChange(option?.value ?? "")}
                  isDisabled={areCategoriesLoading || didCategoriesFail}
                  className="flex-1"
                >
                  <Select.Trigger
                    accessibilityLabel={t("productForm.category")}
                    className={`${errors.category_id ? "border-danger" : ""}`}
                  >
                    <Select.Value placeholder={t("productForm.selectCategory")} numberOfLines={1} />
                    <Select.TriggerIndicator />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Overlay />
                    <Select.Content
                      presentation={choicePresentation}
                      width={choicePresentation === "popover" ? "trigger" : undefined}
                    >
                      {categoryOptions.map((option) => (
                        <Select.Item key={option.value} {...option} />
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
                <Button
                  variant="ghost"
                  isIconOnly
                  accessibilityLabel={t("productForm.addCategoryAccessibility")}
                  onPress={onAddCategory}
                >
                  <AppIcon name="add" size={18} color={themeColorForeground} />
                </Button>
              </View>
              {didCategoriesFail ? (
                <View className="flex-row items-center justify-between gap-3">
                  <Description isInvalid className="flex-1 text-danger">
                    {t("productForm.categoriesFailed")}
                  </Description>
                  <Button size="sm" variant="ghost" onPress={onRetryCategories}>
                    {t("common.retry")}
                  </Button>
                </View>
              ) : errors.category_id?.message ? (
                <Description isInvalid className="text-danger">
                  {errors.category_id.message}
                </Description>
              ) : areCategoriesLoading ? (
                <Description>{t("categories.loading")}</Description>
              ) : categoryOptions.length === 0 ? (
                <Description className="text-warning">{t("productForm.noCategories")}</Description>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isRequired isInvalid={!!errors.name}>
              <Label>{t("productForm.name")}</Label>
              <Input
                variant="secondary"
                placeholder={t("productForm.namePlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              {errors.name?.message ? (
                <Description className="text-danger">{errors.name.message}</Description>
              ) : null}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isInvalid={!!errors.description}>
              <Label>{t("productForm.description")}</Label>
              <TextArea
                variant="secondary"
                placeholder={t("productForm.descriptionPlaceholder")}
                className="min-h-24"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              <Description className={errors.description ? "text-danger" : undefined}>
                {errors.description?.message ?? t("productForm.descriptionHelp")}
              </Description>
            </TextField>
          )}
        />
      </Card.Body>
    </Card>
  );
}

function InventoryCard({
  control,
  errors,
  stockEnabled,
  showMovements,
  showRecipe,
  onShowMovements,
  onShowRecipe,
}: {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  stockEnabled: boolean;
  showMovements: boolean;
  showRecipe: boolean;
  onShowMovements?: () => void;
  onShowRecipe?: () => void;
}) {
  const { t } = useTranslation();
  const [themeColorForeground] = useThemeColor(["foreground"]);

  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title={t("productForm.inventoryTitle")}
        description={t("productForm.inventoryDescription")}
      />
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange } }) => (
            <TextField isInvalid={!!errors.code}>
              <Label>{t("productForm.code")}</Label>
              <Input
                variant="secondary"
                placeholder={t("productForm.codePlaceholder")}
                autoCapitalize="characters"
                value={value}
                onChangeText={onChange}
              />
              <Description className={errors.code ? "text-danger" : undefined}>
                {errors.code?.message ?? t("productForm.codeHelp")}
              </Description>
            </TextField>
          )}
        />
        <Separator />
        <Controller
          control={control}
          name="stock_enabled"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              title={t("productForm.trackStock")}
              description={t("productForm.trackStockDescription")}
              isSelected={value}
              onSelectedChange={onChange}
            />
          )}
        />
        {stockEnabled ? (
          <View className="flex-row flex-wrap gap-3">
            <Controller
              control={control}
              name="stock"
              render={({ field: { value, onChange } }) => (
                <ProductNumberStepper
                  label={t("productForm.availableStock")}
                  required
                  value={value}
                  onChangeText={onChange}
                  error={errors.stock?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="stock_alert"
              render={({ field: { value, onChange } }) => (
                <ProductNumberStepper
                  label={t("productForm.lowStockAlert")}
                  description={t("productForm.lowStockDescription")}
                  value={value}
                  onChangeText={onChange}
                  error={errors.stock_alert?.message}
                />
              )}
            />
          </View>
        ) : null}
      </Card.Body>
      {showMovements || showRecipe ? (
        <Card.Footer className="flex-row gap-2 pt-0">
          {showMovements && onShowMovements ? (
            <Button
              size="sm"
              variant="outline"
              className={showRecipe ? "min-w-0 flex-1 px-1" : "w-full"}
              accessibilityLabel={t("productForm.showInventoryMovementsAccessibility")}
              onPress={onShowMovements}
            >
              <AppIcon name="swap-vertical-outline" size={16} color={themeColorForeground} />
              <Button.Label numberOfLines={1}>{t("productForm.inventoryMovements")}</Button.Label>
            </Button>
          ) : null}
          {showRecipe && onShowRecipe ? (
            <Button
              size="sm"
              variant="outline"
              className={showMovements ? "min-w-0 flex-1 px-1" : "w-full"}
              accessibilityLabel={t("productForm.showRecipeAccessibility")}
              onPress={onShowRecipe}
            >
              <AppIcon name="restaurant-outline" size={16} color={themeColorForeground} />
              <Button.Label numberOfLines={1}>{t("productForm.recipe")}</Button.Label>
            </Button>
          ) : null}
        </Card.Footer>
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
  const price = useWatch({ control, name: "price" });
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
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title={t("productForm.pricingTitle")}
        description={t("productForm.pricingDescription")}
      />
      <Card.Body className="gap-4">
        <View className="flex-row flex-wrap gap-3">
          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange } }) => (
              <ProductNumberField
                label={t("productForm.price")}
                placeholder="0"
                required
                value={value}
                onChangeText={onChange}
                error={error}
                step={1000}
              />
            )}
          />
          {discountedPrice !== null ? (
            <View className="flex-1 gap-1">
              <Label>{t("productForm.discountPrice")}</Label>
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
      </Card.Body>
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
  const [themeColorForeground, themeColorMuted] = useThemeColor(["foreground", "muted"]);
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
        variant: "danger",
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
        variant: "danger",
        label: t("productForm.discountUpdateFailed"),
        description: t("productForm.discountUpdateFailedDescription"),
      });
    }
  };

  return (
    <View className="gap-1.5">
      <Label>{t("productForm.discountOptional")}</Label>
      <View className="flex-row items-center gap-2">
        <ProductDiscountSelect
          choicePresentation={choicePresentation}
          selectedOption={selectedOption}
          discountOptions={discountOptions}
          isDisabled={
            discountsQuery.isLoading ||
            discountsQuery.isError ||
            discountOptions.length === 0 ||
            setProductDiscount.isPending
          }
          onChange={handleChange}
        />
        <Button
          variant="ghost"
          isIconOnly
          accessibilityLabel={t("productForm.addDiscountAccessibility")}
          onPress={onAdd}
          isDisabled={setProductDiscount.isPending}
        >
          <AppIcon name="add" size={18} color={themeColorForeground} />
        </Button>
        {currentDiscount ? (
          <Button
            variant="ghost"
            isIconOnly
            accessibilityLabel={t("productForm.removeDiscountAccessibility")}
            onPress={() => void handleRemove()}
            isDisabled={setProductDiscount.isPending}
          >
            <AppIcon name="close-outline" size={18} color={themeColorMuted} />
          </Button>
        ) : null}
      </View>
      {discountsQuery.isLoading ? (
        <Description>{t("productForm.discountLoading")}</Description>
      ) : discountsQuery.isError ? (
        <Description isInvalid>{t("productForm.discountUnavailable")}</Description>
      ) : (
        <Description>{t("productForm.discountHelp")}</Description>
      )}
    </View>
  );
}

function ProductDiscountSelect({
  choicePresentation,
  selectedOption,
  discountOptions,
  isDisabled,
  onChange,
}: {
  choicePresentation: OverlayChoicePresentation;
  selectedOption?: ProductDiscountOption;
  discountOptions: ProductDiscountOption[];
  isDisabled: boolean;
  onChange: (value?: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Select
      presentation={choicePresentation}
      value={selectedOption}
      onValueChange={(option) => onChange(option?.value)}
      isDisabled={isDisabled}
      className="flex-1"
    >
      <Select.Trigger accessibilityLabel={t("productForm.discountOptional")} className="flex-1">
        <Select.Value placeholder={t("productForm.selectDiscount")} numberOfLines={1} />
        <Select.TriggerIndicator />
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content
          presentation={choicePresentation}
          width={choicePresentation === "popover" ? "trigger" : undefined}
        >
          {discountOptions.length ? (
            discountOptions.map((option) => (
              <Select.Item key={option.value} value={option.value} label={option.label}>
                {() => (
                  <>
                    <Select.ItemLabel />
                    <Select.ItemDescription>{option.description}</Select.ItemDescription>
                    <Select.ItemIndicator />
                  </>
                )}
              </Select.Item>
            ))
          ) : (
            <Select.ListLabel>{t("productForm.noDiscounts")}</Select.ListLabel>
          )}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

function AvailabilityCard({ control }: { control: Control<ProductFormValues> }) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading title={t("productForm.availabilityTitle")} />
      <Card.Body className="gap-4">
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
      </Card.Body>
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
  onSubmit: React.ComponentProps<typeof Button>["onPress"];
}) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 gap-3 pt-2">
      {serverError ? (
        <Typography type="body-xs" className="text-danger">
          {serverError}
        </Typography>
      ) : null}
      <View className="flex-row gap-3">
        <Button variant="ghost" onPress={onCancel} isDisabled={isSaving}>
          <Button.Label>{t("common.cancel")}</Button.Label>
        </Button>
        <Button className="flex-1" onPress={onSubmit} isDisabled={isSaving}>
          <Button.Label>
            {isSaving
              ? t("common.saving")
              : isNew
                ? t("productForm.create")
                : t("productForm.saveChanges")}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

type ProductFormMode = "new" | "edit";
type ProductCategoryState = "loading" | "error" | "ready";
type ProductRelationshipMode = "none" | "movements" | "recipe";
type ProductFormLayout = "compact" | "regular";
type ProductFormStatus = "idle" | "saving";
type ProductOverlayState = "closed" | "open";
type ProductDeleteState = "closed" | "open" | "deleting";

function getProductCategoryState(isLoading: boolean, isError: boolean): ProductCategoryState {
  if (isLoading) return "loading";
  if (isError) return "error";
  return "ready";
}

function getProductRelationshipMode(
  showRecipe: boolean,
  showMovements: boolean
): ProductRelationshipMode {
  if (showRecipe) return "recipe";
  if (showMovements) return "movements";
  return "none";
}

function getProductDeleteState(isDeleting: boolean, isOpen: boolean): ProductDeleteState {
  if (isDeleting) return "deleting";
  return isOpen ? "open" : "closed";
}

function getProductOverlayState(isOpen: boolean): ProductOverlayState {
  return isOpen ? "open" : "closed";
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
    enabled: boolean;
    relationship: ProductRelationshipMode;
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
  const stockEnabled = inventoryState.enabled;
  const showMovements = inventoryState.relationship === "movements";
  const showRecipe = inventoryState.relationship === "recipe";
  const isCompact = layout === "compact";
  const isSaving = formStatus === "saving";
  const isQuickCategoryOpen = quickCategoryState === "open";
  const isQuickDiscountOpen = quickDiscountState === "open";
  const isDeleteOpen = deleteState !== "closed";
  const isDeleting = deleteState === "deleting";

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? t("productForm.newTitle") : t("productForm.editTitle") }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={accentColor}
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
              stockEnabled={stockEnabled}
              showMovements={showMovements}
              showRecipe={showRecipe}
              onShowMovements={onShowMovements}
              onShowRecipe={onShowRecipe}
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

      {!isNew && product && (showMovements || showRecipe) ? (
        <ProductRelationshipSheets
          productId={product.id}
          productName={product.name}
          showMovements={showMovements}
          showRecipe={showRecipe}
          movementsSheetRef={movementsSheetRef}
          recipeSheetRef={recipeSheetRef}
        />
      ) : null}

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

      <DeleteProductDialog
        isOpen={isDeleteOpen}
        isDeleting={isDeleting}
        onOpenChange={onDeleteChange}
        onDelete={onDelete}
      />
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
  isNew: boolean,
  product: App.Data.Merchant.Product.ProductData | undefined,
  imageUri: string | null | undefined
): {
  imageUri: string | null | undefined;
  showMovements: boolean;
  showRecipe: boolean;
} {
  return {
    imageUri: imageUri ?? product?.image.default,
    showMovements:
      !isNew && (product?.inventory_mode === "manual" || product?.inventory_mode === "recipe"),
    showRecipe: !isNew && product?.inventory_mode === "recipe",
  };
}

export default function ProductFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const themeColorAccent = useThemeColor("accent");
  const isNew = id === "new";
  const productQuery = useProduct(id);
  const categoriesQuery = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct(id);
  const deleteProductMutation = useDeleteProduct(id);
  const [createdCategory, setCreatedCategory] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = React.useState(false);
  const [isQuickDiscountOpen, setIsQuickDiscountOpen] = React.useState(false);
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
      stock_enabled: false,
      stock: "",
      stock_alert: "",
      active: true,
      image: null,
      add_ons: [],
    },
  });
  const stockEnabled = useWatch({ control, name: "stock_enabled" });
  const imageAsset = useWatch({ control, name: "image" });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    const product = productQuery.data;
    if (isNew || !product || hydratedProductId.current === product.id) return;

    reset({
      category_id: product.category?.id ?? "",
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      code: product.code ?? "",
      stock_enabled: product.stock.enabled,
      stock: product.stock.enabled && product.stock.qty !== null ? String(product.stock.qty) : "",
      stock_alert: product.stock.alert === null ? "" : String(product.stock.alert),
      active: product.active,
      image: null,
      add_ons: [],
    });
    hydratedProductId.current = product.id;
  }, [isNew, productQuery.data, reset]);

  if (!isNew && productQuery.isLoading) {
    return <LoadingState message={t("productForm.loading")} />;
  }

  if (!isNew && productQuery.isError) {
    return <ErrorState error={productQuery.error} onRetry={productQuery.refetch} />;
  }

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;
  const product = productQuery.data;
  const { imageUri, showMovements, showRecipe } = getProductFormViewData(
    isNew,
    product,
    imageAsset?.uri
  );

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

  const submitProduct = async (values: ProductFormValues) => {
    await saveProduct({
      values,
      isNew,
      createMutation: createProductMutation,
      updateMutation: updateProductMutation,
      applyServerErrors,
      setError,
      toast,
      t,
      router,
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
    <ProductFormContent
      mode={isNew ? "new" : "edit"}
      categoryState={getProductCategoryState(categoriesQuery.isLoading, categoriesQuery.isError)}
      inventoryState={{
        enabled: stockEnabled,
        relationship: getProductRelationshipMode(showRecipe, showMovements),
      }}
      layout={isCompact ? "compact" : "regular"}
      formStatus={isSaving ? "saving" : "idle"}
      quickCategoryState={getProductOverlayState(isQuickCategoryOpen)}
      quickDiscountState={getProductOverlayState(isQuickDiscountOpen)}
      deleteState={getProductDeleteState(deleteProductMutation.isPending, isDeleteOpen)}
      id={id}
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
      addOns={productQuery.data?.add_ons ?? []}
      onAddOn={() => router.push(`/products/${id}/add-ons/new`)}
      onEditAddOn={(addOnId) => router.push(`/products/${id}/add-ons/${addOnId}`)}
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
  );
}

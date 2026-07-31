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
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { Controller, useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { Image } from "expo-image";
import { Platform, Pressable, View } from "react-native";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import ActionDialog from "@/components/common/action-dialog";
import StringNumberField from "@/components/common/string-number-field";
import { getErrorMessage, isApiError } from "@/api/api-error";
import type { ProductImageAsset } from "@/api/endpoints/products";
import { useCategories } from "@/hooks/db/use-categories";
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
  type ProductFormPayload,
} from "@/hooks/db/use-products";
import { createProductSchema, type ProductFormValues } from "@/schemas/product";
import ProductAddOnsCard from "./product-add-ons-card";
import QuickCategoryFormOverlay from "./quick-category-form-overlay";
import { IDR_CURRENCY_FORMAT_OPTIONS } from "@/utils/format";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";
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
    },
    image: values.image,
  };
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
  formatOptions,
}: {
  label: string;
  placeholder: string;
  description?: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
}) {
  return (
    <StringNumberField
      className="flex-1"
      label={label}
      placeholder={placeholder}
      inputVariant="secondary"
      value={value}
      onChange={onChangeText}
      minValue={0}
      step={step}
      formatOptions={formatOptions}
      isRequired={required}
      isInvalid={!!error}
    >
      {error ? (
        <Description className="text-danger">{error}</Description>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </StringNumberField>
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
}: {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  stockEnabled: boolean;
}) {
  const { t } = useTranslation();

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
                <ProductNumberField
                  label={t("productForm.availableStock")}
                  placeholder="0"
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
                <ProductNumberField
                  label={t("productForm.lowStockAlert")}
                  placeholder={t("checkout.optional")}
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
    </Card>
  );
}

function PricingCard({ control, error }: { control: Control<ProductFormValues>; error?: string }) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title={t("productForm.pricingTitle")}
        description={t("productForm.pricingDescription")}
      />
      <Card.Body className="gap-4">
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
              formatOptions={IDR_CURRENCY_FORMAT_OPTIONS}
            />
          )}
        />
      </Card.Body>
    </Card>
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

export default function ProductFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [themeColorAccent, themeColorDanger] = useThemeColor(["accent", "danger"]);
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
  const categoryItems = [...(categoriesQuery.data ?? [])];
  if (createdCategory && !categoryItems.some((category) => category.id === createdCategory.id)) {
    categoryItems.push(createdCategory);
  }
  const categoryOptions = categoryItems.map((item) => ({
    value: item.id,
    label: item.name,
  }));
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
  const imageUri = imageAsset?.uri ?? (!isNew ? productQuery.data?.image.default : null);

  const applyServerErrors = (error: unknown) => {
    if (!isApiError(error) || !error.errors) return false;
    let applied = false;
    for (const [field, messages] of Object.entries(error.errors)) {
      if (PRODUCT_FORM_FIELDS.has(field as keyof ProductFormValues) && messages[0]) {
        setError(field as keyof ProductFormValues, { type: "server", message: messages[0] });
        applied = true;
      }
    }
    return applied;
  };

  const handleSelectImage = async () => {
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
      aspect: [4, 3],
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
  };

  const submitProduct = async (values: ProductFormValues) => {
    try {
      await (isNew
        ? createProductMutation.mutateAsync(toProductPayload(values))
        : updateProductMutation.mutateAsync(toProductPayload(values)));
      toast.show({
        variant: "success",
        label: isNew ? t("productForm.created") : t("productForm.updated"),
      });
      router.back();
    } catch (error: unknown) {
      const hasFieldErrors = applyServerErrors(error);
      setError("root.server", {
        type: "server",
        message: hasFieldErrors ? t("productForm.checkFields") : getErrorMessage(error),
      });
      toast.show({
        variant: "danger",
        label: isNew ? t("productForm.createFailed") : t("productForm.updateFailed"),
        description: hasFieldErrors ? t("productForm.checkFields") : getErrorMessage(error),
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync();
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
  };

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
            onPress={() => setIsDeleteOpen(true)}
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
              areCategoriesLoading={categoriesQuery.isLoading}
              didCategoriesFail={categoriesQuery.isError}
              onRetryCategories={() => void categoriesQuery.refetch()}
              onAddCategory={() => setIsQuickCategoryOpen(true)}
            />

            <ProductImageCard
              imageUri={imageUri}
              accentColor={themeColorAccent}
              onSelect={handleSelectImage}
            />

            <PricingCard control={control} error={errors.price?.message} />

            <InventoryCard control={control} errors={errors} stockEnabled={stockEnabled} />

            <AvailabilityCard control={control} />

            {!isNew ? (
              <ProductAddOnsCard
                addOns={productQuery.data?.add_ons ?? []}
                onAdd={() => router.push(`/products/${id}/add-ons/new`)}
                onEdit={(addOnId) => router.push(`/products/${id}/add-ons/${addOnId}`)}
              />
            ) : null}

            <SaveProductCard
              isNew={isNew}
              isCompact={isCompact}
              isSaving={isSaving}
              serverError={errors.root?.server?.message}
              onCancel={() => router.back()}
              onSubmit={handleSubmit(submitProduct)}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>

      <QuickCategoryFormOverlay
        isOpen={isQuickCategoryOpen}
        onOpenChange={setIsQuickCategoryOpen}
        onCreated={(category) => {
          setCreatedCategory(category);
          setValue("category_id", category.id, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
      />

      <DeleteProductDialog
        isOpen={isDeleteOpen}
        isDeleting={deleteProductMutation.isPending}
        onOpenChange={setIsDeleteOpen}
        onDelete={handleDelete}
      />
    </>
  );
}

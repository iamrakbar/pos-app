import { Ionicons } from "@expo/vector-icons";
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
import { Platform, Pressable, ScrollView, View } from "react-native";
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
import { productSchema, type ProductFormValues } from "@/schemas/product";
import ProductAddOnsCard from "./product-add-ons-card";
import { useCategoryFormNavigation } from "@/stores/use-category-form-navigation";
import { IDR_CURRENCY_FORMAT_OPTIONS } from "@/utils/format";

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
  asset: ImagePicker.ImagePickerAsset
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
      throw new Error(`The optimized image could not be read (status ${response.status}).`);
    }
    size = (await response.blob()).size;
  } else {
    size = new File(optimizedImage.uri).size ?? 0;
  }

  if (size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("The optimized image is still larger than 4 MB. Choose a smaller image.");
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
  return (
    <ActionDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Delete product?"
      description="This product will be permanently removed from the catalog."
      actionLabel={isDeleting ? "Deleting…" : "Delete"}
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
  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title="Product Image"
        description="Use a clear image with a square or landscape crop."
      />
      <Card.Body className="items-center pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose product image"
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
                <Ionicons name="image-outline" size={26} color={accentColor} />
              </View>
              <View className="items-center gap-1 px-6">
                <Typography type="body-sm" weight="semibold">
                  Add product image
                </Typography>
                <Typography type="body-xs" color="muted" className="text-center">
                  Optimized JPG, up to 4 MB
                </Typography>
              </View>
            </>
          )}
        </Pressable>
      </Card.Body>
      <Card.Footer className="pt-0">
        <Typography type="body-xs" color="muted">
          The image is shown only when one is available.
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
  const { choicePresentation } = useOverlayPresentation();

  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading
        title="Product Details"
        description="Information customers see across your sales channels."
      />
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="category_id"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <Label isRequired isInvalid={Boolean(errors.category_id)}>
                Category
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
                    accessibilityLabel="Category"
                    className={`${errors.category_id ? "border-danger" : ""}`}
                  >
                    <Select.Value placeholder="Select a category" numberOfLines={1} />
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
                  accessibilityLabel="Add category"
                  onPress={onAddCategory}
                >
                  <Ionicons name="add" size={18} />
                </Button>
              </View>
              {didCategoriesFail ? (
                <View className="flex-row items-center justify-between gap-3">
                  <Description isInvalid className="flex-1 text-danger">
                    Categories could not be loaded.
                  </Description>
                  <Button size="sm" variant="ghost" onPress={onRetryCategories}>
                    Retry
                  </Button>
                </View>
              ) : errors.category_id?.message ? (
                <Description isInvalid className="text-danger">
                  {errors.category_id.message}
                </Description>
              ) : areCategoriesLoading ? (
                <Description>Loading categories…</Description>
              ) : categoryOptions.length === 0 ? (
                <Description className="text-warning">
                  No active categories are available.
                </Description>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isRequired isInvalid={!!errors.name}>
              <Label>Product name</Label>
              <Input
                variant="secondary"
                placeholder="e.g. Mushroom & Swiss Burger"
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
              <Label>Description</Label>
              <TextArea
                variant="secondary"
                placeholder="Describe the product, ingredients, or serving notes"
                className="min-h-24"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              <Description className={errors.description ? "text-danger" : undefined}>
                {errors.description?.message ?? "Keep it concise and helpful for customers."}
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
  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading title="Inventory" description="Track this product by SKU and stock." />
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange } }) => (
            <TextField isInvalid={!!errors.code}>
              <Label>Code / SKU</Label>
              <Input
                variant="secondary"
                placeholder="e.g. 88551340"
                autoCapitalize="characters"
                value={value}
                onChangeText={onChange}
              />
              <Description className={errors.code ? "text-danger" : undefined}>
                {errors.code?.message ?? "Optional stock keeping unit"}
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
              title="Track stock"
              description="Keep an inventory count for this product."
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
                  label="Available stock"
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
                  label="Low-stock alert"
                  placeholder="Optional"
                  description="Notify when stock reaches this amount."
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
  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading title="Pricing" description="Set the product selling price." />
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="price"
          render={({ field: { value, onChange } }) => (
            <ProductNumberField
              label="Price (Rp)"
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
  return (
    <Card className="gap-3 overflow-hidden">
      <SectionHeading title="Availability" />
      <Card.Body className="gap-4">
        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              title="Active"
              description="Show this product on all sales channels."
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
  return (
    <View className="flex-1 gap-3">
      {serverError ? (
        <Typography type="body-xs" className="text-danger">
          {serverError}
        </Typography>
      ) : null}
      <View className="flex-col md:flex-row gap-3">
        <Button variant="secondary" onPress={onCancel} isDisabled={isSaving}>
          <Button.Label>Cancel</Button.Label>
        </Button>
        <Button className="flex-1" onPress={onSubmit} isDisabled={isSaving}>
          <Button.Label>
            {isSaving ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

export default function ProductFormScreen(): React.JSX.Element {
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
  const createdCategory = useCategoryFormNavigation((state) => state.createdCategory);
  const clearCreatedCategory = useCategoryFormNavigation((state) => state.clearCreatedCategory);
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
  const handledCreatedCategoryId = React.useRef<string | null>(null);
  const {
    control,
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

  React.useEffect(() => {
    if (!createdCategory || handledCreatedCategoryId.current === createdCategory.id) return;

    handledCreatedCategoryId.current = createdCategory.id;
    setValue("category_id", createdCategory.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void categoriesQuery.refetch();
  }, [categoriesQuery, createdCategory, setValue]);

  React.useEffect(() => {
    if (
      createdCategory &&
      categoriesQuery.data?.some((category) => category.id === createdCategory.id)
    ) {
      clearCreatedCategory();
    }
  }, [categoriesQuery.data, clearCreatedCategory, createdCategory]);

  if (!isNew && productQuery.isLoading) {
    return <LoadingState message="Loading product…" />;
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
        label: "Photo access required",
        description: "Allow photo access to select a product image.",
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
      setValue("image", await optimizeProductImage(result.assets[0]), {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error: unknown) {
      toast.show({
        variant: "danger",
        label: "Could not prepare image",
        description: getErrorMessage(error),
      });
    }
  };

  const submitProduct = async (values: ProductFormValues) => {
    try {
      await (isNew
        ? createProductMutation.mutateAsync(toProductPayload(values))
        : updateProductMutation.mutateAsync(toProductPayload(values)));
      toast.show({ variant: "success", label: isNew ? "Product created" : "Product updated" });
      router.back();
    } catch (error: unknown) {
      const hasFieldErrors = applyServerErrors(error);
      setError("root.server", {
        type: "server",
        message: hasFieldErrors ? "Check the highlighted fields." : getErrorMessage(error),
      });
      toast.show({
        variant: "danger",
        label: isNew ? "Could not create product" : "Could not update product",
        description: hasFieldErrors ? "Check the highlighted fields." : getErrorMessage(error),
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync();
      setIsDeleteOpen(false);
      toast.show({ variant: "success", label: "Product deleted" });
      router.back();
    } catch (error: unknown) {
      toast.show({
        variant: "danger",
        label: "Could not delete product",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New Product" : "Edit Product" }} />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={themeColorDanger}
            accessibilityLabel="Delete product"
            onPress={() => setIsDeleteOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <View className="flex-1 bg-background">
        <ScrollView
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
              onAddCategory={() => {
                clearCreatedCategory();
                router.push({
                  pathname: "/categories/[id]",
                  params: { id: "new", selectForProduct: "true" },
                });
              }}
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
        </ScrollView>
      </View>

      <DeleteProductDialog
        isOpen={isDeleteOpen}
        isDeleting={deleteProductMutation.isPending}
        onOpenChange={setIsDeleteOpen}
        onDelete={handleDelete}
      />
    </>
  );
}

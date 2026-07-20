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
  Dialog,
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
import { Controller, useForm, useWatch } from "react-hook-form";
import { Image, Platform, Pressable, ScrollView, View } from "react-native";
import { getToolbarIcon } from "@/utils/toolbarIcons";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import DialogCloseButton from "@/components/common/DialogCloseButton";
import { getErrorMessage, isApiError } from "@/api/ApiError";
import type { ProductImageAsset } from "@/api/endpoints/products";
import { useCategories } from "@/hooks/db/useCategories";
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
  type ProductFormPayload,
} from "@/hooks/db/useProducts";
import { productSchema, type ProductFormValues } from "@/schemas/product";

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
  const size =
    Platform.OS === "web"
      ? (await (await fetch(optimizedImage.uri)).blob()).size
      : (new File(optimizedImage.uri).size ?? 0);

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

function NumberField({
  label,
  placeholder,
  description,
  required,
  value,
  onChangeText,
  error,
}: {
  label: string;
  placeholder: string;
  description?: string;
  required?: boolean;
  value?: string;
  onChangeText?: (value: string) => void;
  error?: string;
}) {
  return (
    <TextField isRequired={required} isInvalid={!!error} className="min-w-[140px] flex-1">
      <Label>{label}</Label>
      <Input
        variant="secondary"
        placeholder={placeholder}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
      />
      {error ? (
        <Description className="text-danger">{error}</Description>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </TextField>
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

export default function ProductFormScreen(): React.JSX.Element {
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
  const categoryOptions = (categoriesQuery.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedProductId = React.useRef<string | null>(null);
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
      category_id: product.category_id ?? "",
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      code: product.code ?? "",
      stock_enabled: product.stock_enabled,
      stock: product.stock_enabled ? String(product.stock) : "",
      stock_alert: product.stock_alert === null ? "" : String(product.stock_alert),
      active: product.active,
      image: null,
    });
    hydratedProductId.current = product.id;
  }, [isNew, productQuery.data, reset]);

  if (!isNew && productQuery.isLoading) {
    return <LoadingState message="Loading product…" />;
  }

  if (!isNew && productQuery.isError) {
    return <ErrorState error={productQuery.error} onRetry={productQuery.refetch} />;
  }

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;
  const imageUri = imageAsset?.uri ?? (!isNew ? productQuery.data?.image_url : null);

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
          contentContainerClassName="items-center px-4 py-5 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-3xl gap-4">
            <Card className="overflow-hidden">
              <SectionHeading
                title="Product Details"
                description="Information customers see across your sales channels."
              />
              <Card.Body className="gap-4">
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field: { value, onChange } }) => (
                    <TextField isRequired isInvalid={!!errors.category_id}>
                      <Label>Category</Label>
                      <Select
                        value={categoryOptions.find((option) => option.value === value)}
                        onValueChange={(option) => onChange(option?.value ?? "")}
                        isDisabled={categoriesQuery.isLoading || categoriesQuery.isError}
                      >
                        <Select.Trigger>
                          <Select.Value placeholder="Select a category" numberOfLines={1} />
                          <Select.TriggerIndicator />
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Overlay />
                          <Select.Content presentation="popover" width="trigger">
                            {categoryOptions.map((option) => (
                              <Select.Item key={option.value} {...option} />
                            ))}
                          </Select.Content>
                        </Select.Portal>
                      </Select>
                      {categoriesQuery.isError ? (
                        <View className="flex-row items-center justify-between gap-3">
                          <Description className="flex-1 text-danger">
                            Categories could not be loaded.
                          </Description>
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => categoriesQuery.refetch()}
                          >
                            Retry
                          </Button>
                        </View>
                      ) : errors.category_id?.message ? (
                        <Description className="text-danger">
                          {errors.category_id.message}
                        </Description>
                      ) : categoriesQuery.isLoading ? (
                        <Description>Loading categories…</Description>
                      ) : categoryOptions.length === 0 ? (
                        <Description className="text-warning">
                          No active categories are available.
                        </Description>
                      ) : null}
                    </TextField>
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
                        {errors.description?.message ??
                          "Keep it concise and helpful for customers."}
                      </Description>
                    </TextField>
                  )}
                />
              </Card.Body>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading
                title="Product Image"
                description="Use a clear image with a square or landscape crop."
              />
              <Card.Body className="items-center pt-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose product image"
                  onPress={handleSelectImage}
                  className="aspect-[16/9] w-full items-center justify-center gap-3 overflow-hidden rounded-panel-inner bg-surface-secondary active:opacity-80"
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      className="h-full w-full"
                      resizeMode="contain"
                    />
                  ) : (
                    <>
                      <View className="size-14 items-center justify-center rounded-full bg-accent-soft">
                        <Ionicons name="image-outline" size={26} color={themeColorAccent} />
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

            <Card className="overflow-hidden">
              <SectionHeading title="Pricing" description="Set the product selling price." />
              <Card.Body className="gap-4">
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { value, onChange } }) => (
                    <NumberField
                      label="Price (Rp)"
                      placeholder="0"
                      required
                      value={value}
                      onChangeText={onChange}
                      error={errors.price?.message}
                    />
                  )}
                />
              </Card.Body>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading
                title="Inventory"
                description="Track this product by SKU and stock."
              />
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
                        <NumberField
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
                        <NumberField
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

            <Card className="overflow-hidden">
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

            <Card className="overflow-hidden">
              <Card.Header className="pb-2">
                <View className="gap-1">
                  <Card.Title>{isNew ? "Create Product" : "Save Product"}</Card.Title>
                  <Card.Description>
                    Review the product details before saving your changes.
                  </Card.Description>
                </View>
              </Card.Header>
              <Card.Footer className="pt-2">
                <View className="flex-1 gap-3">
                  {errors.root?.server?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {errors.root.server.message}
                    </Typography>
                  ) : null}
                  <View className="flex-row gap-3">
                    <Button variant="outline" onPress={() => router.back()} isDisabled={isSaving}>
                      <Button.Label>Cancel</Button.Label>
                    </Button>
                    <Button
                      className="flex-1"
                      onPress={handleSubmit(submitProduct)}
                      isDisabled={isSaving}
                    >
                      <Button.Label>
                        {isSaving ? "Saving…" : isNew ? "Create product" : "Save changes"}
                      </Button.Label>
                    </Button>
                  </View>
                </View>
              </Card.Footer>
            </Card>
          </View>
        </ScrollView>
      </View>

      <Dialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
            <DialogCloseButton />
            <View className="mb-5 gap-1.5 pr-10">
              <Dialog.Title>Delete product?</Dialog.Title>
              <Dialog.Description>
                This product will be permanently removed from the catalog.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsDeleteOpen(false)}
                isDisabled={deleteProductMutation.isPending}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={handleDelete}
                isDisabled={deleteProductMutation.isPending}
              >
                <Button.Label>
                  {deleteProductMutation.isPending ? "Deleting…" : "Delete"}
                </Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
import { Image, Pressable, ScrollView, View } from "react-native";
import { getToolbarIcon } from "@/utils/toolbarIcons";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import DialogCloseButton from "@/components/common/DialogCloseButton";
import { getErrorMessage } from "@/api/ApiError";
import type { ProductImageAsset } from "@/api/endpoints/products";
import { useCategories } from "@/hooks/db/useCategories";
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
  type ProductFormPayload,
} from "@/hooks/db/useProducts";

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
}: {
  label: string;
  placeholder: string;
  description?: string;
  required?: boolean;
  value?: string;
  onChangeText?: (value: string) => void;
}) {
  return (
    <TextField isRequired={required} className="min-w-[140px] flex-1">
      <Label>{label}</Label>
      <Input
        variant="secondary"
        placeholder={placeholder}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
      />
      {description ? <Description>{description}</Description> : null}
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
  const [category, setCategory] = React.useState<{ value: string; label: string } | undefined>();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [code, setCode] = React.useState("");
  const [stockQuantity, setStockQuantity] = React.useState("");
  const [stockAlert, setStockAlert] = React.useState("");
  const [stockEnabled, setStockEnabled] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [imageAsset, setImageAsset] = React.useState<ProductImageAsset | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedProductId = React.useRef<string | null>(null);

  React.useEffect(() => {
    const product = productQuery.data;
    if (isNew || !product || hydratedProductId.current === product.id) return;

    setCategory(
      product.category ? { value: product.category.id, label: product.category.name } : undefined
    );
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setCode(product.code ?? "");
    setStockEnabled(product.stock_enabled);
    setStockQuantity(product.stock_enabled ? String(product.stock) : "");
    setStockAlert(product.stock_alert === null ? "" : String(product.stock_alert));
    setIsActive(product.active);
    hydratedProductId.current = product.id;
  }, [isNew, productQuery.data]);

  if (!isNew && productQuery.isLoading) {
    return <LoadingState message="Loading product…" />;
  }

  if (!isNew && productQuery.isError) {
    return <ErrorState error={productQuery.error} onRetry={productQuery.refetch} />;
  }

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;
  const imageUri = imageAsset?.uri ?? (!isNew ? productQuery.data?.image_url : null);

  const showValidationError = (message: string) => {
    toast.show({ variant: "warning", label: "Check product details", description: message });
  };

  const buildPayload = (): ProductFormPayload | null => {
    const normalizedName = name.trim();
    const normalizedCode = code.trim();
    const parsedPrice = Number(price);
    const parsedStock = stockEnabled ? Number(stockQuantity) : null;
    const parsedStockAlert = stockEnabled && stockAlert.trim() ? Number(stockAlert) : null;

    if (!category) {
      showValidationError("Select a category.");
      return null;
    }
    if (!normalizedName) {
      showValidationError("Enter a product name.");
      return null;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showValidationError("Enter a valid price.");
      return null;
    }
    if (
      stockEnabled &&
      (parsedStock === null || !Number.isInteger(parsedStock) || parsedStock < 0)
    ) {
      showValidationError("Available stock must be a whole number of zero or more.");
      return null;
    }
    if (
      stockEnabled &&
      parsedStockAlert !== null &&
      (!Number.isInteger(parsedStockAlert) || parsedStockAlert < 0)
    ) {
      showValidationError("Low-stock alert must be a whole number of zero or more.");
      return null;
    }

    return {
      values: {
        name: normalizedName,
        code: normalizedCode || null,
        category_id: category.value,
        description: description.trim() || null,
        price: parsedPrice,
        stock_enabled: stockEnabled,
        stock: stockEnabled ? parsedStock : null,
        stock_alert: stockEnabled ? parsedStockAlert : null,
        active: isActive,
      },
      image: imageAsset,
    };
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
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      showValidationError("Choose an image smaller than 5 MB.");
      return;
    }
    setImageAsset({
      uri: asset.uri,
      name: asset.fileName ?? "product-" + Date.now() + ".jpg",
      type: asset.mimeType ?? "image/jpeg",
    });
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      await (isNew
        ? createProductMutation.mutateAsync(payload)
        : updateProductMutation.mutateAsync(payload));
      toast.show({ variant: "success", label: isNew ? "Product created" : "Product updated" });
      router.back();
    } catch (error: unknown) {
      toast.show({
        variant: "danger",
        label: isNew ? "Could not create product" : "Could not update product",
        description: getErrorMessage(error),
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
                <TextField isRequired>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
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
                </TextField>

                <TextField isRequired>
                  <Label>Product name</Label>
                  <Input
                    variant="secondary"
                    placeholder="e.g. Mushroom & Swiss Burger"
                    value={name}
                    onChangeText={setName}
                  />
                </TextField>

                <TextField>
                  <Label>Description</Label>
                  <TextArea
                    variant="secondary"
                    placeholder="Describe the product, ingredients, or serving notes"
                    className="min-h-24"
                    value={description}
                    onChangeText={setDescription}
                  />
                  <Description>Keep it concise and helpful for customers.</Description>
                </TextField>
              </Card.Body>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading
                title="Product Image"
                description="Use a clear image with a square or landscape crop."
              />
              <Card.Body className="pt-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose product image"
                  onPress={handleSelectImage}
                  className="aspect-[4/3] max-h-72 items-center justify-center gap-3 overflow-hidden rounded-panel-inner bg-surface-secondary active:opacity-80"
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      className="h-full w-full"
                      resizeMode="cover"
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
                          PNG or JPG, up to 5 MB
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
                <NumberField
                  label="Price (Rp)"
                  placeholder="0"
                  required
                  value={price}
                  onChangeText={setPrice}
                />
              </Card.Body>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading
                title="Inventory"
                description="Track this product by SKU and stock."
              />
              <Card.Body className="gap-4">
                <TextField>
                  <Label>Code / SKU</Label>
                  <Input
                    variant="secondary"
                    placeholder="e.g. 88551340"
                    autoCapitalize="characters"
                    value={code}
                    onChangeText={setCode}
                  />
                  <Description>Optional stock keeping unit</Description>
                </TextField>
                <Separator />
                <ToggleRow
                  title="Track stock"
                  description="Keep an inventory count for this product."
                  isSelected={stockEnabled}
                  onSelectedChange={setStockEnabled}
                />
                {stockEnabled ? (
                  <View className="flex-row flex-wrap gap-3">
                    <NumberField
                      label="Available stock"
                      placeholder="0"
                      required
                      value={stockQuantity}
                      onChangeText={setStockQuantity}
                    />
                    <NumberField
                      label="Low-stock alert"
                      placeholder="Optional"
                      description="Notify when stock reaches this amount."
                      value={stockAlert}
                      onChangeText={setStockAlert}
                    />
                  </View>
                ) : null}
              </Card.Body>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading title="Availability" />
              <Card.Body className="gap-4">
                <ToggleRow
                  title="Active"
                  description="Show this product on all sales channels."
                  isSelected={isActive}
                  onSelectedChange={setIsActive}
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
              <Card.Footer className="flex-row gap-3 pt-2">
                <Button variant="outline" onPress={() => router.back()} isDisabled={isSaving}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button className="flex-1" onPress={handleSubmit} isDisabled={isSaving}>
                  <Button.Label>
                    {isSaving ? "Saving…" : isNew ? "Create product" : "Save changes"}
                  </Button.Label>
                </Button>
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

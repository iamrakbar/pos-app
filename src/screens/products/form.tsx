import { Ionicons } from "@expo/vector-icons";
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
} from "heroui-native";
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { getToolbarIcon } from "@/utils/toolbarIcons";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { useCategories } from "@/hooks/db/useCategories";
import { useProduct, useProductsRaw } from "@/hooks/db/useProducts";
import { formatRupiah } from "@/utils/format";

const CATEGORY_OPTIONS = [
  { value: "main-courses", label: "Main Courses" },
  { value: "beverages", label: "Beverages" },
  { value: "desserts", label: "Desserts" },
];

const DISCOUNT_OPTIONS = [
  { value: "flash-sale", label: "Flash Sale 13%" },
  { value: "member", label: "Member Discount 10%" },
  { value: "none", label: "No discount" },
];

const ADD_ON_GROUPS = [
  { id: "toppings", name: "Extra Toppings", rule: "Optional · Max 3", options: 4 },
  { id: "sides", name: "Sides", rule: "Optional · Max 2", options: 2 },
  { id: "sauce", name: "Extra Sauce", rule: "Optional · Max 2", options: 4 },
];

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header>
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
  const [themeColorMuted, themeColorAccent, themeColorDanger] = useThemeColor([
    "muted",
    "accent",
    "danger",
  ]);
  const isNew = id === "new";
  const productQuery = useProduct(id);
  const productsQuery = useProductsRaw();
  const categoriesQuery = useCategories();
  const selectedPosProduct = productsQuery.data?.find((product) => product.id === id) ?? null;
  const categoryOptions = (categoriesQuery.data ?? []).map((item) => ({
    value: item.id,
    label: item.name,
  }));
  const [category, setCategory] = React.useState<{ value: string; label: string } | undefined>();
  const [discountSelection, setDiscountSelection] = React.useState<
    { value: string; label: string } | undefined
  >();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [code, setCode] = React.useState("");
  const [stockQuantity, setStockQuantity] = React.useState("");
  const [stockEnabled, setStockEnabled] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [preOrderEnabled, setPreOrderEnabled] = React.useState(false);
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
    setIsActive(product.active);
    setPreOrderEnabled(selectedPosProduct?.is_po ?? false);
    hydratedProductId.current = product.id;
  }, [isNew, productQuery.data, selectedPosProduct]);

  if (!isNew && (productQuery.isLoading || productsQuery.isLoading)) {
    return <LoadingState message="Loading product…" />;
  }

  if (!isNew && productQuery.isError) {
    return <ErrorState error={productQuery.error} onRetry={productQuery.refetch} />;
  }

  const currentDiscount = selectedPosProduct?.discount
    ? {
        value: "current-discount",
        label:
          selectedPosProduct.discount.unit === "percentage"
            ? `Discount ${selectedPosProduct.discount.value ?? 0}%`
            : `Discount ${formatRupiah(selectedPosProduct.discount.value ?? 0)}`,
      }
    : DISCOUNT_OPTIONS.find((option) => option.value === "none");
  const discount = discountSelection ?? currentDiscount;
  const discountOptions =
    discount?.value === "current-discount"
      ? [
          discount,
          ...DISCOUNT_OPTIONS.filter((option) => option.value !== "none"),
          DISCOUNT_OPTIONS[2],
        ]
      : DISCOUNT_OPTIONS;
  const addOnGroups = selectedPosProduct?.add_ons ?? (isNew ? ADD_ON_GROUPS : []);
  const discountedPrice = selectedPosProduct?.discount?.price ?? null;
  const preOrderAvailability = selectedPosProduct?.po_availability
    ? `${selectedPosProduct.po_availability.value} ${selectedPosProduct.po_availability.unit ?? ""}`.trim()
    : "";

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New Product" : "Edit Product" }} />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={themeColorDanger}
            accessibilityLabel="Delete product"
            onPress={() => {}}
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
            <Card>
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
                        {(categoryOptions.length > 0 ? categoryOptions : CATEGORY_OPTIONS).map(
                          (option) => (
                            <Select.Item key={option.value} {...option} />
                          )
                        )}
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

            <Card>
              <SectionHeading
                title="Product Image"
                description="Use a clear image with a square or landscape crop."
              />
              <Card.Body>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose product image"
                  onPress={() => {}}
                  className="aspect-[4/3] max-h-72 items-center justify-center gap-3 overflow-hidden rounded-panel-inner bg-surface-secondary active:opacity-80"
                >
                  {!isNew && productQuery.data?.image_url ? (
                    <Image
                      source={{ uri: productQuery.data.image_url }}
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
            </Card>

            <Card>
              <SectionHeading title="Pricing" description="Set the selling price and promotion." />
              <Card.Body className="gap-4">
                <NumberField
                  label="Price (Rp)"
                  placeholder="0"
                  required
                  value={price}
                  onChangeText={setPrice}
                />

                <View className="rounded-panel-inner bg-surface-secondary p-3 gap-0.5">
                  <Typography type="body-xs" color="muted">
                    Discounted price
                  </Typography>
                  <Typography type="body" weight="semibold" className="tabular-nums">
                    {discountedPrice === null ? "—" : formatRupiah(discountedPrice)}
                  </Typography>
                </View>

                <TextField>
                  <Label>Discount</Label>
                  <Select value={discount} onValueChange={setDiscountSelection}>
                    <Select.Trigger>
                      <Select.Value placeholder="Select an optional discount" numberOfLines={1} />
                      <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Overlay />
                      <Select.Content presentation="popover" width="trigger">
                        {discountOptions.map((option) => (
                          <Select.Item key={option.value} {...option} />
                        ))}
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                  <Description>The discounted price will be calculated automatically.</Description>
                </TextField>
              </Card.Body>
            </Card>

            <Card>
              <SectionHeading
                title="Dimensions"
                description="Used for product handling and fulfillment."
              />
              <Card.Body className="gap-4">
                <View className="flex-row flex-wrap gap-3">
                  <NumberField label="Length (cm)" placeholder="0" required />
                  <NumberField label="Width (cm)" placeholder="0" required />
                </View>
                <View className="flex-row flex-wrap gap-3">
                  <NumberField label="Height (cm)" placeholder="0" required />
                  <NumberField label="Weight (g)" placeholder="0" required />
                </View>
              </Card.Body>
            </Card>

            <Card>
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
                  <Description>Stock Keeping Unit</Description>
                </TextField>
                <Separator />
                <ToggleRow
                  title="Track stock"
                  description="Keep an inventory count for this product."
                  isSelected={stockEnabled}
                  onSelectedChange={setStockEnabled}
                />
                {stockEnabled ? (
                  <NumberField
                    label="Available stock"
                    placeholder="0"
                    required
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                  />
                ) : null}
              </Card.Body>
            </Card>

            <Card>
              <SectionHeading title="Availability" />
              <Card.Body className="gap-4">
                <ToggleRow
                  title="Active"
                  description="Show this product on all sales channels."
                  isSelected={isActive}
                  onSelectedChange={setIsActive}
                />
                <Separator />
                <ToggleRow
                  title="Pre-order"
                  description="Allow customers to order before this product is available."
                  isSelected={preOrderEnabled}
                  onSelectedChange={setPreOrderEnabled}
                />
                {preOrderEnabled ? (
                  <TextField isRequired>
                    <Label>Available from</Label>
                    <Input
                      variant="secondary"
                      placeholder="Select date and time"
                      value={preOrderAvailability}
                      editable={false}
                    />
                  </TextField>
                ) : null}
              </Card.Body>
            </Card>

            <Card className="p-0 overflow-hidden">
              <View className="flex-row items-center gap-3 p-4">
                <View className="flex-1 gap-1">
                  <Card.Title>Add-on Groups</Card.Title>
                  <Card.Description>
                    Optional choices customers can add to this product.
                  </Card.Description>
                </View>
                <Button size="sm" variant="outline" onPress={() => {}}>
                  <Ionicons name="add" size={16} color={themeColorAccent} />
                  <Button.Label>Add group</Button.Label>
                </Button>
              </View>
              <Separator />
              {addOnGroups.map((group, index) => (
                <View key={group.id}>
                  <Pressable className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-secondary">
                    <View className="flex-1 gap-0.5">
                      <Typography type="body-sm" weight="semibold">
                        {group.name}
                      </Typography>
                      <Typography type="body-xs" color="muted">
                        {"rule" in group
                          ? group.rule
                          : `${group.required ? "Required" : "Optional"} · Max ${group.max}`}{" "}
                        · {Array.isArray(group.options) ? group.options.length : group.options}{" "}
                        options
                      </Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themeColorMuted} />
                  </Pressable>
                  {index < addOnGroups.length - 1 ? <Separator className="mx-4" /> : null}
                </View>
              ))}
            </Card>

            <View className="flex-row gap-3 pt-2">
              <Button variant="outline" onPress={() => router.back()}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button className="flex-1" onPress={() => {}}>
                <Button.Label>{isNew ? "Create product" : "Save changes"}</Button.Label>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

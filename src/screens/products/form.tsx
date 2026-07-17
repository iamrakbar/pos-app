import { useProduct } from "@/hooks/db/useProducts";
import { useCategories } from "@/hooks/db/useCategories";
import { productSchema, type ProductFormValues } from "@/schemas/product";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  Input,
  Select,
  Separator,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { AddOnGroup } from "@/types/pos";
import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addonConstraintLabel(group: AddOnGroup): string {
  if (!group.required) {
    return `Optional${group.max > 0 ? `, max ${group.max}` : ""}`;
  }
  return `Required · min ${group.min}, max ${group.max}`;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Typography type="body-sm" weight="semibold">
      {label}
      {required && <Typography className="text-danger"> *</Typography>}
    </Typography>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Typography type="body-xs" className="text-danger mt-0.5">
      {message}
    </Typography>
  );
}

type ProcessedImage = { imageUrl: string; thumbnailUrl: string };

async function pickAndProcess(source: "library" | "camera"): Promise<ProcessedImage | null> {
  let rawUri: string | null = null;

  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to take photos.");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    rawUri = result.canceled ? null : result.assets[0].uri;
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Photo library access is needed to select images.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    rawUri = result.canceled ? null : result.assets[0].uri;
  }

  if (!rawUri) return null;

  const [full, thumb] = await Promise.all([
    manipulateAsync(rawUri, [{ resize: { width: 1200 } }], {
      compress: 0.8,
      format: SaveFormat.JPEG,
    }),
    manipulateAsync(rawUri, [{ resize: { width: 200 } }], {
      compress: 0.75,
      format: SaveFormat.JPEG,
    }),
  ]);

  const imagesDir = new Directory(Paths.document, "product-images");
  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true });
  }

  const ts = Date.now();
  const fullDest = new File(imagesDir, `${ts}_full.jpg`);
  const thumbDest = new File(imagesDir, `${ts}_thumb.jpg`);

  await Promise.all([new File(full.uri).move(fullDest), new File(thumb.uri).move(thumbDest)]);

  return { imageUrl: fullDest.uri, thumbnailUrl: thumbDest.uri };
}

function ImagePickerField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (result: ProcessedImage | null) => void;
}) {
  const [themeColorMuted, themeColorAccentSoftForeground] = useThemeColor([
    "muted",
    "accent-soft-foreground",
  ]);

  const openPicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Choose from Library", "Take Photo"],
          cancelButtonIndex: 0,
        },
        async (idx) => {
          if (idx === 1) onChange(await pickAndProcess("library"));
          if (idx === 2) onChange(await pickAndProcess("camera"));
        }
      );
    } else {
      Alert.alert("Product Image", "Choose a source", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose from Library",
          onPress: async () => onChange(await pickAndProcess("library")),
        },
        { text: "Take Photo", onPress: async () => onChange(await pickAndProcess("camera")) },
      ]);
    }
  };

  return (
    <Pressable onPress={openPicker} className="active:opacity-80">
      <View className="w-full aspect-video rounded-panel overflow-hidden bg-surface-secondary">
        {value ? (
          <>
            <Image source={{ uri: value }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute inset-0 items-end justify-end p-3">
              <View className="bg-black/50 rounded-full p-2">
                <Ionicons name="camera" size={18} color="white" />
              </View>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-3">
            <View className="w-16 h-16 rounded-full bg-accent-soft items-center justify-center">
              <Ionicons name="camera-outline" size={28} color={themeColorAccentSoftForeground} />
            </View>
            <View className="items-center gap-1">
              <Typography type="body-sm" weight="medium">
                Add product image
              </Typography>
              <Typography type="body-xs" color="muted">
                Tap to choose from library or camera
              </Typography>
            </View>
            <View className="flex-row gap-3 mt-1">
              <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-tertiary">
                <Ionicons name="images-outline" size={14} color={themeColorMuted} />
                <Typography type="body-xs" color="muted">
                  Library
                </Typography>
              </View>
              <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-tertiary">
                <Ionicons name="camera-outline" size={14} color={themeColorMuted} />
                <Typography type="body-xs" color="muted">
                  Camera
                </Typography>
              </View>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "url";
  multiline?: boolean;
  error?: boolean;
}) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType ?? "default"}
      multiline={multiline}
      isInvalid={error}
      variant="secondary"
      className={multiline ? "min-h-20 py-3" : undefined}
      textAlignVertical={multiline ? "top" : "center"}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProductFormScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [themeColorMuted, themeColorAccent, themeColorDanger] = useThemeColor([
    "muted",
    "accent",
    "danger",
  ]);
  const isNew = id === "new";

  const { data: existingProduct } = useProduct(id);
  const { data: categoriesList = [] } = useCategories();

  const [addOnGroups, setAddOnGroups] = React.useState<AddOnGroup[]>([]);
  const [expandedGroupId, setExpandedGroupId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (existingProduct) {
      setAddOnGroups(existingProduct.add_ons);
    }
  }, [existingProduct]);

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: existingProduct?.name ?? "",
      price: existingProduct?.price ?? 0,
      original_price: existingProduct?.original_price ?? null,
      image_url: existingProduct?.image_url ?? null,
      thumbnail_url: existingProduct?.thumbnail_url ?? null,
      category_id: existingProduct?.category_id ?? null,
      is_active: existingProduct?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");
  const watchedCategoryId = watch("category_id");

  const selectedCategory = categoriesList.find((c) => c.id === watchedCategoryId);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Typography.Heading type="h4">{isNew ? "New Product" : "Edit Product"}</Typography.Heading>

        <View className="rounded-xl bg-warning/10 border border-warning/30 px-3 py-2.5">
          <Typography type="body-xs" className="text-warning-foreground">
            Product editing is not yet connected to the live API — changes here won&apos;t be saved.
          </Typography>
        </View>

        {/* ── Image picker ── */}
        <Controller
          control={control}
          name="image_url"
          render={({ field }) => (
            <ImagePickerField
              value={field.value}
              onChange={(result) => {
                field.onChange(result?.imageUrl ?? null);
                setValue("thumbnail_url", result?.thumbnailUrl ?? null);
              }}
            />
          )}
        />

        {/* ── Basic info ── */}
        <Card>
          <Card.Header>
            <Card.Title>Basic Info</Card.Title>
          </Card.Header>
          <Card.Body className="gap-4">
            {/* Name */}
            <View className="gap-1.5">
              <FieldLabel label="Product name" required />
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <StyledInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="e.g. Grilled Salmon"
                    error={!!errors.name}
                  />
                )}
              />
              <FieldError message={errors.name?.message} />
            </View>

            {/* Category */}
            <View className="gap-1.5">
              <FieldLabel label="Category" />
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={
                      selectedCategory
                        ? { value: selectedCategory.id, label: selectedCategory.name }
                        : undefined
                    }
                    onValueChange={(opt) => field.onChange(opt?.value ?? null)}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select category" numberOfLines={1} />
                      <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Overlay />
                      <Select.Content presentation="popover" width="trigger">
                        <Select.Item value="" label="No category" />
                        {categoriesList.map((cat) => (
                          <Select.Item key={cat.id} value={cat.id} label={cat.name} />
                        ))}
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                )}
              />
            </View>

            {/* Price row */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <FieldLabel label="Price (Rp)" required />
                <Controller
                  control={control}
                  name="price"
                  render={({ field }) => (
                    <StyledInput
                      value={field.value === 0 ? "" : String(field.value)}
                      onChangeText={field.onChange}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      error={!!errors.price}
                    />
                  )}
                />
                <FieldError message={errors.price?.message} />
              </View>

              <View className="flex-1 gap-1.5">
                <FieldLabel label="Original price (Rp)" />
                <Controller
                  control={control}
                  name="original_price"
                  render={({ field }) => (
                    <StyledInput
                      value={field.value == null ? "" : String(field.value)}
                      onChangeText={(v) => field.onChange(v === "" ? null : v)}
                      placeholder="Kosongkan jika tidak diskon"
                      keyboardType="decimal-pad"
                      error={!!errors.original_price}
                    />
                  )}
                />
              </View>
            </View>

            {/* Active toggle */}
            <View className="flex-row items-center justify-between">
              <View className="gap-0.5">
                <Typography type="body-sm" weight="medium">
                  Active
                </Typography>
                <Typography type="body-xs" color="muted">
                  {isActive ? "Product is visible on POS" : "Product is hidden from POS"}
                </Typography>
              </View>
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Switch isSelected={field.value} onSelectedChange={field.onChange} />
                )}
              />
            </View>
          </Card.Body>
        </Card>

        {/* ── Add-on groups ── */}
        <Card>
          <Card.Header>
            <View className="flex-row items-center justify-between">
              <View>
                <Card.Title>Add-on Groups</Card.Title>
                <Card.Description>
                  {addOnGroups.length === 0
                    ? "No add-on groups yet"
                    : `${addOnGroups.length} group${addOnGroups.length !== 1 ? "s" : ""}`}
                </Card.Description>
              </View>
              <Pressable
                className="flex-row items-center gap-1 active:opacity-70"
                onPress={() => {
                  /* no-op */
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={themeColorAccent} />
                <Typography type="body-sm" className="text-accent">
                  Add group
                </Typography>
              </Pressable>
            </View>
          </Card.Header>

          {addOnGroups.length > 0 && (
            <Card.Body className="gap-0 p-0">
              {addOnGroups.map((group, index) => {
                const isExpanded = expandedGroupId === group.id;
                return (
                  <View key={group.id}>
                    {index > 0 && <Separator />}
                    <Pressable
                      onPress={() => setExpandedGroupId(isExpanded ? null : group.id)}
                      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-secondary"
                    >
                      <View className="flex-1 gap-0.5">
                        <Typography type="body-sm" weight="semibold">
                          {group.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                          {addonConstraintLabel(group)} · {group.options.length} option
                          {group.options.length !== 1 ? "s" : ""}
                        </Typography>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pressable onPress={() => {}} className="p-1.5 active:opacity-70">
                          <Ionicons name="pencil-outline" size={16} color={themeColorMuted} />
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setAddOnGroups((prev) => prev.filter((g) => g.id !== group.id))
                          }
                          className="p-1.5 active:opacity-70"
                        >
                          <Ionicons name="trash-outline" size={16} color={themeColorDanger} />
                        </Pressable>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={themeColorMuted}
                        />
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View className="bg-surface-secondary px-4 pb-3 gap-1">
                        {group.options.map((opt) => (
                          <View
                            key={opt.id}
                            className="flex-row items-center justify-between py-1.5"
                          >
                            <Typography type="body-sm">{opt.name}</Typography>
                            <Typography type="body-sm" weight="semibold" className="tabular-nums">
                              {opt.price === 0 ? "Free" : `+${formatRupiah(opt.price)}`}
                            </Typography>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </Card.Body>
          )}
        </Card>
      </ScrollView>

      {/* ── Footer actions ── */}
      <View className="flex-row gap-3 bg-surface p-4 border-t border-border">
        <Button variant="outline" onPress={() => router.back()}>
          Cancel
        </Button>
        <Button className="flex-1" isDisabled>
          <Ionicons name="checkmark-outline" size={16} color="white" />
          <Button.Label className="ml-1.5">
            {isNew ? "Create product" : "Save changes"}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

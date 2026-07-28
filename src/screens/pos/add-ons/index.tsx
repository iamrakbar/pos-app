import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { createAddOnSchema, type AddOnFormValues } from "@/schemas/addon";
import type { AddOnGroup, AddOnOption } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  RadioGroup,
  Separator,
  Typography,
  TextArea,
  Surface,
  ControlField,
  Label,
  FieldError,
  Description,
  useThemeColor,
} from "heroui-native";
import type { JSX } from "react";
import { FlatList, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useForm, Controller, type Control } from "react-hook-form";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

function constraintLabel(group: AddOnGroup): string {
  if (!group.required) {
    return `Opsional${group.max > 0 ? `, maks. ${group.max}` : ""}`;
  }
  return `Wajib, min. ${group.min}, pilih ${group.max}`;
}

function optionLabel(option: AddOnOption): string {
  if (option.price === 0) return `${option.name} +Rp0`;
  return `${option.name} +${formatRupiah(option.price)}`;
}

type AddOnSelectionControlProps = {
  control: Control<AddOnFormValues>;
  group: AddOnGroup;
};

function AddOnRadioGroup({ control, group }: AddOnSelectionControlProps): JSX.Element {
  const options = group.options.map((option) => ({ ...option, label: optionLabel(option) }));

  return (
    <Controller
      control={control}
      name={`radioSelections.${group.id}`}
      render={({ field }) => (
        <ControlField>
          <Surface className="py-5 w-full">
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange}>
              {options.map((option, index) => (
                <React.Fragment key={option.id}>
                  {index > 0 && <Separator className="my-1" />}
                  <RadioGroup.Item value={option.id}>{option.label}</RadioGroup.Item>
                </React.Fragment>
              ))}
            </RadioGroup>
          </Surface>
        </ControlField>
      )}
    />
  );
}

function AddOnCheckboxGroup({ control, group }: AddOnSelectionControlProps): JSX.Element {
  const options = group.options.map((option) => ({ ...option, label: optionLabel(option) }));

  return (
    <Controller
      control={control}
      name={`checkboxSelections.${group.id}`}
      render={({ field }) => {
        const selected: string[] = field.value ?? [];
        const selectedIds = new Set(selected);
        return (
          <Surface className="py-5 w-full">
            {options.map((option, index) => {
              const isSelected = selectedIds.has(option.id);
              const maxReached = !isSelected && selected.length >= group.max;
              return (
                <React.Fragment key={option.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <ControlField
                    isSelected={isSelected}
                    isDisabled={maxReached}
                    onSelectedChange={() => {
                      const next = isSelected
                        ? selected.filter((id) => id !== option.id)
                        : [...selected, option.id];
                      field.onChange(next);
                    }}
                  >
                    <View className="flex-1">
                      <Label>{option.label}</Label>
                    </View>
                    <ControlField.Indicator>
                      <Checkbox className="mt-0.5" />
                    </ControlField.Indicator>
                  </ControlField>
                </React.Fragment>
              );
            })}
          </Surface>
        );
      }}
    />
  );
}

export default function AddOnScreen(): JSX.Element {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const product = usePOSStore((s) => s.selectedProduct);
  const editingCartItemId = usePOSStore((s) => s.editingCartItemId);
  const clearAddonSelection = usePOSStore((s) => s.clearAddonSelection);

  const editingCartItem = useCartStore((s) =>
    editingCartItemId ? s.products.find((item) => item.id === editingCartItemId) : undefined
  );
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = createAddOnSchema(product?.add_ons ?? []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddOnFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { radioSelections: {}, checkboxSelections: {}, notes: "" },
  });

  useEffect(() => {
    if (editingCartItemId && product) {
      const existing = editingCartItem;
      if (existing) {
        const radioSelections: Record<string, string> = {};
        const checkboxSelections: Record<string, string[]> = {};
        existing.add_ons.forEach((ao) => {
          const group = product.add_ons.find((g) => g.id === ao.id);
          if (!group) return;
          if (group.multiple) {
            checkboxSelections[ao.id] = ao.options.map((o) => o.id);
          } else {
            const first = ao.options[0];
            if (first) radioSelections[ao.id] = first.id;
          }
        });
        reset({ radioSelections, checkboxSelections, notes: existing.notes ?? "" });
      }
      return;
    }
    reset({ radioSelections: {}, checkboxSelections: {}, notes: "" });
  }, [editingCartItemId, editingCartItem, product, reset]);

  useEffect(
    () => () => {
      clearAddonSelection();
    },
    [clearAddonSelection]
  );

  const buildCartAddOns = (values: AddOnFormValues) => {
    if (!product) return [];

    return product.add_ons.flatMap((group) => {
      const selectedOptionIds = new Set(
        group.multiple
          ? (values.checkboxSelections[group.id] ?? [])
          : values.radioSelections[group.id]
            ? [values.radioSelections[group.id]]
            : []
      );
      const options = group.options.filter((option) => selectedOptionIds.has(option.id));
      return options.length > 0 ? [{ id: group.id, name: group.name, options }] : [];
    });
  };

  const onSubmit = (values: AddOnFormValues) => {
    if (!product) return;

    setSubmitError(null);
    const addOns = buildCartAddOns(values);
    if (editingCartItemId) removeItem(editingCartItemId);
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      qty: editingCartItem?.qty ?? 1,
      notes: values.notes.trim() || null,
      add_ons: addOns,
    });
    clearAddonSelection();
    router.back();
  };

  const onInvalid = () => {
    setSubmitError("Lengkapi pilihan add-on yang wajib diisi sebelum menambahkan produk.");
  };

  const handleCancel = () => {
    setSubmitError(null);
    clearAddonSelection();
    router.back();
  };

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-5">
        <Typography type="body-sm" color="muted">
          Product add-ons are no longer available.
        </Typography>
        <Button variant="outline" onPress={() => router.back()}>
          Back
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 overflow-hidden bg-background pb-safe">
      <View className="flex-row items-center justify-between gap-3 bg-surface p-4">
        <View className="flex-1">
          <Typography type="h4" weight="semibold" numberOfLines={1}>
            {product.name}
          </Typography>
          <Typography className="text-sm text-muted-foreground">
            {formatRupiah(product.price)}
          </Typography>
        </View>
        <Button
          variant="ghost"
          isIconOnly
          onPress={handleCancel}
          accessibilityLabel="Close add-on selection"
        >
          <Ionicons name="close" size={20} color={foreground} />
        </Button>
      </View>

      <Separator />

      <FlatList
        className="flex-1"
        data={product.add_ons}
        keyExtractor={(group) => group.id}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-4 gap-6 bg-background"
        ListHeaderComponent={
          submitError ? (
            <View className="flex-row items-start gap-3 rounded-lg border border-danger bg-danger/10 px-3 py-3">
              <Typography className="text-sm text-danger flex-1">{submitError}</Typography>
            </View>
          ) : null
        }
        renderItem={({ item: group }) => (
          <View className="gap-2">
            <View className="flex-row items-center justify-between gap-2">
              <Label isRequired={group.required}>
                <Label.Text>{group.name}</Label.Text>
              </Label>
              <Description>{constraintLabel(group)}</Description>
            </View>
            {!group.multiple ? (
              <AddOnRadioGroup control={control} group={group} />
            ) : (
              <AddOnCheckboxGroup control={control} group={group} />
            )}
            <FieldError
              isInvalid={
                !!(errors.radioSelections?.[group.id] || errors.checkboxSelections?.[group.id])
              }
            >
              {errors.radioSelections?.[group.id]?.message ??
                errors.checkboxSelections?.[group.id]?.message}
            </FieldError>
          </View>
        )}
        ListFooterComponent={
          <View className="gap-2">
            <Typography className="text-sm font-semibold text-foreground">Catatan</Typography>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextArea
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder=""
                  className="min-h-20"
                />
              )}
            />
          </View>
        }
      />

      <Separator />

      <View className="flex-row gap-3 bg-surface px-5 py-4">
        <Button variant="outline" onPress={handleCancel}>
          Batal
        </Button>
        <Button className="flex-1" onPress={handleSubmit(onSubmit, onInvalid)}>
          {editingCartItemId ? "Simpan perubahan" : "Tambahkan ke keranjang"}
        </Button>
      </View>
    </View>
  );
}

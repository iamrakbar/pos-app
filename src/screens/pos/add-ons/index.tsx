import { buildCartAddOns } from "@/utils/add-on-selection";
import {
  Checkbox as PanelCheckbox,
  Textarea as PanelTextarea,
  Typography as PanelTypography,
  Chip as PanelChip,
  Button,
  Surface,
  Separator,
  RadioGroup as PanelRadioGroup,
  Alert,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { POS_ADD_ON_SHEET_NAME } from "@/hooks/use-pos-add-on-sheet";
import { createAddOnSchema, type AddOnFormValues } from "@/schemas/addon";
import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import type { AddOnGroup } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrueSheet, useTrueSheet } from "@lodev09/react-native-true-sheet";
import React from "react";
import { Controller, type Control, useForm, useWatch } from "react-hook-form";
import { FlatList, View, useWindowDimensions } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import type { Translate } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { getProductSellingPrice } from "@/utils/product-price";

const EMPTY_FORM_VALUES: AddOnFormValues = {
  radioSelections: {},
  checkboxSelections: {},
  notes: "",
};

function constraintLabel(group: AddOnGroup, t: Translate): string {
  if (!group.required) {
    return group.max > 0 ? t("addOns.optionalUpTo", { count: group.max }) : t("addOns.optional");
  }
  if (group.min === group.max) return t("addOns.chooseCount", { count: group.min });
  return t("addOns.chooseRange", { min: group.min, max: group.max });
}

type AddOnSelectionProps = {
  control: Control<AddOnFormValues>;
  group: AddOnGroup;
};

function AddOnSelection({ control, group }: AddOnSelectionProps): React.JSX.Element {
  const { t } = useTranslation();
  if (!group.multiple) {
    return (
      <Controller
        control={control}
        name={`radioSelections.${group.id}`}
        render={({ field }) => (
          <PanelRadioGroup
            value={field.value}
            onValueChange={field.onChange}
            variant="card"
            className="gap-2"
          >
            {group.options.map((option) => (
              <PanelRadioGroup.Item
                key={option.id}
                value={option.id}
                label={`${option.name} · ${
                  option.price > 0
                    ? `+${formatRupiah(option.price)}`
                    : t("addOns.noAdditionalCharge")
                }`}
                className="min-h-15 px-4 py-3"
              />
            ))}
          </PanelRadioGroup>
        )}
      />
    );
  }

  return (
    <Controller
      control={control}
      name={`checkboxSelections.${group.id}`}
      render={({ field }) => {
        const selected = field.value ?? [];
        const selectedIds = new Set(selected);
        const hasLimit = group.max > 0;

        return (
          <Surface padding="none" className="w-full overflow-hidden">
            {group.options.map((option, index) => {
              const isSelected = selectedIds.has(option.id);
              const isDisabled = !isSelected && hasLimit && selected.length >= group.max;

              return (
                <React.Fragment key={option.id}>
                  {index > 0 ? <Separator /> : null}
                  <PanelCheckbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() =>
                      field.onChange(
                        isSelected
                          ? selected.filter((id) => id !== option.id)
                          : [...selected, option.id]
                      )
                    }
                    label={option.name}
                    description={
                      option.price > 0
                        ? `+${formatRupiah(option.price)}`
                        : t("addOns.noAdditionalCharge")
                    }
                    size="lg"
                  />
                </React.Fragment>
              );
            })}
          </Surface>
        );
      }}
    />
  );
}

export default function POSAddOnSheet(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { dismiss, resize } = useTrueSheet();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [backgroundColor, borderColor] = useCSSVariable([
    "--color-background",
    "--color-border",
  ]) as [string, string];
  const product = usePOSStore((state) => state.selectedProduct);
  const editingCartItemId = usePOSStore((state) => state.editingCartItemId);
  const clearAddonSelection = usePOSStore((state) => state.clearAddonSelection);
  const editingCartItem = useCartStore((state) =>
    editingCartItemId ? state.products.find((item) => item.id === editingCartItemId) : undefined
  );
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [hasSubmitError, setHasSubmitError] = React.useState(false);
  const [footerHeight, setFooterHeight] = React.useState(0);
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const shouldHideFooter = isKeyboardVisible && windowWidth > windowHeight;
  const listRef = React.useRef<FlatList<AddOnGroup>>(null);
  const schema = createAddOnSchema(product?.add_ons ?? [], t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddOnFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM_VALUES,
  });
  const values = useWatch({ control }) as AddOnFormValues;

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (!product) return;

    if (editingCartItemId && editingCartItem) {
      const radioSelections: Record<string, string> = {};
      const checkboxSelections: Record<string, string[]> = {};

      editingCartItem.add_ons.forEach((addOn) => {
        const group = product.add_ons.find((candidate) => candidate.id === addOn.id);
        if (!group) return;
        if (group.multiple) {
          checkboxSelections[addOn.id] = addOn.options.map((option) => option.id);
        } else if (addOn.options[0]) {
          radioSelections[addOn.id] = addOn.options[0].id;
        }
      });

      reset({
        radioSelections,
        checkboxSelections,
        notes: editingCartItem.notes ?? "",
      });
      return;
    }

    reset(EMPTY_FORM_VALUES);
  }, [editingCartItem, editingCartItemId, product, reset]);

  const selectedAddOns = product ? buildCartAddOns(product, values) : [];
  const selectedOptionCount = selectedAddOns.reduce(
    (total, group) => total + group.options.length,
    0
  );
  const addOnTotal = selectedAddOns
    .flatMap((group) => group.options)
    .reduce((total, option) => total + option.price, 0);
  const configuredPrice = (product ? getProductSellingPrice(product) : 0) + addOnTotal;

  const scrollToNotes = () => {
    listRef.current?.scrollToOffset({ offset: 99_999, animated: true });
  };

  const closeSheet = () => {
    void dismiss(POS_ADD_ON_SHEET_NAME);
  };

  const handleDidDismiss = () => {
    setHasSubmitError(false);
    reset(EMPTY_FORM_VALUES);
    clearAddonSelection();
  };

  const onSubmit = (formValues: AddOnFormValues) => {
    if (!product) return;

    setHasSubmitError(false);
    if (editingCartItemId) removeItem(editingCartItemId);
    addItem({
      product_id: product.id,
      name: product.name,
      price: getProductSellingPrice(product),
      original_price: product.price,
      qty: editingCartItem?.qty ?? 1,
      notes: formValues.notes.trim() || null,
      add_ons: buildCartAddOns(product, formValues),
    });
    closeSheet();
  };

  const onInvalid = () => {
    setHasSubmitError(true);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleSave = () => {
    void handleSubmit(onSubmit, onInvalid)();
  };

  const header = (
    <View className="bg-surface">
      <View className="gap-1 px-5 pb-4 pt-safe">
        <PanelTypography type="h4" weight="semibold" numberOfLines={1}>
          {product?.name ?? t("addOns.customizeProduct")}
        </PanelTypography>
        <PanelTypography type="body-sm" muted className="tabular-nums">
          {t("addOns.basePrice", { price: formatRupiah(product?.price ?? 0) })}
        </PanelTypography>
      </View>
      <Separator />
    </View>
  );

  const footer = (
    <View
      className="bg-surface pb-safe"
      onLayout={(event) => {
        const nextHeight = Math.ceil(event.nativeEvent.layout.height);
        setFooterHeight((currentHeight) =>
          currentHeight === nextHeight ? currentHeight : nextHeight
        );
      }}
    >
      <Separator />
      <View className="gap-3 px-5 pb-4 pt-3">
        <View className="flex-row items-center justify-between gap-4">
          <PanelTypography type="body-xs" muted>
            {t(selectedOptionCount === 1 ? "addOns.selectedOne" : "addOns.selectedOther", {
              count: selectedOptionCount,
            })}
          </PanelTypography>
          <PanelTypography type="body-sm" weight="semibold" className="tabular-nums">
            {formatRupiah(configuredPrice)}
          </PanelTypography>
        </View>
        <View className="flex-row gap-3">
          <Button variant="ghost" onPress={closeSheet}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" onPress={handleSave}>
            {editingCartItemId ? t("addOns.saveChanges") : t("addOns.addToCart")}
          </Button>
        </View>
      </View>
    </View>
  );

  return (
    <TrueSheet
      name={POS_ADD_ON_SHEET_NAME}
      detents={[0.72, 0.96]}
      presentation="form"
      maxContentWidth={680}
      cornerRadius={24}
      backgroundColor={backgroundColor}
      grabber
      dimmed
      scrollable
      scrollableOptions={{ scrollingExpandsSheet: true, keyboardScrollOffset: 24 }}
      header={header}
      headerStyle={{ backgroundColor, borderColor }}
      footer={shouldHideFooter ? undefined : footer}
      footerStyle={{ backgroundColor, borderColor }}
      onDidDismiss={handleDidDismiss}
    >
      <FlatList
        ref={listRef}
        data={product?.add_ons ?? []}
        keyExtractor={(group) => group.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator
        contentContainerStyle={{
          gap: 24,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 24,
        }}
        ListHeaderComponent={
          hasSubmitError ? (
            <Alert variant="destructive">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t("addOns.completeRequired")}</Alert.Title>
              </Alert.Content>
            </Alert>
          ) : null
        }
        renderItem={({ item: group }) => {
          const error =
            errors.radioSelections?.[group.id]?.message ??
            errors.checkboxSelections?.[group.id]?.message;

          return (
            <View className="gap-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1 gap-1">
                  <PanelTypography type="body-sm" weight="semibold">
                    {group.name}
                  </PanelTypography>
                  <PanelTypography type="body-xs" muted>
                    {constraintLabel(group, t)}
                  </PanelTypography>
                </View>
                <PanelChip size="sm" variant={group.required ? "primary" : "default"}>
                  {group.required ? t("addOns.required") : t("addOns.optional")}
                </PanelChip>
              </View>
              <AddOnSelection control={control} group={group} />
              {error ? (
                <PanelTypography type="body-xs" className="text-destructive">
                  {error}
                </PanelTypography>
              ) : null}
            </View>
          );
        }}
        ListFooterComponent={
          <View className="gap-2 pb-2">
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <PanelTextarea
                  ref={field.ref}
                  label={t("addOns.notes")}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={() => {
                    void resize(POS_ADD_ON_SHEET_NAME, 1).then(scrollToNotes);
                  }}
                  placeholder={t("addOns.specialInstructions")}
                  rows={2}
                />
              )}
            />
            {!shouldHideFooter && footerHeight > 0 ? (
              <View
                style={{ height: footerHeight + 16 }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            ) : null}
          </View>
        }
      />
    </TrueSheet>
  );
}

import { POS_ADD_ON_SHEET_NAME } from "@/hooks/use-pos-add-on-sheet";
import { createAddOnSchema, type AddOnFormValues } from "@/schemas/addon";
import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import type { AddOnGroup, AddOnOption, POSProduct } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrueSheet, useTrueSheet } from "@lodev09/react-native-true-sheet";
import {
  Button,
  Checkbox,
  Chip,
  ControlField,
  Description,
  FieldError,
  Radio,
  Separator,
  Surface,
  TextArea,
  Typography,
  useThemeColor,
} from "heroui-native";
import React from "react";
import { Controller, type Control, useForm, useWatch } from "react-hook-form";
import { FlatList, View, useWindowDimensions } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import type { Translate } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

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

function selectedOptionIds(group: AddOnGroup, values: AddOnFormValues): Set<string> {
  const ids = group.multiple
    ? (values.checkboxSelections?.[group.id] ?? [])
    : values.radioSelections?.[group.id]
      ? [values.radioSelections[group.id]]
      : [];
  return new Set(ids);
}

function buildCartAddOns(product: POSProduct, values: AddOnFormValues) {
  return product.add_ons.flatMap((group) => {
    const selectedIds = selectedOptionIds(group, values);
    const options = group.options.filter((option) => selectedIds.has(option.id));
    return options.length > 0 ? [{ id: group.id, name: group.name, options }] : [];
  });
}

type OptionRowProps = {
  option: AddOnOption;
  isSelected: boolean;
  isDisabled?: boolean;
  type: "radio" | "checkbox";
  onSelect: () => void;
};

function OptionRow({
  option,
  isSelected,
  isDisabled = false,
  type,
  onSelect,
}: OptionRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const accessibilityLabel =
    option.price > 0
      ? t("addOns.optionAccessibilityWithPrice", {
          option: option.name,
          price: formatRupiah(option.price),
        })
      : t("addOns.optionAccessibilityNoCharge", { option: option.name });

  return (
    <ControlField
      accessibilityRole={type}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
      isSelected={isSelected}
      isDisabled={isDisabled}
      onSelectedChange={onSelect}
      className={`min-h-15 flex-row items-center gap-4 px-4 py-3 ${
        isSelected ? "bg-accent-soft" : ""
      }`}
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <Typography type="body-sm" weight="semibold" numberOfLines={2}>
          {option.name}
        </Typography>
        <Typography type="body-xs" color="muted" className="tabular-nums">
          {option.price > 0 ? `+${formatRupiah(option.price)}` : t("addOns.noAdditionalCharge")}
        </Typography>
      </View>
      <ControlField.Indicator variant={type}>
        {type === "radio" ? <Radio /> : <Checkbox />}
      </ControlField.Indicator>
    </ControlField>
  );
}

type AddOnSelectionProps = {
  control: Control<AddOnFormValues>;
  group: AddOnGroup;
};

function AddOnSelection({ control, group }: AddOnSelectionProps): React.JSX.Element {
  if (!group.multiple) {
    return (
      <Controller
        control={control}
        name={`radioSelections.${group.id}`}
        render={({ field }) => (
          <Surface className="w-full overflow-hidden p-0">
            {group.options.map((option, index) => (
              <React.Fragment key={option.id}>
                {index > 0 ? <Separator /> : null}
                <OptionRow
                  option={option}
                  type="radio"
                  isSelected={field.value === option.id}
                  onSelect={() => field.onChange(option.id)}
                />
              </React.Fragment>
            ))}
          </Surface>
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
          <Surface className="w-full overflow-hidden p-0">
            {group.options.map((option, index) => {
              const isSelected = selectedIds.has(option.id);
              const isDisabled = !isSelected && hasLimit && selected.length >= group.max;

              return (
                <React.Fragment key={option.id}>
                  {index > 0 ? <Separator /> : null}
                  <OptionRow
                    option={option}
                    type="checkbox"
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    onSelect={() => {
                      field.onChange(
                        isSelected
                          ? selected.filter((id) => id !== option.id)
                          : [...selected, option.id]
                      );
                    }}
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
  const [backgroundColor, borderColor] = useThemeColor(["background", "border"]);
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
  const configuredPrice = (product?.price ?? 0) + addOnTotal;

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
      price: product.price,
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
        <Typography type="h4" weight="semibold" numberOfLines={1}>
          {product?.name ?? t("addOns.customizeProduct")}
        </Typography>
        <Typography type="body-sm" color="muted" className="tabular-nums">
          {t("addOns.basePrice", { price: formatRupiah(product?.price ?? 0) })}
        </Typography>
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
          <Typography type="body-xs" color="muted">
            {t(selectedOptionCount === 1 ? "addOns.selectedOne" : "addOns.selectedOther", {
              count: selectedOptionCount,
            })}
          </Typography>
          <Typography type="body-sm" weight="semibold" className="tabular-nums">
            {formatRupiah(configuredPrice)}
          </Typography>
        </View>
        <View className="flex-row gap-3">
          <Button variant="ghost" onPress={closeSheet}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSave}>
            <Button.Label>
              {editingCartItemId ? t("addOns.saveChanges") : t("addOns.addToCart")}
            </Button.Label>
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
            <Surface variant="secondary" className="bg-danger-soft p-3">
              <Typography type="body-sm" className="text-danger-soft-foreground">
                {t("addOns.completeRequired")}
              </Typography>
            </Surface>
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
                  <Typography type="body-sm" weight="semibold">
                    {group.name}
                  </Typography>
                  <Description>{constraintLabel(group, t)}</Description>
                </View>
                <Chip size="sm" color={group.required ? "accent" : "default"} variant="soft">
                  <Chip.Label>
                    {group.required ? t("addOns.required") : t("addOns.optional")}
                  </Chip.Label>
                </Chip>
              </View>
              <AddOnSelection control={control} group={group} />
              <FieldError isInvalid={Boolean(error)}>{error}</FieldError>
            </View>
          );
        }}
        ListFooterComponent={
          <View className="gap-2 pb-2">
            <Typography type="body-sm" weight="semibold">
              {t("addOns.notes")}
            </Typography>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextArea
                  value={field.value}
                  onChangeText={field.onChange}
                  onFocus={() => {
                    void resize(POS_ADD_ON_SHEET_NAME, 1).then(scrollToNotes);
                  }}
                  placeholder={t("addOns.specialInstructions")}
                  numberOfLines={2}
                  className="h-16"
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

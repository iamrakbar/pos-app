import {
  Typography,
  Typography as PanelFieldText,
  Button as PanelFooterButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  Label as PanelLabel,
  Select as PanelSelect,
  Textarea as PanelTextarea,
  Typography as PanelTypography,
  useToast,
} from "panelui-native";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { getErrorMessage } from "@/api/api-error";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
import { useRecordIngredientMovement } from "@/hooks/db/use-ingredients";
import {
  createIngredientMovementSchema,
  INGREDIENT_MOVEMENT_TYPES,
  toIngredientMovementRequest,
  type IngredientMovementFormValues,
} from "@/schemas/ingredient-stock";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { createOperationId } from "@/utils/operation-id";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { View } from "react-native";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  mapServerErrors,
  QUANTITY_FORMAT_OPTIONS,
  type Ingredient,
} from "@/screens/inventory/ingredient-stock-overlay-utils";

export default function RecordMovementOverlay({
  ingredient,
  isOpen,
  onOpenChange,
}: {
  ingredient: Ingredient;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const { choicePresentation } = useOverlayPresentation();
  const mutation = useRecordIngredientMovement(ingredient.id);
  const schema = createIngredientMovementSchema(t);
  const movementOptions = INGREDIENT_MOVEMENT_TYPES.map((type) => ({
    value: type,
    label: t(`movements.types.${type}` as TranslationKey),
  }));
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<IngredientMovementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "", quantity: "", cost_per_unit: "", reason: "" },
  });
  const {
    field: { value: costValue, onChange: costChange, onBlur: costBlur, ref: costRef },
  } = useController({ control, name: "cost_per_unit" });
  const {
    field: { value: quantityValue, onChange: changeQuantity, onBlur: blurQuantity },
  } = useController({ control, name: "quantity" });
  const { numericValue: quantityNumber, localizedInputProps: quantityInput } =
    useLocalizedNumberInput({
      value: quantityValue,
      onChange: changeQuantity,
      formatOptions: QUANTITY_FORMAT_OPTIONS,
      minValue: 0,
      inputProps: { onBlur: blurQuantity },
    });
  const { localizedInputProps: costInput } = useLocalizedNumberInput({
    value: costValue,
    onChange: costChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: costBlur },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isOpen) reset({ type: "", quantity: "", cost_per_unit: "", reason: "" });
  }, [isOpen, reset]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (mutation.isPending) return;
    if (!nextIsOpen) reset({ type: "", quantity: "", cost_per_unit: "", reason: "" });
    onOpenChange(nextIsOpen);
  };
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, handleOpenChange);

  const submit = async (values: IngredientMovementFormValues) => {
    try {
      await mutation.mutateAsync(toIngredientMovementRequest(values, createOperationId()));
      toast.show({ variant: "success", label: t("ingredients.movementRecorded") });
      reset({ type: "", quantity: "", cost_per_unit: "", reason: "" });
      onOpenChange(false);
    } catch (error) {
      const hasFieldError = mapServerErrors(
        error,
        ["type", "quantity", "cost_per_unit", "reason"],
        setError
      );
      const message = hasFieldError ? t("ingredients.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("ingredients.stockActionFailed"),
        description: message,
      });
    }
  };

  const footer = (
    <View className="gap-3 px-5 pb-safe pt-4 flex-row">
      <PanelFooterButton
        variant="ghost"
        onPress={() => handleOpenChange(false)}
        disabled={mutation.isPending}
      >
        {t("common.cancel")}
      </PanelFooterButton>
      <PanelFooterButton
        onPress={() => void handleSubmit(submit)()}
        disabled={mutation.isPending}
        className="flex-1"
      >
        {mutation.isPending ? t("common.saving") : t("ingredients.submitMovement")}
      </PanelFooterButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <Controller
        control={control}
        name="type"
        render={({ field: { value, onChange } }) => (
          <View className="gap-1.5">
            <PanelLabel isRequired isInvalid={Boolean(errors.type)}>
              {t("ingredients.movementType")}
            </PanelLabel>
            <PanelSelect
              presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
              value={value}
              onValueChange={onChange}
              placeholder={t("ingredients.movementTypePlaceholder")}
              title={t("ingredients.movementType")}
              triggerClassName={errors.type ? "border-destructive" : undefined}
            >
              {movementOptions.map((option) => (
                <PanelSelect.Item key={option.value} {...option} />
              ))}
            </PanelSelect>
            {errors.type?.message ? (
              <PanelFieldText type="body-xs" className="text-destructive">
                {errors.type?.message}
              </PanelFieldText>
            ) : null}
          </View>
        )}
      />

      <PanelInput
        label={t("ingredients.quantity")}
        placeholder={t("ingredients.quantityPlaceholder")}
        keyboardType="decimal-pad"
        isRequired
        errorMessage={errors.quantity?.message}
        {...quantityInput}
        startContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.decreaseAccessibility", {
              field: t("ingredients.quantity"),
            })}
            disabled={Number.isFinite(quantityNumber) && quantityNumber <= 0}
            onPress={() => changeQuantity(String(Math.max(0, (quantityNumber || 0) - 1)))}
          >
            −
          </PanelFooterButton>
        }
        endContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.increaseAccessibility", {
              field: t("ingredients.quantity"),
            })}
            onPress={() => changeQuantity(String((quantityNumber || 0) + 1))}
          >
            +
          </PanelFooterButton>
        }
      />

      <PanelInput
        ref={costRef}
        label={t("ingredients.movementCostPerUnit")}
        placeholder={t("ingredients.movementCostPerUnitPlaceholder")}
        errorMessage={errors.cost_per_unit?.message}
        variant="filled"
        keyboardType="numeric"
        startContent={
          <PanelTypography type="body-sm" weight="medium" muted>
            {RUPIAH_PREFIX}
          </PanelTypography>
        }
        interactiveContent={false}

        {...costInput}
        onBlur={(event) => {
          costInput.onBlur(event);
        }}
      />

      <Controller
        control={control}
        name="reason"
        render={({ field: { value, onChange } }) => (
          <PanelTextarea
            label={t("ingredients.reason")}
            placeholder={t("ingredients.reasonPlaceholder")}
            errorMessage={errors.reason?.message}
            isRequired
            value={value}
            onChangeText={onChange}
            rows={3}
          />
        )}
      />

      {errors.root?.server?.message ? (
        <Typography type="body-sm" className="text-destructive">
          {errors.root.server.message}
        </Typography>
      ) : null}
    </View>
  );
  const title = t("ingredients.recordMovement");
  const description = t("ingredients.recordMovementDescription");

  if (isPhonePortrait) {
    return (
      <TrueSheet
        ref={sheetRef}
        detents={[0.9]}
        scrollable
        cornerRadius={24}
        grabber
        dimmed
        onDidDismiss={handleDidDismiss}
        header={
          <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
            <Typography type="h4" weight="semibold">
              {title}
            </Typography>
            <Typography type="body-sm" muted>
              {description}
            </Typography>
            <PanelFooterButton
              variant="ghost"
              size="sm"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3"
              onPress={() => handleOpenChange(false)}
            >
              {t("common.close")}
            </PanelFooterButton>
          </View>
        }
        footer={<View className="bg-surface">{footer}</View>}
      >
        {content}
      </TrueSheet>
    );
  }

  return (
    <PanelDialog open={isOpen} onOpenChange={handleOpenChange}>
      <PanelDialog.Content
        dismissible={false}
        className="w-full max-w-md self-center overflow-hidden p-0"
        style={dialogKeyboardStyle}
      >
        <PanelFooterButton
          variant="ghost"
          size="sm"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => handleOpenChange(false)}
        >
          {t("common.close")}
        </PanelFooterButton>
        <View className="gap-1.5 px-5 pb-4 pr-14 pt-5">
          <PanelDialog.Title>{title}</PanelDialog.Title>
          <PanelDialog.Description>{description}</PanelDialog.Description>
        </View>
        {content}
        {footer}
      </PanelDialog.Content>
    </PanelDialog>
  );
}

import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import { getErrorMessage } from "@/api/api-error";
import { FormNumberField, RupiahField } from "@/components/common/form-number-field";
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
import { Label, Select, TextArea, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  FieldMessage,
  mapServerErrors,
  OverlayFooter,
  QUANTITY_FORMAT_OPTIONS,
  type Ingredient,
} from "@/screens/inventory/ingredient-stock-overlay-shared";

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
        variant: "danger",
        label: t("ingredients.stockActionFailed"),
        description: message,
      });
    }
  };

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t("ingredients.recordMovement")}
      description={t("ingredients.recordMovementDescription")}
      footer={
        <OverlayFooter
          isPending={mutation.isPending}
          submitLabel={t("ingredients.submitMovement")}
          pendingLabel={t("common.saving")}
          cancelLabel={t("common.cancel")}
          onSubmit={() => void handleSubmit(submit)()}
          onCancel={() => handleOpenChange(false)}
        />
      }
    >
      <View className="gap-4 px-5">
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <Label isRequired isInvalid={Boolean(errors.type)}>
                {t("ingredients.movementType")}
              </Label>
              <Select
                presentation={choicePresentation}
                value={movementOptions.find((option) => option.value === value)}
                onValueChange={(option) => onChange(option?.value ?? "")}
              >
                <Select.Trigger
                  accessibilityLabel={t("ingredients.selectMovementType")}
                  className={errors.type ? "border-danger" : undefined}
                >
                  <Select.Value placeholder={t("ingredients.movementTypePlaceholder")} />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content
                    presentation={choicePresentation}
                    width={choicePresentation === "popover" ? "trigger" : undefined}
                  >
                    <Select.ListLabel>{t("ingredients.movementType")}</Select.ListLabel>
                    {movementOptions.map((option) => (
                      <Select.Item key={option.value} {...option} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
              <FieldMessage message={errors.type?.message} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="quantity"
          render={({ field: { value, onChange } }) => (
            <AdaptiveFormKeyboardHandlers>
              {(keyboardHandlers) => (
                <FormNumberField
                  label={t("ingredients.quantity")}
                  value={value}
                  onChange={onChange}
                  placeholder={t("ingredients.quantityPlaceholder")}
                  minValue={0}
                  showStepper
                  inputVariant="secondary"
                  inputProps={keyboardHandlers}
                  formatOptions={QUANTITY_FORMAT_OPTIONS}
                  isRequired
                  isInvalid={Boolean(errors.quantity)}
                >
                  <FieldMessage message={errors.quantity?.message} />
                </FormNumberField>
              )}
            </AdaptiveFormKeyboardHandlers>
          )}
        />

        <Controller
          control={control}
          name="cost_per_unit"
          render={({ field: { value, onChange } }) => (
            <AdaptiveFormKeyboardHandlers>
              {(keyboardHandlers) => (
                <RupiahField
                  label={t("ingredients.movementCostPerUnit")}
                  value={value}
                  onChange={onChange}
                  placeholder={t("ingredients.movementCostPerUnitPlaceholder")}
                  minValue={0}
                  inputVariant="secondary"
                  inputProps={keyboardHandlers}
                  isInvalid={Boolean(errors.cost_per_unit)}
                >
                  <FieldMessage message={errors.cost_per_unit?.message} />
                </RupiahField>
              )}
            </AdaptiveFormKeyboardHandlers>
          )}
        />

        <Controller
          control={control}
          name="reason"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={Boolean(errors.reason)}>
              <Label>{t("ingredients.reason")}</Label>
              <AdaptiveFormKeyboardHandlers>
                {(keyboardHandlers) => (
                  <TextArea
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("ingredients.reasonPlaceholder")}
                    variant="secondary"
                    className="min-h-20"
                    {...keyboardHandlers}
                  />
                )}
              </AdaptiveFormKeyboardHandlers>
              <FieldMessage message={errors.reason?.message} />
            </TextField>
          )}
        />

        {errors.root?.server?.message ? (
          <Typography type="body-sm" className="text-danger">
            {errors.root.server.message}
          </Typography>
        ) : null}
      </View>
    </AdaptiveFormOverlay>
  );
}

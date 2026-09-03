import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import { getErrorMessage } from "@/api/api-error";
import { FormNumberField } from "@/components/common/form-number-field";
import AdaptiveTextAreaController from "@/components/common/adaptive-text-area-controller";
import { useAdjustIngredientStock } from "@/hooks/db/use-ingredients";
import {
  createIngredientAdjustmentSchema,
  toIngredientAdjustmentRequest,
  type IngredientAdjustmentFormValues,
} from "@/schemas/ingredient-stock";
import { useTranslation } from "@/stores/use-locale";
import { createOperationId } from "@/utils/operation-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { FieldMessage, OverlayFooter } from "@/screens/inventory/ingredient-stock-overlay-shared";
import {
  mapServerErrors,
  QUANTITY_FORMAT_OPTIONS,
  type Ingredient,
} from "@/screens/inventory/ingredient-stock-overlay-utils";

export default function AdjustStockOverlay({
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
  const mutation = useAdjustIngredientStock(ingredient.id);
  const schema = createIngredientAdjustmentSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<IngredientAdjustmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { target_balance: "", reason: "" },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isOpen) reset({ target_balance: "", reason: "" });
  }, [isOpen, reset]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (mutation.isPending) return;
    if (!nextIsOpen) reset({ target_balance: "", reason: "" });
    onOpenChange(nextIsOpen);
  };

  const submit = async (values: IngredientAdjustmentFormValues) => {
    try {
      await mutation.mutateAsync(toIngredientAdjustmentRequest(values, createOperationId()));
      toast.show({ variant: "success", label: t("ingredients.adjusted") });
      reset({ target_balance: "", reason: "" });
      onOpenChange(false);
    } catch (error) {
      const hasFieldError = mapServerErrors(error, ["target_balance", "reason"], setError);
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
      title={t("ingredients.adjustStock")}
      description={t("ingredients.adjustStockDescription")}
      footer={
        <OverlayFooter
          isPending={mutation.isPending}
          submitLabel={t("ingredients.submitAdjustment")}
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
          name="target_balance"
          render={({ field: { value, onChange } }) => (
            <AdaptiveFormKeyboardHandlers>
              {(keyboardHandlers) => (
                <FormNumberField
                  label={t("ingredients.targetBalance")}
                  value={value}
                  onChange={onChange}
                  placeholder={t("ingredients.targetBalancePlaceholder")}
                  minValue={0}
                  showStepper
                  inputVariant="secondary"
                  inputProps={keyboardHandlers}
                  formatOptions={QUANTITY_FORMAT_OPTIONS}
                  isRequired
                  isInvalid={Boolean(errors.target_balance)}
                >
                  <FieldMessage message={errors.target_balance?.message} />
                </FormNumberField>
              )}
            </AdaptiveFormKeyboardHandlers>
          )}
        />

        <AdaptiveTextAreaController
          control={control}
          name="reason"
          label={t("ingredients.reason")}
          placeholder={t("ingredients.reasonPlaceholder")}
          error={errors.reason?.message}
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

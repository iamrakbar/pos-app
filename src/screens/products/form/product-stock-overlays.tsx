import { getErrorMessage, isApiError } from "@/api/api-error";
import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import AdaptiveTextAreaController from "@/components/common/adaptive-text-area-controller";
import { FormNumberField, RupiahField } from "@/components/common/form-number-field";
import { useAdjustProductStock, useRecordProductOpeningBalance } from "@/hooks/db/use-products";
import {
  createProductAdjustmentSchema,
  createProductOpeningBalanceSchema,
  toProductAdjustmentRequest,
  toProductOpeningBalanceRequest,
  type ProductAdjustmentFormValues,
  type ProductOpeningBalanceFormValues,
} from "@/schemas/product-stock";
import { useTranslation } from "@/stores/use-locale";
import { createOperationId } from "@/utils/operation-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { FieldMessage, OverlayFooter } from "@/screens/inventory/ingredient-stock-overlay-shared";

const PRODUCT_QUANTITY_FORMAT_OPTIONS = {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} satisfies Intl.NumberFormatOptions;

function setProductStockServerErrors<T extends string>(
  error: unknown,
  fields: readonly T[],
  setError: (field: T, error: { type: string; message: string }) => void
): boolean {
  if (!isApiError(error) || !error.errors) return false;

  let hasFieldError = false;
  for (const field of fields) {
    const message = error.errors[field]?.[0];
    if (!message) continue;
    setError(field, { type: "server", message });
    hasFieldError = true;
  }
  return hasFieldError;
}

export function ProductOpeningBalanceOverlay({
  productId,
  isOpen,
  onOpenChange,
}: {
  productId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const mutation = useRecordProductOpeningBalance(productId);
  const schema = createProductOpeningBalanceSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProductOpeningBalanceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: "", cost_per_unit: "" },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isOpen) reset({ quantity: "", cost_per_unit: "" });
  }, [isOpen, reset]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (mutation.isPending) return;
    if (!nextIsOpen) reset({ quantity: "", cost_per_unit: "" });
    onOpenChange(nextIsOpen);
  };

  const submit = async (values: ProductOpeningBalanceFormValues) => {
    try {
      await mutation.mutateAsync(toProductOpeningBalanceRequest(values, createOperationId()));
      toast.show({ variant: "success", label: t("productForm.openingBalanceRecorded") });
      handleOpenChange(false);
    } catch (error) {
      const hasFieldError = setProductStockServerErrors(
        error,
        ["quantity", "cost_per_unit"],
        setError
      );
      const message = hasFieldError ? t("productForm.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "danger",
        label: t("productForm.stockActionFailed"),
        description: message,
      });
    }
  };

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t("productForm.openingBalance")}
      description={t("productForm.openingBalanceDescription")}
      footer={
        <OverlayFooter
          isPending={mutation.isPending}
          submitLabel={t("productForm.submitOpeningBalance")}
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
          name="quantity"
          render={({ field: { value, onChange } }) => (
            <AdaptiveFormKeyboardHandlers>
              {(keyboardHandlers) => (
                <FormNumberField
                  label={t("productForm.openingQuantity")}
                  value={value}
                  onChange={onChange}
                  placeholder={t("productForm.openingQuantityPlaceholder")}
                  minValue={0}
                  step={1}
                  showStepper
                  inputVariant="secondary"
                  inputProps={keyboardHandlers}
                  formatOptions={PRODUCT_QUANTITY_FORMAT_OPTIONS}
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
                  label={t("productForm.inventoryCost")}
                  value={value}
                  onChange={onChange}
                  placeholder={t("productForm.inventoryCostPlaceholder")}
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
        {errors.root?.server?.message ? (
          <Typography type="body-sm" className="text-danger">
            {errors.root.server.message}
          </Typography>
        ) : null}
      </View>
    </AdaptiveFormOverlay>
  );
}

export function ProductAdjustStockOverlay({
  productId,
  isOpen,
  onOpenChange,
}: {
  productId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const mutation = useAdjustProductStock(productId);
  const schema = createProductAdjustmentSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProductAdjustmentFormValues>({
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

  const submit = async (values: ProductAdjustmentFormValues) => {
    try {
      await mutation.mutateAsync(toProductAdjustmentRequest(values, createOperationId()));
      toast.show({ variant: "success", label: t("productForm.stockAdjusted") });
      handleOpenChange(false);
    } catch (error) {
      const hasFieldError = setProductStockServerErrors(
        error,
        ["target_balance", "reason"],
        setError
      );
      const message = hasFieldError ? t("productForm.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "danger",
        label: t("productForm.stockActionFailed"),
        description: message,
      });
    }
  };

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t("productForm.adjustStock")}
      description={t("productForm.adjustStockDescription")}
      footer={
        <OverlayFooter
          isPending={mutation.isPending}
          submitLabel={t("productForm.submitAdjustment")}
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
                  label={t("productForm.targetBalance")}
                  value={value}
                  onChange={onChange}
                  placeholder={t("productForm.targetBalancePlaceholder")}
                  minValue={0}
                  step={1}
                  showStepper
                  inputVariant="secondary"
                  inputProps={keyboardHandlers}
                  formatOptions={PRODUCT_QUANTITY_FORMAT_OPTIONS}
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
          label={t("productForm.reason")}
          placeholder={t("productForm.reasonPlaceholder")}
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

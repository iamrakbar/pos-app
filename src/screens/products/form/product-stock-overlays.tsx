import {
  Typography,
  Button as PanelFooterButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  Textarea as PanelTextarea,
  Typography as PanelTypography,
  useToast,
} from "panelui-native";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
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

import React from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { View } from "react-native";

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
  const {
    field: { value: quantityValue, onChange: changeQuantity, onBlur: blurQuantity },
  } = useController({ control, name: "quantity" });
  const { numericValue: quantityNumber, localizedInputProps: quantityInput } =
    useLocalizedNumberInput({
      value: quantityValue,
      onChange: changeQuantity,
      formatOptions: PRODUCT_QUANTITY_FORMAT_OPTIONS,
      minValue: 0,
      inputProps: { onBlur: blurQuantity },
    });
  const {
    field: { value: costValue, onChange: costChange, onBlur: costBlur, ref: costRef },
  } = useController({ control, name: "cost_per_unit" });
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
    if (isOpen) reset({ quantity: "", cost_per_unit: "" });
  }, [isOpen, reset]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (mutation.isPending) return;
    if (!nextIsOpen) reset({ quantity: "", cost_per_unit: "" });
    onOpenChange(nextIsOpen);
  };
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, handleOpenChange);

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
        variant: "destructive",
        label: t("productForm.stockActionFailed"),
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
        {mutation.isPending ? t("common.saving") : t("productForm.submitOpeningBalance")}
      </PanelFooterButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <PanelInput
        label={t("productForm.openingQuantity")}
        placeholder={t("productForm.openingQuantityPlaceholder")}
        keyboardType="number-pad"
        isRequired
        errorMessage={errors.quantity?.message}
        {...quantityInput}
        startContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.decreaseAccessibility", {
              field: t("productForm.openingQuantity"),
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
              field: t("productForm.openingQuantity"),
            })}
            onPress={() => changeQuantity(String((quantityNumber || 0) + 1))}
          >
            +
          </PanelFooterButton>
        }
      />
      <PanelInput
        ref={costRef}
        label={t("productForm.inventoryCost")}
        placeholder={t("productForm.inventoryCostPlaceholder")}
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
      {errors.root?.server?.message ? (
        <Typography type="body-sm" className="text-destructive-foreground">
          {errors.root.server.message}
        </Typography>
      ) : null}
    </View>
  );
  const title = t("productForm.openingBalance");
  const description = t("productForm.openingBalanceDescription");

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
  const {
    field: { value: targetValue, onChange: changeTarget, onBlur: blurTarget },
  } = useController({ control, name: "target_balance" });
  const { numericValue: targetNumber, localizedInputProps: targetInput } = useLocalizedNumberInput({
    value: targetValue,
    onChange: changeTarget,
    formatOptions: PRODUCT_QUANTITY_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: blurTarget },
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
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, handleOpenChange);

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
        variant: "destructive",
        label: t("productForm.stockActionFailed"),
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
        {mutation.isPending ? t("common.saving") : t("productForm.submitAdjustment")}
      </PanelFooterButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <PanelInput
        label={t("productForm.targetBalance")}
        placeholder={t("productForm.targetBalancePlaceholder")}
        keyboardType="number-pad"
        isRequired
        errorMessage={errors.target_balance?.message}
        {...targetInput}
        startContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.decreaseAccessibility", {
              field: t("productForm.targetBalance"),
            })}
            disabled={Number.isFinite(targetNumber) && targetNumber <= 0}
            onPress={() => changeTarget(String(Math.max(0, (targetNumber || 0) - 1)))}
          >
            −
          </PanelFooterButton>
        }
        endContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.increaseAccessibility", {
              field: t("productForm.targetBalance"),
            })}
            onPress={() => changeTarget(String((targetNumber || 0) + 1))}
          >
            +
          </PanelFooterButton>
        }
      />
      <Controller
        control={control}
        name="reason"
        render={({ field: { value, onChange } }) => (
          <PanelTextarea
            label={t("productForm.reason")}
            placeholder={t("productForm.reasonPlaceholder")}
            errorMessage={errors.reason?.message}
            isRequired
            value={value}
            onChangeText={onChange}
            rows={3}
          />
        )}
      />
      {errors.root?.server?.message ? (
        <Typography type="body-sm" className="text-destructive-foreground">
          {errors.root.server.message}
        </Typography>
      ) : null}
    </View>
  );
  const title = t("productForm.adjustStock");
  const description = t("productForm.adjustStockDescription");

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

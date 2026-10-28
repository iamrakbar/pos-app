import { AppIcons } from "@/components/common/app-icons";
import AppIcon from "@/components/common/app-icon";
import {
  Typography,
  Button as PanelFooterButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  Textarea as PanelTextarea,
  useToast,
} from "panelui-native";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { getErrorMessage } from "@/api/api-error";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { useAdjustIngredientStock } from "@/hooks/db/use-ingredients";
import {
  createIngredientAdjustmentSchema,
  toIngredientAdjustmentRequest,
  type IngredientAdjustmentFormValues,
} from "@/schemas/ingredient-stock";
import { useTranslation } from "@/stores/use-locale";
import { createOperationId } from "@/utils/operation-id";
import { zodResolver } from "@hookform/resolvers/zod";

import React from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { View } from "react-native";
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
  const {
    field: { value: targetBalance, onChange: changeTargetBalance, onBlur: blurTargetBalance },
  } = useController({ control, name: "target_balance" });
  const { numericValue: targetBalanceNumber, localizedInputProps: targetBalanceInput } =
    useLocalizedNumberInput({
      value: targetBalance,
      onChange: changeTargetBalance,
      formatOptions: QUANTITY_FORMAT_OPTIONS,
      minValue: 0,
      inputProps: { onBlur: blurTargetBalance },
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
        {mutation.isPending ? t("common.saving") : t("ingredients.submitAdjustment")}
      </PanelFooterButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <PanelInput
        label={t("ingredients.targetBalance")}
        placeholder={t("ingredients.targetBalancePlaceholder")}
        keyboardType="decimal-pad"
        isRequired
        errorMessage={errors.target_balance?.message}
        {...targetBalanceInput}
        startContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.decreaseAccessibility", {
              field: t("ingredients.targetBalance"),
            })}
            disabled={Number.isFinite(targetBalanceNumber) && targetBalanceNumber <= 0}
            onPress={() => changeTargetBalance(String(Math.max(0, (targetBalanceNumber || 0) - 1)))}
          >
            −
          </PanelFooterButton>
        }
        endContent={
          <PanelFooterButton
            size="icon"
            variant="ghost"
            accessibilityLabel={t("productForm.increaseAccessibility", {
              field: t("ingredients.targetBalance"),
            })}
            onPress={() => changeTargetBalance(String((targetBalanceNumber || 0) + 1))}
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
  const title = t("ingredients.adjustStock");
  const description = t("ingredients.adjustStockDescription");

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
          <View className="bg-surface gap-2 px-6 pb-5 pr-16 pt-8">
            <Typography type="h4" weight="semibold">
              {title}
            </Typography>
            <Typography type="body-sm" muted>
              {description}
            </Typography>
            <PanelFooterButton
              variant="ghost"
              size="icon"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3"
              onPress={() => handleOpenChange(false)}
            >
              <AppIcon icon={AppIcons.close} size={20} />
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
          size="icon"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => handleOpenChange(false)}
        >
          <AppIcon icon={AppIcons.close} size={20} />
        </PanelFooterButton>
        <View className="gap-2 px-6 pb-5 pr-16 pt-8">
          <PanelDialog.Title>{title}</PanelDialog.Title>
          <PanelDialog.Description>{description}</PanelDialog.Description>
        </View>
        {content}
        {footer}
      </PanelDialog.Content>
    </PanelDialog>
  );
}

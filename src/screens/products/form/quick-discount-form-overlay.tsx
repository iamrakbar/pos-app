import {
  Button as PanelButton,
  Dialog as PanelDialog,
  Label as PanelLabel,
  Typography,
  Input as PanelInput,
  Typography as PanelTypography,
  useToast,
} from "panelui-native";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
import { isApiError } from "@/api/api-error";
import { useCreateDiscount } from "@/hooks/db/use-discounts";
import {
  createDiscountSchema,
  toDiscountRequest,
  type DiscountFormValues,
} from "@/schemas/discount";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useController, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import type { DiscountListItem } from "@/hooks/db/use-discounts";

function getDefaultValues(productId: string): DiscountFormValues {
  return {
    name: "",
    unit: "percentage",
    value: "",
    start: "",
    end: "",
    active: true,
    products: [productId],
  };
}

type QuickDiscountFormOverlayProps = {
  isOpen: boolean;
  productId: string;
  onOpenChange: (isOpen: boolean) => void;
  onCreated: (discount: DiscountListItem) => void;
};

export default function QuickDiscountFormOverlay({
  isOpen,
  productId,
  onOpenChange,
  onCreated,
}: QuickDiscountFormOverlayProps): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const createMutation = useCreateDiscount();
  const schema = createDiscountSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(productId),
  });

  const unit = useWatch({ control, name: "unit" });
  const {
    field: {
      value: discountValue,
      onChange: discountChange,
      onBlur: discountBlur,
      ref: discountRef,
    },
  } = useController({ control, name: "value" });
  const { localizedInputProps: discountInput } = useLocalizedNumberInput({
    value: discountValue,
    onChange: discountChange,
    formatOptions:
      unit === "fixed"
        ? IDR_NUMBER_FIELD_FORMAT_OPTIONS
        : { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 },
    minValue: 0,
    maxValue: unit === "fixed" ? undefined : 100,
    inputProps: { onBlur: discountBlur },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isOpen) reset(getDefaultValues(productId));
  }, [isOpen, productId, reset]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (createMutation.isPending) return;
    if (!nextIsOpen) reset(getDefaultValues(productId));
    onOpenChange(nextIsOpen);
  };
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, handleOpenChange);

  const submit = async (values: DiscountFormValues) => {
    try {
      const response = await createMutation.mutateAsync(
        toDiscountRequest({ ...values, products: [productId] })
      );
      onCreated(response.data);
      toast.show({ variant: "success", label: t("discounts.created") });
      reset(getDefaultValues(productId));
      onOpenChange(false);
    } catch (error) {
      let hasFieldError = false;
      if (isApiError(error) && error.errors) {
        for (const field of ["name", "unit", "value"] as const) {
          const message = error.errors[field]?.[0];
          if (!message) continue;
          setError(field, { type: "server", message });
          hasFieldError = true;
        }
      }
      const message = hasFieldError
        ? t("discounts.checkFields")
        : t("discounts.saveFailedDescription");
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("discounts.saveFailed"),
        description: message,
      });
    }
  };

  const footer = (
    <View className="flex-row gap-3 px-5 pb-safe pt-4">
      <PanelButton variant="ghost" onPress={() => handleOpenChange(false)}>
        {t("common.cancel")}
      </PanelButton>
      <PanelButton
        className="flex-1"
        onPress={handleSubmit(submit)}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? t("common.saving") : t("discounts.create")}
      </PanelButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, ref } }) => (
          <PanelInput
            ref={ref}
            label={t("discounts.name")}
            value={value}
            onChangeText={onChange}
            placeholder={t("discounts.namePlaceholder")}
            variant="filled"
            errorMessage={errors.name?.message}
            isRequired
          />
        )}
      />

      <Controller
        control={control}
        name="unit"
        render={({ field: { value, onChange } }) => (
          <View className="gap-2">
            <PanelLabel isRequired>{t("discounts.unit")}</PanelLabel>
            <View className="flex-row gap-2">
              {(["percentage", "fixed"] as const).map((option) => (
                <PanelButton
                  key={option}
                  variant={value === option ? "primary" : "secondary"}
                  onPress={() => onChange(option)}
                  className="flex-1"
                >
                  {option === "percentage" ? t("discounts.percentage") : t("discounts.fixed")}
                </PanelButton>
              ))}
            </View>
          </View>
        )}
      />

      <PanelInput
        ref={discountRef}
        label={t("discounts.value")}
        placeholder="0"
        variant="filled"
        isRequired
        errorMessage={errors.value?.message}
        keyboardType="numeric"
        startContent={
          unit === "fixed" ? (
            <PanelTypography type="body-sm" weight="medium" muted>
              {RUPIAH_PREFIX}
            </PanelTypography>
          ) : undefined
        }
        interactiveContent={false}

        {...discountInput}
        onBlur={(event) => {
          discountInput.onBlur(event);
        }}
      />

      {errors.root?.server?.message ? (
        <Typography type="body-sm" className="text-destructive-foreground">
          {errors.root.server.message}
        </Typography>
      ) : null}
    </View>
  );
  const title = t("discounts.quickCreateTitle");
  const description = t("discounts.quickCreateDescription");

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
            <PanelButton
              variant="ghost"
              size="sm"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3"
              onPress={() => handleOpenChange(false)}
            >
              {t("common.close")}
            </PanelButton>
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
        <PanelButton
          variant="ghost"
          size="sm"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => handleOpenChange(false)}
        >
          {t("common.close")}
        </PanelButton>
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

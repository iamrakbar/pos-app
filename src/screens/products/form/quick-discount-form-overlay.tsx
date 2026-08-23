import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import StringNumberField from "@/components/common/string-number-field";
import { isApiError } from "@/api/api-error";
import { useCreateDiscount } from "@/hooks/db/use-discounts";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS } from "@/utils/format";
import {
  createDiscountSchema,
  toDiscountRequest,
  type DiscountFormValues,
} from "@/schemas/discount";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import type { DiscountListItem } from "@/hooks/db/use-discounts";

function FieldMessage({ message }: { message?: string }) {
  return message ? (
    <Typography type="body-xs" className="text-danger">
      {message}
    </Typography>
  ) : null;
}

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
        variant: "danger",
        label: t("discounts.saveFailed"),
        description: message,
      });
    }
  };

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t("discounts.quickCreateTitle")}
      description={t("discounts.quickCreateDescription")}
      footer={
        <View className="flex-row gap-3 px-5 pb-safe pt-4">
          <Button variant="ghost" onPress={() => handleOpenChange(false)}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button
            className="flex-1"
            onPress={handleSubmit(submit)}
            isDisabled={createMutation.isPending}
          >
            <Button.Label>
              {createMutation.isPending ? t("common.saving") : t("discounts.create")}
            </Button.Label>
          </Button>
        </View>
      }
    >
      <View className="gap-4 px-5">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={Boolean(errors.name)}>
              <Label>{t("discounts.name")}</Label>
              <AdaptiveFormKeyboardHandlers>
                {(keyboardHandlers) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("discounts.namePlaceholder")}
                    variant="secondary"
                    {...keyboardHandlers}
                  />
                )}
              </AdaptiveFormKeyboardHandlers>
              <FieldMessage message={errors.name?.message} />
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="unit"
          render={({ field: { value, onChange } }) => (
            <View className="gap-2">
              <Label isRequired>{t("discounts.unit")}</Label>
              <View className="flex-row gap-2">
                {(["percentage", "fixed"] as const).map((option) => (
                  <Button
                    key={option}
                    variant={value === option ? "primary" : "secondary"}
                    onPress={() => onChange(option)}
                    className="flex-1"
                  >
                    <Button.Label>
                      {option === "percentage" ? t("discounts.percentage") : t("discounts.fixed")}
                    </Button.Label>
                  </Button>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="value"
          render={({ field: { value, onChange } }) => (
            <AdaptiveFormKeyboardHandlers>
              {(keyboardHandlers) => (
                <StringNumberField
                  label={t("discounts.value")}
                  value={value}
                  onChange={onChange}
                  placeholder="0"
                  minValue={0}
                  maxValue={unit === "percentage" ? 100 : undefined}
                  step={unit === "fixed" ? 1000 : 1}
                  formatOptions={
                    unit === "fixed"
                      ? IDR_NUMBER_FIELD_FORMAT_OPTIONS
                      : { maximumFractionDigits: 2 }
                  }
                  prefix={unit === "fixed" ? "Rp" : undefined}
                  inputVariant="secondary"
                  inputProps={keyboardHandlers}
                  isRequired
                  isInvalid={Boolean(errors.value)}
                >
                  <FieldMessage message={errors.value?.message} />
                </StringNumberField>
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

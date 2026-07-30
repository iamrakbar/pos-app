import { getErrorMessage, isApiError } from "@/api/api-error";
import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import { useCreateCategory } from "@/hooks/db/use-categories";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  createCategorySchema,
  toCategoryRequest,
  type CategoryFormValues,
} from "@/schemas/category";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, TextArea, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

type CreatedCategory = {
  id: string;
  name: string;
};

type QuickCategoryFormOverlayProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated: (category: CreatedCategory) => void;
};

export default function QuickCategoryFormOverlay({
  isOpen,
  onOpenChange,
  onCreated,
}: QuickCategoryFormOverlayProps): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const { isPhonePortrait } = useOverlayPresentation();
  const createMutation = useCreateCategory();
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema(t)),
    defaultValues: {
      name: "",
      description: "",
      position: "0",
      active: true,
    },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (createMutation.isPending) return;
    if (!nextIsOpen) reset();
    onOpenChange(nextIsOpen);
  };

  const submitCategory = async (values: CategoryFormValues) => {
    try {
      const category = await createMutation.mutateAsync(toCategoryRequest(values));
      onCreated({ id: category.id, name: category.name });
      toast.show({ variant: "success", label: t("categories.created") });
      reset();
      onOpenChange(false);
    } catch (error) {
      let hasFieldError = false;
      if (isApiError(error) && error.errors) {
        for (const field of ["name", "description"] as const) {
          const message = error.errors[field]?.[0];
          if (!message) continue;
          setError(field, { type: "server", message });
          hasFieldError = true;
        }
      }

      const message = hasFieldError ? t("categories.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "danger",
        label: t("categories.saveFailed"),
        description: message,
      });
    }
  };

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t("productForm.addCategoryTitle")}
      description={t("productForm.addCategoryDescription")}
      footer={
        <View
          className={`gap-3 px-5 pb-5 pt-4 ${
            isPhonePortrait ? "items-stretch" : "flex-row justify-end"
          }`}
        >
          <Button
            variant="ghost"
            className={isPhonePortrait ? "w-full" : undefined}
            onPress={() => handleOpenChange(false)}
            isDisabled={createMutation.isPending}
          >
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button
            className={isPhonePortrait ? "w-full" : undefined}
            onPress={handleSubmit(submitCategory)}
            isDisabled={createMutation.isPending}
          >
            <Button.Label>
              {createMutation.isPending
                ? t("common.saving")
                : t("productForm.createCategory")}
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
              <Label>{t("categories.name")}</Label>
              <AdaptiveFormKeyboardHandlers>
                {(keyboardHandlers) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("categories.namePlaceholder")}
                    {...keyboardHandlers}
                  />
                )}
              </AdaptiveFormKeyboardHandlers>
              {errors.name?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.name.message}
                </Typography>
              ) : null}
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextField isInvalid={Boolean(errors.description)}>
              <Label>{t("categories.description")}</Label>
              <AdaptiveFormKeyboardHandlers>
                {(keyboardHandlers) => (
                  <TextArea
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("categories.descriptionPlaceholder")}
                    {...keyboardHandlers}
                  />
                )}
              </AdaptiveFormKeyboardHandlers>
              {errors.description?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.description.message}
                </Typography>
              ) : null}
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

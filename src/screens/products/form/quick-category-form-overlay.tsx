import FormSheet from "@/components/common/form-sheet";
import FormDialog from "@/components/common/form-dialog";
import { Button, Typography, Input, Textarea, useToast } from "panelui-native";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { useCreateCategory } from "@/hooks/db/use-categories";
import {
  createCategorySchema,
  toCategoryRequest,
  type CategoryFormValues,
} from "@/schemas/category";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, handleOpenChange);

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
        variant: "destructive",
        label: t("categories.saveFailed"),
        description: message,
      });
    }
  };

  const footer = (
    <View className="px-5 pb-safe pt-4">
      <Button
        onPress={() => void handleSubmit(submitCategory)()}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? t("common.saving") : t("productForm.createCategory")}
      </Button>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange } }) => (
          <Input
            size="sm"
            label={t("categories.name")}
            placeholder={t("categories.namePlaceholder")}
            errorMessage={errors.name?.message}
            isRequired
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, ref } }) => (
          <Textarea
            size="sm"
            ref={ref}
            label={t("categories.description")}
            value={value}
            onChangeText={onChange}
            placeholder={t("categories.descriptionPlaceholder")}
            errorMessage={errors.description?.message}
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
  const title = t("productForm.addCategoryTitle");
  const description = t("productForm.addCategoryDescription");

  if (isPhonePortrait) {
    return (
      <FormSheet
        sheetRef={sheetRef}
        detents={[0.9]}
        onDidDismiss={handleDidDismiss}
        onClose={() => handleOpenChange(false)}
        title={title}
        description={description}
        footer={footer}
      >
        {content}
      </FormSheet>
    );
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      footer={footer}
      style={dialogKeyboardStyle}
    >
      {content}
    </FormDialog>
  );
}

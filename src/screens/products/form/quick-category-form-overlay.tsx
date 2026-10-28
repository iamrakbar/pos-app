import {
  Button as PanelButton,
  Dialog as PanelDialog,
  Typography,
  Input as PanelInput,
  Textarea as PanelTextarea,
  useToast,
} from "panelui-native";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
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
      <PanelButton onPress={handleSubmit(submitCategory)} disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.saving") : t("productForm.createCategory")}
      </PanelButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange } }) => (
          <PanelInput
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
          <PanelTextarea
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

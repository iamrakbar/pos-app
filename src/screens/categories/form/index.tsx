import ConfirmationDialog from "@/components/common/confirmation-dialog";
import SwitchFieldRow from "@/components/common/switch-field-row";
import RequestError from "@/components/common/request-error";
import { Typography, Spinner, Button, Input, useToast, Textarea, Card } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import {
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/db/use-categories";
import {
  createCategorySchema,
  toCategoryRequest,
  type CategoryFormValues,
} from "@/schemas/category";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const CATEGORY_FIELDS = new Set<keyof CategoryFormValues>([
  "name",
  "description",
  "position",
  "active",
]);

export default function CategoryFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useCSSVariable("--color-destructive") as string;
  const isNew = id === "new";
  const categoryQuery = useCategory(id);
  const category = categoryQuery.data;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(id);
  const deleteMutation = useDeleteCategory();
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const hydratedCategoryId = React.useRef<string | null>(null);
  const categorySchema = createCategorySchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", position: "0", active: true },
  });

  const {
    field: {
      value: positionFieldValue,
      onChange: positionFieldChange,
      onBlur: positionFieldBlur,
      ref: positionFieldRef,
    },
  } = useController({ control, name: "position" });
  const { localizedInputProps: positionInputProps } = useLocalizedNumberInput({
    value: positionFieldValue,
    onChange: positionFieldChange,
    minValue: 0,
    formatOptions: { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 0 },
    inputProps: { onBlur: positionFieldBlur },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isNew || !category || hydratedCategoryId.current === category.id) return;

    reset({
      name: category.name,
      description: category.description ?? "",
      position: String(category.position),
      active: category.active,
    });
    hydratedCategoryId.current = category.id;
  }, [category, isNew, reset]);

  if (!isNew && categoryQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <Spinner />
        <Typography type="body-sm" muted>
          {t("categories.loadingOne")}
        </Typography>
      </View>
    );
  }

  if (!isNew && categoryQuery.isError) {
    return (
      <RequestError error={categoryQuery.error} onRetry={() => void categoryQuery.refetch()} />
    );
  }

  const applyServerErrors = (error: unknown) => {
    if (!isApiError(error) || !error.errors) return false;
    let applied = false;

    for (const [field, messages] of Object.entries(error.errors)) {
      if (CATEGORY_FIELDS.has(field as keyof CategoryFormValues) && messages[0]) {
        setError(field as keyof CategoryFormValues, { type: "server", message: messages[0] });
        applied = true;
      }
    }

    return applied;
  };

  const submitCategory = async (values: CategoryFormValues) => {
    try {
      const request = toCategoryRequest(values);
      if (isNew) {
        await createMutation.mutateAsync(request);
      } else {
        await updateMutation.mutateAsync(request);
      }

      toast.show({
        variant: "success",
        label: isNew ? t("categories.created") : t("categories.updated"),
      });
      router.back();
    } catch (error) {
      const hasFieldErrors = applyServerErrors(error);
      const message = hasFieldErrors ? t("categories.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("categories.saveFailed"),
        description: message,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      setIsConfirmingDelete(false);
      toast.show({ variant: "success", label: t("categories.deleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("categories.deleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? t("categories.newTitle") : t("categories.editTitle") }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel={t("categories.deleteAccessibility")}
            onPress={() => setIsConfirmingDelete(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <KeyboardAwareScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6 gap-3"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="gap-4 w-full max-w-3xl overflow-hidden p-4">
          <Card.Header className="p-0">
            <View className="gap-1">
              <Card.Title>
                {isNew ? t("categories.createTitle") : t("categories.detailsTitle")}
              </Card.Title>
              <Card.Description>{t("categories.formDescription")}</Card.Description>
            </View>
          </Card.Header>

          <Card.Content className="gap-5 p-0">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <Input
                  size="sm"
                  label={t("categories.name")}
                  isRequired
                  errorMessage={errors.name?.message}
                  ref={ref}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("categories.namePlaceholder")}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <Textarea
                  size="sm"
                  label={t("categories.description")}
                  errorMessage={errors.description?.message}
                  ref={ref}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("categories.descriptionPlaceholder")}
                />
              )}
            />

            <Input
              size="sm"
              ref={positionFieldRef}
              label={t("categories.position")}
              description={t("categories.positionDescription")}
              errorMessage={errors.position?.message}
              isRequired
              keyboardType="numeric"
              {...positionInputProps}
            />

            <Controller
              control={control}
              name="active"
              render={({ field: { value, onChange } }) => (
                <SwitchFieldRow
                  value={Boolean(value)}
                  onValueChange={onChange}
                  label={t("common.active")}
                  description={t("categories.activeDescription")}
                />
              )}
            />

            {errors.root?.server?.message ? (
              <Typography type="body-sm" className="text-destructive">
                {errors.root.server.message}
              </Typography>
            ) : null}
          </Card.Content>
        </Card>

        <View className="flex-row gap-3 pt-2 w-full max-w-3xl">
          <Button variant="ghost" onPress={() => router.back()} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button
            className="flex-1"
            onPress={() => void handleSubmit(submitCategory)()}
            disabled={isSaving}
          >
            {isSaving ? t("common.saving") : t("categories.save")}
          </Button>
        </View>
      </KeyboardAwareScrollView>

      <ConfirmationDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={t("categories.deleteTitle")}
        description={t("categories.deleteDescription")}
        onConfirm={handleDelete}
        confirmLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        disabled={deleteMutation.isPending}
      />
    </>
  );
}

import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import StringNumberField from "@/components/common/string-number-field";
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
import {
  Button,
  Card,
  Input,
  Label,
  Switch,
  TextArea,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

const CATEGORY_FIELDS = new Set<keyof CategoryFormValues>([
  "name",
  "description",
  "position",
  "active",
]);

function FieldMessage({ message, fallback }: { message?: string; fallback?: string }) {
  const text = message ?? fallback;
  if (!text) return null;

  return (
    <Typography
      type="body-xs"
      color={message ? undefined : "muted"}
      className={message ? "text-danger" : undefined}
    >
      {text}
    </Typography>
  );
}

export default function CategoryFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
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
    return <LoadingState message={t("categories.loadingOne")} />;
  }

  if (!isNew && categoryQuery.isError) {
    return <ErrorState error={categoryQuery.error} onRetry={categoryQuery.refetch} />;
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
        variant: "danger",
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
        variant: "danger",
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

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6 gap-3"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="gap-4 w-full max-w-3xl overflow-hidden">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>
                {isNew ? t("categories.createTitle") : t("categories.detailsTitle")}
              </Card.Title>
              <Card.Description>{t("categories.formDescription")}</Card.Description>
            </View>
          </Card.Header>

          <Card.Body className="gap-5">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <TextField isRequired isInvalid={Boolean(errors.name)}>
                  <Label>{t("categories.name")}</Label>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("categories.namePlaceholder")}
                  />
                  <FieldMessage message={errors.name?.message} />
                </TextField>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <TextField isInvalid={Boolean(errors.description)}>
                  <Label>{t("categories.description")}</Label>
                  <TextArea
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("categories.descriptionPlaceholder")}
                  />
                  <FieldMessage message={errors.description?.message} />
                </TextField>
              )}
            />

            <Controller
              control={control}
              name="position"
              render={({ field: { value, onChange } }) => (
                <StringNumberField
                  label={t("categories.position")}
                  value={value}
                  onChange={onChange}
                  minValue={0}
                  isRequired
                  isInvalid={Boolean(errors.position)}
                >
                  <FieldMessage
                    message={errors.position?.message}
                    fallback={t("categories.positionDescription")}
                  />
                </StringNumberField>
              )}
            />

            <Controller
              control={control}
              name="active"
              render={({ field: { value, onChange } }) => (
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: value }}
                  onPress={() => onChange(!value)}
                  className="flex-row items-center justify-between gap-4 py-1"
                >
                  <View className="flex-1">
                    <Typography type="body-sm" weight="semibold">
                      {t("common.active")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {t("categories.activeDescription")}
                    </Typography>
                  </View>
                  <Switch isSelected={value} onSelectedChange={onChange} />
                </Pressable>
              )}
            />

            {errors.root?.server?.message ? (
              <Typography type="body-sm" className="text-danger">
                {errors.root.server.message}
              </Typography>
            ) : null}
          </Card.Body>
        </Card>

        <View className="flex-1 flex-col md:flex-row items-center gap-3 pt-2 w-full max-w-3xl">
          <Button variant="ghost" onPress={() => router.back()} isDisabled={isSaving}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSubmit(submitCategory)} isDisabled={isSaving}>
            <Button.Label>{isSaving ? t("common.saving") : t("categories.save")}</Button.Label>
          </Button>
        </View>
      </ScrollView>

      <ActionDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={t("categories.deleteTitle")}
        description={t("categories.deleteDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

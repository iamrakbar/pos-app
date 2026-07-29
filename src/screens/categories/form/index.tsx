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
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { categorySchema, toCategoryRequest, type CategoryFormValues } from "@/schemas/category";
import { useCategoryFormNavigation } from "@/stores/use-category-form-navigation";
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
  const { id, selectForProduct } = useLocalSearchParams<{
    id: string;
    selectForProduct?: string;
  }>();
  const router = useRouter();
  const { toast } = useToast();
  const { isCompact } = useResponsiveLayout();
  const dangerColor = useThemeColor("danger");
  const isNew = id === "new";
  const categoryQuery = useCategory(id);
  const category = categoryQuery.data;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(id);
  const deleteMutation = useDeleteCategory();
  const setCreatedCategory = useCategoryFormNavigation((state) => state.setCreatedCategory);
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const hydratedCategoryId = React.useRef<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", position: "0", active: true },
  });

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
    return <LoadingState message="Loading category…" />;
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
      const savedCategory = isNew
        ? await createMutation.mutateAsync(request)
        : await updateMutation.mutateAsync(request);

      if (isNew && selectForProduct === "true") {
        setCreatedCategory({ id: savedCategory.id, name: savedCategory.name });
      }

      toast.show({
        variant: "success",
        label: isNew ? "Category created" : "Category updated",
      });
      router.back();
    } catch (error) {
      const hasFieldErrors = applyServerErrors(error);
      const message = hasFieldErrors ? "Check the highlighted fields." : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({ variant: "danger", label: "Could not save category", description: message });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      setIsConfirmingDelete(false);
      toast.show({ variant: "success", label: "Category deleted" });
      router.back();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Could not delete category",
        description: getErrorMessage(error),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New Category" : "Edit Category" }} />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel="Delete category"
            onPress={() => setIsConfirmingDelete(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="w-full max-w-3xl overflow-hidden">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>{isNew ? "Create Category" : "Category Details"}</Card.Title>
              <Card.Description>
                Organize products and control whether this category is available.
              </Card.Description>
            </View>
          </Card.Header>

          <Card.Body className="gap-5">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <TextField isRequired isInvalid={Boolean(errors.name)}>
                  <Label>Name</Label>
                  <Input value={value} onChangeText={onChange} placeholder="Main dishes" />
                  <FieldMessage message={errors.name?.message} />
                </TextField>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <TextField isInvalid={Boolean(errors.description)}>
                  <Label>Description</Label>
                  <TextArea
                    value={value}
                    onChangeText={onChange}
                    placeholder="Optional category description"
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
                  label="Position"
                  value={value}
                  onChange={onChange}
                  minValue={0}
                  isRequired
                  isInvalid={Boolean(errors.position)}
                >
                  <FieldMessage
                    message={errors.position?.message}
                    fallback="Lower positions appear first."
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
                      Active
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      Show in product and POS category filters.
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

          <Card.Footer>
            <View className={`flex-1 gap-3 ${isCompact ? "" : "flex-row justify-end"}`}>
              <Button variant="outline" onPress={() => router.back()} isDisabled={isSaving}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                className={isCompact ? "w-full" : undefined}
                onPress={handleSubmit(submitCategory)}
                isDisabled={isSaving}
              >
                <Button.Label>{isSaving ? "Saving…" : "Save category"}</Button.Label>
              </Button>
            </View>
          </Card.Footer>
        </Card>
      </ScrollView>

      <ActionDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete category?"
        description="The server may reject deletion while products still use this category."
        actionLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

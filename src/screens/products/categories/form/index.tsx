import { getErrorMessage, isApiError } from "@/api/api-error";
import DialogCloseButton from "@/components/common/dialog-close-button";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import {
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/db/use-categories";
import { categorySchema, toCategoryRequest, type CategoryFormValues } from "@/schemas/category";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Dialog,
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
  "slug",
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
  const isNew = id === "new";
  const categoryQuery = useCategory(id);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(id);
  const deleteMutation = useDeleteCategory();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedId = React.useRef<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      position: "0",
      active: true,
    },
  });

  React.useEffect(() => {
    const category = categoryQuery.data;
    if (isNew || !category || hydratedId.current === category.id) return;
    reset({
      name: category.name,
      slug: category.slug ?? "",
      description: category.description ?? "",
      position: String(category.position),
      active: category.active,
    });
    hydratedId.current = category.id;
  }, [categoryQuery.data, isNew, reset]);

  if (!isNew && categoryQuery.isLoading) {
    return <LoadingState message="Loading category…" />;
  }

  if (!isNew && categoryQuery.isError) {
    return <ErrorState error={categoryQuery.error} onRetry={categoryQuery.refetch} />;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
      await (isNew ? createMutation.mutateAsync(request) : updateMutation.mutateAsync(request));
      toast.show({ variant: "success", label: isNew ? "Category created" : "Category updated" });
      router.back();
    } catch (error) {
      const hasFieldErrors = applyServerErrors(error);
      const message = hasFieldErrors ? "Check the highlighted fields." : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "danger",
        label: isNew ? "Could not create category" : "Could not update category",
        description: message,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      setIsDeleteOpen(false);
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

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New Category" : "Edit Category" }} />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel="Delete category"
            onPress={() => setIsDeleteOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-5 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="w-full max-w-3xl">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>Category details</Card.Title>
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
              name="slug"
              render={({ field: { value, onChange } }) => (
                <TextField isInvalid={Boolean(errors.slug)}>
                  <Label>Slug</Label>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="main-dishes"
                    autoCapitalize="none"
                  />
                  <FieldMessage
                    message={errors.slug?.message}
                    fallback="Optional URL-friendly identifier."
                  />
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
                <TextField isRequired isInvalid={Boolean(errors.position)}>
                  <Label>Position</Label>
                  <Input
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                    keyboardType="number-pad"
                    placeholder="0"
                  />
                  <FieldMessage
                    message={errors.position?.message}
                    fallback="Lower positions appear first."
                  />
                </TextField>
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
                  className="flex-row items-center justify-between gap-4"
                >
                  <View className="flex-1 gap-0.5">
                    <Typography type="body-sm" weight="semibold">
                      Active
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      Show this category in product and POS filters.
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

            <View className="flex-row justify-end gap-3">
              <Button variant="outline" onPress={() => router.back()}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button onPress={handleSubmit(submitCategory)} isDisabled={isSaving}>
                <Button.Label>{isSaving ? "Saving…" : "Save category"}</Button.Label>
              </Button>
            </View>
          </Card.Body>
        </Card>
      </ScrollView>

      <Dialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
            <DialogCloseButton />
            <View className="mb-5 gap-1.5 pr-10">
              <Dialog.Title>Delete category?</Dialog.Title>
              <Dialog.Description>
                This category will be removed. The server may reject deletion when products still
                depend on it.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setIsDeleteOpen(false)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={handleDelete}
                isDisabled={deleteMutation.isPending}
              >
                <Button.Label>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

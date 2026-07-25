import { getErrorMessage, isApiError } from "@/api/api-error";
import DialogCloseButton from "@/components/common/dialog-close-button";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/db/use-categories";
import { categorySchema, toCategoryRequest, type CategoryFormValues } from "@/schemas/category";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  Input,
  Label,
  Switch,
  TextArea,
  TextField,
  Typography,
  useToast,
} from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, View } from "react-native";

type Category = App.Data.Merchant.Category.CategoryData;

type CategoryFormDialogProps = {
  isOpen: boolean;
  category?: Category | null;
  onOpenChange: (isOpen: boolean) => void;
  onSaved?: (category: Category) => void;
  onDeleted?: (categoryId: string) => void;
};

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

export default function CategoryFormDialog({
  isOpen,
  category,
  onOpenChange,
  onSaved,
  onDeleted,
}: CategoryFormDialogProps): React.JSX.Element {
  const { toast } = useToast();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(category?.id ?? "");
  const deleteMutation = useDeleteCategory();
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "", position: "0", active: true },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    reset({
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      position: String(category?.position ?? 0),
      active: category?.active ?? true,
    });
  }, [category, isOpen, reset]);

  const handleOpenChange = (open: boolean) => {
    if (!open) setIsConfirmingDelete(false);
    onOpenChange(open);
  };

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
      const savedCategory = category
        ? await updateMutation.mutateAsync(request)
        : await createMutation.mutateAsync(request);
      toast.show({
        variant: "success",
        label: category ? "Category updated" : "Category created",
      });
      onSaved?.(savedCategory);
      handleOpenChange(false);
    } catch (error) {
      const hasFieldErrors = applyServerErrors(error);
      const message = hasFieldErrors ? "Check the highlighted fields." : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({ variant: "danger", label: "Could not save category", description: message });
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    try {
      await deleteMutation.mutateAsync(category.id);
      toast.show({ variant: "success", label: "Category deleted" });
      onDeleted?.(category.id);
      handleOpenChange(false);
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
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content isSwipeable={false} className="w-full max-w-xl self-center p-0">
          <View className="p-5 pb-0">
            <DialogCloseButton />
            <View className="gap-1.5 pr-10">
              <Dialog.Title>
                {isConfirmingDelete
                  ? "Delete category?"
                  : category
                    ? "Edit category"
                    : "New category"}
              </Dialog.Title>
              <Dialog.Description>
                {isConfirmingDelete
                  ? "The server may reject deletion while products still use this category."
                  : "Organize products and control whether this category is available."}
              </Dialog.Description>
            </View>
          </View>

          {isConfirmingDelete ? (
            <View className="flex-row justify-end gap-3 p-5">
              <Button variant="ghost" onPress={() => setIsConfirmingDelete(false)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button variant="danger" onPress={handleDelete} isDisabled={deleteMutation.isPending}>
                <Button.Label>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button.Label>
              </Button>
            </View>
          ) : (
            <>
              <ScrollView
                className="max-h-[65vh]"
                contentContainerClassName="gap-4 p-5"
                keyboardShouldPersistTaps="handled"
              >
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
              </ScrollView>
              <View className="flex-row items-center justify-between gap-3 border-t border-border p-5">
                {category ? (
                  <Button variant="danger-soft" onPress={() => setIsConfirmingDelete(true)}>
                    <Button.Label>Delete</Button.Label>
                  </Button>
                ) : (
                  <View />
                )}
                <View className="flex-row gap-3">
                  <Button variant="ghost" onPress={() => handleOpenChange(false)}>
                    <Button.Label>Cancel</Button.Label>
                  </Button>
                  <Button onPress={handleSubmit(submitCategory)} isDisabled={isSaving}>
                    <Button.Label>{isSaving ? "Saving…" : "Save category"}</Button.Label>
                  </Button>
                </View>
              </View>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

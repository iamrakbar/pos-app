import { getErrorMessage } from "@/api/api-error";
import DialogCloseButton from "@/components/common/dialog-close-button";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useAddOn, useCreateAddOn, useDeleteAddOn, useUpdateAddOn } from "@/hooks/db/use-add-ons";
import {
  addOnManagementSchema,
  toAddOnRequest,
  type AddOnManagementValues,
} from "@/schemas/add-on-management";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Dialog, Typography, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ScrollView, View } from "react-native";
import OptionRow from "./option-row";
import SelectionRulesCard from "./selection-rules-card";

const EMPTY_OPTION = { id: null, name: "", price: "0", destroyed: false };

export default function AddOnFormScreen(): React.JSX.Element {
  const { productId, addOnId } = useLocalSearchParams<{
    productId: string;
    addOnId: string;
  }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
  const isNew = addOnId === "new";
  const addOnQuery = useAddOn(productId, addOnId);
  const createMutation = useCreateAddOn(productId);
  const updateMutation = useUpdateAddOn(productId, addOnId);
  const deleteMutation = useDeleteAddOn(productId);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedId = React.useRef<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AddOnManagementValues>({
    resolver: zodResolver(addOnManagementSchema),
    defaultValues: {
      name: "",
      required: false,
      multiple: false,
      min: "0",
      max: "1",
      options: [EMPTY_OPTION],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const options = useWatch({ control, name: "options" });

  React.useEffect(() => {
    const addOn = addOnQuery.data;
    if (isNew || !addOn || hydratedId.current === addOn.id) return;
    reset({
      name: addOn.name,
      required: addOn.min > 0,
      multiple: addOn.max > 1,
      min: String(addOn.min),
      max: String(addOn.max),
      options: addOn.options.map((option) => ({
        id: option.id,
        name: option.name,
        price: String(option.price),
        destroyed: false,
      })),
    });
    hydratedId.current = addOn.id;
  }, [addOnQuery.data, isNew, reset]);

  if (!isNew && addOnQuery.isLoading) return <LoadingState message="Loading add-on…" />;
  if (!isNew && addOnQuery.isError) {
    return <ErrorState error={addOnQuery.error} onRetry={addOnQuery.refetch} />;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleRemoveOption = (index: number) => {
    if (options[index]?.id) {
      setValue(`options.${index}.destroyed`, true, { shouldDirty: true, shouldValidate: true });
    } else {
      remove(index);
    }
  };

  const submitAddOn = async (values: AddOnManagementValues) => {
    try {
      const request = toAddOnRequest(values);
      await (isNew ? createMutation.mutateAsync(request) : updateMutation.mutateAsync(request));
      toast.show({ variant: "success", label: isNew ? "Add-on created" : "Add-on updated" });
      router.back();
    } catch (error) {
      const message = getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({ variant: "danger", label: "Could not save add-on", description: message });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(addOnId);
      setIsDeleteOpen(false);
      toast.show({ variant: "success", label: "Add-on deleted" });
      router.back();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Could not delete add-on",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New Add-on" : "Edit Add-on" }} />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel="Delete add-on group"
            onPress={() => setIsDeleteOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-5 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-3xl gap-4">
          <SelectionRulesCard control={control} errors={errors} setValue={setValue} />

          <Card>
            <Card.Header>
              <View className="gap-1">
                <Card.Title>Options</Card.Title>
                <Card.Description>
                  This previews the names and price adjustments shown to the cashier.
                </Card.Description>
              </View>
            </Card.Header>
            <Card.Body className="gap-3">
              {fields.map((field, index) => (
                <OptionRow
                  key={field.id}
                  control={control}
                  errors={errors}
                  index={index}
                  isDestroyed={options[index]?.destroyed ?? false}
                  canRestore={Boolean(options[index]?.id)}
                  onRemove={() => handleRemoveOption(index)}
                  onRestore={() =>
                    setValue(`options.${index}.destroyed`, false, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              ))}
              {errors.options?.root?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.options.root.message}
                </Typography>
              ) : null}
              <Button variant="outline" onPress={() => append(EMPTY_OPTION)}>
                <Button.Label>Add option</Button.Label>
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Footer>
              <View className="flex-1 gap-3">
                {errors.root?.server?.message ? (
                  <Typography type="body-sm" className="text-danger">
                    {errors.root.server.message}
                  </Typography>
                ) : null}
                <View className="flex-row gap-3">
                  <Button variant="outline" onPress={() => router.back()}>
                    <Button.Label>Cancel</Button.Label>
                  </Button>
                  <Button
                    className="flex-1"
                    onPress={handleSubmit(submitAddOn)}
                    isDisabled={isSaving}
                  >
                    <Button.Label>{isSaving ? "Saving…" : "Save add-on"}</Button.Label>
                  </Button>
                </View>
              </View>
            </Card.Footer>
          </Card>
        </View>
      </ScrollView>

      <Dialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
            <DialogCloseButton />
            <View className="mb-5 gap-1.5 pr-10">
              <Dialog.Title>Delete add-on group?</Dialog.Title>
              <Dialog.Description>
                This removes the group and all of its options from the product.
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

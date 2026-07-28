import { getErrorMessage, isApiError } from "@/api/api-error";
import DialogCloseButton from "@/components/common/dialog-close-button";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useArea, useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { areaSchema, type AreaFormValues } from "@/schemas/area";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Dialog,
  Input,
  Label,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";

export default function AreaFormScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
  const isNew = id === "new";
  const areaQuery = useArea(id);
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea(id);
  const deleteMutation = useDeleteArea();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedId = React.useRef<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    const area = areaQuery.data;
    if (isNew || !area || hydratedId.current === area.id) return;
    reset({ name: area.name });
    hydratedId.current = area.id;
  }, [areaQuery.data, isNew, reset]);

  if (!isNew && areaQuery.isLoading) return <LoadingState message="Loading area…" />;
  if (!isNew && areaQuery.isError) {
    return <ErrorState error={areaQuery.error} onRetry={areaQuery.refetch} />;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submitArea = async (values: AreaFormValues) => {
    try {
      await (isNew ? createMutation.mutateAsync(values) : updateMutation.mutateAsync(values));
      toast.show({ variant: "success", label: isNew ? "Area created" : "Area updated" });
      router.back();
    } catch (error) {
      const fieldMessage = isApiError(error) ? error.errors?.name?.[0] : undefined;
      if (fieldMessage) setError("name", { type: "server", message: fieldMessage });
      const message = fieldMessage ?? getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({ variant: "danger", label: "Could not save area", description: message });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      setIsDeleteOpen(false);
      toast.show({ variant: "success", label: "Area deleted" });
      router.back();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Could not delete area",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: isNew ? "New Area" : "Edit Area" }} />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel="Delete area"
            onPress={() => setIsDeleteOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="w-full max-w-3xl">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>Seating area</Card.Title>
              <Card.Description>Name the space where its tables are located.</Card.Description>
            </View>
          </Card.Header>
          <Card.Body className="gap-5">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <TextField isRequired isInvalid={Boolean(errors.name)}>
                  <Label>Name</Label>
                  <Input value={value} onChangeText={onChange} placeholder="Indoor" />
                  {errors.name?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {errors.name.message}
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
            {!isNew ? (
              <Button variant="outline" onPress={() => router.push(`/settings/areas/${id}/tables`)}>
                <Button.Label>Manage tables</Button.Label>
              </Button>
            ) : null}
            <View className="flex-row justify-end gap-3">
              <Button variant="outline" onPress={() => router.back()}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button onPress={handleSubmit(submitArea)} isDisabled={isSaving}>
                <Button.Label>{isSaving ? "Saving…" : "Save area"}</Button.Label>
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
              <Dialog.Title>Delete area?</Dialog.Title>
              <Dialog.Description>
                The server may reject deletion while tables or orders still reference this area.
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

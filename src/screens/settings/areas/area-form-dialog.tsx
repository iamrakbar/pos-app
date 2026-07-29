import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import { useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { areaSchema, type AreaFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

type AreaData = App.Data.Merchant.Area.AreaData;

type AreaFormDialogProps = {
  area: AreaData | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function AreaFormDialog({
  area,
  isOpen,
  onOpenChange,
}: AreaFormDialogProps): React.JSX.Element {
  const { toast } = useToast();
  const { isPhonePortrait } = useOverlayPresentation();
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea(area?.id ?? "");
  const deleteMutation = useDeleteArea();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
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
    if (!isOpen) return;
    reset({ name: area?.name ?? "" });
  }, [area, isOpen, reset]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submitArea = async (values: AreaFormValues) => {
    try {
      await (area ? updateMutation.mutateAsync(values) : createMutation.mutateAsync(values));
      toast.show({ variant: "success", label: area ? "Area updated" : "Area created" });
      onOpenChange(false);
    } catch (error) {
      const fieldMessage = isApiError(error) ? error.errors?.name?.[0] : undefined;
      if (fieldMessage) setError("name", { type: "server", message: fieldMessage });
      const message = fieldMessage ?? getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({ variant: "danger", label: "Could not save area", description: message });
    }
  };

  const handleDelete = async () => {
    if (!area) return;
    try {
      await deleteMutation.mutateAsync(area.id);
      setIsDeleteOpen(false);
      onOpenChange(false);
      toast.show({ variant: "success", label: "Area deleted" });
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
      <AdaptiveFormOverlay
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={area ? "Edit area" : "New area"}
        description="Name the space where its tables are located."
        footer={
          <View
            className={`gap-3 px-5 pb-5 pt-4 ${
              isPhonePortrait ? "items-stretch" : "flex-row items-center"
            }`}
          >
            {area ? (
              <Button
                variant="danger-soft"
                className={isPhonePortrait ? "w-full" : undefined}
                onPress={() => setIsDeleteOpen(true)}
              >
                <Button.Label>Delete</Button.Label>
              </Button>
            ) : null}
            <View
              className={`gap-3 ${
                isPhonePortrait ? "items-stretch" : "ml-auto flex-row justify-end"
              }`}
            >
              <Button
                variant="ghost"
                className={isPhonePortrait ? "w-full" : undefined}
                onPress={() => onOpenChange(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                className={isPhonePortrait ? "w-full" : undefined}
                onPress={handleSubmit(submitArea)}
                isDisabled={isSaving}
              >
                <Button.Label>{isSaving ? "Saving…" : "Save area"}</Button.Label>
              </Button>
            </View>
          </View>
        }
      >
        <View className="gap-4 px-5">
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <TextField isRequired isInvalid={Boolean(errors.name)}>
                <Label>Name</Label>
                <Input value={value} onChangeText={onChange} placeholder="Indoor" autoFocus />
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
        </View>
      </AdaptiveFormOverlay>

      <ActionDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete area?"
        description="The server may reject deletion while tables or orders still reference this area."
        actionLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

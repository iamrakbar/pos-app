import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import StringNumberField from "@/components/common/string-number-field";
import { useCreateTable, useDeleteTable, useUpdateTable } from "@/hooks/db/use-tables";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { tableSchema, toTableRequest, type TableFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, Switch, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";

type TableData = App.Data.Merchant.Area.TableData;

type TableFormDialogProps = {
  areaId: string;
  table: TableData | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function TableFormDialog({
  areaId,
  table,
  isOpen,
  onOpenChange,
}: TableFormDialogProps): React.JSX.Element {
  const { toast } = useToast();
  const { isPhonePortrait } = useOverlayPresentation();
  const createMutation = useCreateTable(areaId);
  const updateMutation = useUpdateTable(areaId, table?.id ?? "");
  const deleteMutation = useDeleteTable(areaId);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: "", pax: "1", active: true },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    reset({
      name: table?.name ?? "",
      pax: String(table?.pax ?? 1),
      active: table?.active ?? true,
    });
  }, [isOpen, reset, table]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submitTable = async (values: TableFormValues) => {
    try {
      const request = toTableRequest(values);
      await (table ? updateMutation.mutateAsync(request) : createMutation.mutateAsync(request));
      toast.show({ variant: "success", label: table ? "Table updated" : "Table created" });
      onOpenChange(false);
    } catch (error) {
      if (isApiError(error) && error.errors) {
        for (const field of ["name", "pax", "active"] as const) {
          const message = error.errors[field]?.[0];
          if (message) setError(field, { type: "server", message });
        }
      }
      toast.show({
        variant: "danger",
        label: "Could not save table",
        description: getErrorMessage(error),
      });
    }
  };

  const handleDelete = async () => {
    if (!table) return;
    try {
      await deleteMutation.mutateAsync(table.id);
      setIsDeleteOpen(false);
      onOpenChange(false);
      toast.show({ variant: "success", label: "Table deleted" });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Could not delete table",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <AdaptiveFormOverlay
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={table ? "Edit table" : "New table"}
        description="Set the table name and seating capacity."
        footer={
          <View
            className={`gap-3 px-5 pb-5 pt-4 ${
              isPhonePortrait ? "items-stretch" : "flex-row items-center"
            }`}
          >
            {table ? (
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
                onPress={handleSubmit(submitTable)}
                isDisabled={isSaving}
              >
                <Button.Label>{isSaving ? "Saving…" : "Save table"}</Button.Label>
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
                <Input value={value} onChangeText={onChange} placeholder="A1" />
                {errors.name?.message ? (
                  <Typography type="body-xs" className="text-danger">
                    {errors.name.message}
                  </Typography>
                ) : null}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="pax"
            render={({ field: { value, onChange } }) => (
              <StringNumberField
                label="Capacity"
                value={value}
                onChange={onChange}
                minValue={1}
                isRequired
                isInvalid={Boolean(errors.pax)}
              >
                {errors.pax?.message ? (
                  <Typography type="body-xs" className="text-danger">
                    {errors.pax.message}
                  </Typography>
                ) : null}
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
                    Available for dine-in checkout.
                  </Typography>
                </View>
                <Switch isSelected={value} onSelectedChange={onChange} />
              </Pressable>
            )}
          />
        </View>
      </AdaptiveFormOverlay>
      <ActionDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete table?"
        description="The server may reject deletion when an order references this table."
        actionLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

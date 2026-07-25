import { getErrorMessage, isApiError } from "@/api/api-error";
import DialogCloseButton from "@/components/common/dialog-close-button";
import { useCreateTable, useUpdateTable } from "@/hooks/db/use-tables";
import { tableSchema, toTableRequest, type TableFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  Input,
  Label,
  Switch,
  TextField,
  Typography,
  useToast,
} from "heroui-native";
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
  const createMutation = useCreateTable(areaId);
  const updateMutation = useUpdateTable(areaId, table?.id ?? "");
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

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
          <DialogCloseButton />
          <View className="mb-5 gap-1.5 pr-10">
            <Dialog.Title>{table ? "Edit table" : "New table"}</Dialog.Title>
            <Dialog.Description>Set the table name and seating capacity.</Dialog.Description>
          </View>
          <View className="gap-4">
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
                <TextField isRequired isInvalid={Boolean(errors.pax)}>
                  <Label>Capacity</Label>
                  <Input
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                    keyboardType="number-pad"
                  />
                  {errors.pax?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {errors.pax.message}
                    </Typography>
                  ) : null}
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
                      Available for dine-in checkout.
                    </Typography>
                  </View>
                  <Switch isSelected={value} onSelectedChange={onChange} />
                </Pressable>
              )}
            />
            <View className="flex-row justify-end gap-3 pt-2">
              <Button variant="ghost" onPress={() => onOpenChange(false)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button onPress={handleSubmit(submitTable)} isDisabled={isSaving}>
                <Button.Label>{isSaving ? "Saving…" : "Save table"}</Button.Label>
              </Button>
            </View>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

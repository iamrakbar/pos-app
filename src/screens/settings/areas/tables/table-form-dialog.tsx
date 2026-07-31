import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import StringNumberField from "@/components/common/string-number-field";
import { useCreateTable, useDeleteTable, useUpdateTable } from "@/hooks/db/use-tables";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { createTableSchema, toTableRequest, type TableFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, Switch, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

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
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const { isPhonePortrait } = useOverlayPresentation();
  const createMutation = useCreateTable(areaId);
  const updateMutation = useUpdateTable(areaId, table?.id ?? "");
  const deleteMutation = useDeleteTable(areaId);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const tableSchema = createTableSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: "", pax: "1", active: true },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

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
      toast.show({
        variant: "success",
        label: table ? t("areasManagement.tableUpdated") : t("areasManagement.tableCreated"),
      });
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
        label: t("areasManagement.tableSaveFailed"),
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
      toast.show({ variant: "success", label: t("areasManagement.tableDeleted") });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("areasManagement.tableDeleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <AdaptiveFormOverlay
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={table ? t("areasManagement.editTable") : t("areasManagement.newTable")}
        description={t("areasManagement.tableDescription")}
        footer={
          <View
            className={`gap-3 px-5 pb-5 pt-4 ${
              isPhonePortrait ? "items-stretch" : "flex-row items-center"
            }`}
          >
            <View className="flex-1 flex-row items-center gap-3">
              {table ? (
                <Button variant="danger-soft" onPress={() => setIsDeleteOpen(true)}>
                  <Button.Label>{t("common.delete")}</Button.Label>
                </Button>
              ) : null}
              <Button className="flex-1" onPress={handleSubmit(submitTable)} isDisabled={isSaving}>
                <Button.Label>
                  {isSaving ? t("common.saving") : t("areasManagement.saveTable")}
                </Button.Label>
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
                <Label>{t("areasManagement.name")}</Label>
                <AdaptiveFormKeyboardHandlers>
                  {(keyboardHandlers) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder={t("areasManagement.tableNamePlaceholder")}
                      variant="secondary"
                      {...keyboardHandlers}
                    />
                  )}
                </AdaptiveFormKeyboardHandlers>
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
              <AdaptiveFormKeyboardHandlers>
                {(keyboardHandlers) => (
                  <StringNumberField
                    label={t("areasManagement.capacity")}
                    value={value}
                    onChange={onChange}
                    minValue={1}
                    isRequired
                    isInvalid={Boolean(errors.pax)}
                    inputProps={keyboardHandlers}
                    inputVariant="secondary"
                  >
                    {errors.pax?.message ? (
                      <Typography type="body-xs" className="text-danger">
                        {errors.pax.message}
                      </Typography>
                    ) : null}
                  </StringNumberField>
                )}
              </AdaptiveFormKeyboardHandlers>
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
                    {t("areasManagement.tableActiveDescription")}
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
        title={t("areasManagement.deleteTableTitle")}
        description={t("areasManagement.deleteTableDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

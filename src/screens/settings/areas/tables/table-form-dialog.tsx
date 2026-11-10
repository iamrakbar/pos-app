import FormSheet from "@/components/common/form-sheet";
import FormDialog from "@/components/common/form-dialog";
import SheetDeleteConfirmation from "@/components/common/sheet-delete-confirmation";
import SwitchFieldRow from "@/components/common/switch-field-row";
import SheetOverlayHost from "@/components/common/sheet-overlay-host";
import { Button, Input, NumberInput, useToast, cn } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { useCreateTable, useDeleteTable, useUpdateTable } from "@/hooks/db/use-tables";
import { createTableSchema, toTableRequest, type TableFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import TableSymbol, { TableSeatCount } from "@/components/table-symbol";
import Animated from "react-native-reanimated";

type TableData = App.Data.Merchant.Area.TableData;

type TableFormDialogProps = {
  areaId: string;
  table: TableData | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

function getTableSeatCount(pax: number): TableSeatCount {
  return Math.max(1, Math.min(8, Math.round(pax))) as TableSeatCount;
}

export default function TableFormDialog({
  areaId,
  table,
  isOpen,
  onOpenChange,
}: TableFormDialogProps): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const accentColor = useCSSVariable("--color-primary") as string;
  const surfaceColor = useCSSVariable("--color-surface") as string;
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, onOpenChange);
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
  const {
    field: { value: capacityValue, onChange: capacityChange, onBlur: capacityBlur },
  } = useController({ control, name: "pax" });

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
        variant: "destructive",
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
        variant: "destructive",
        label: t("areasManagement.tableDeleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const footer = (
    <View
      className={cn(
        "gap-3 px-5 pb-5 pt-4",
        isPhonePortrait ? "items-stretch" : "flex-row items-center"
      )}
    >
      <View className="flex-1 flex-row items-center gap-3">
        {table ? (
          <Button variant="destructive" onPress={() => setIsDeleteOpen(true)}>
            {t("common.delete")}
          </Button>
        ) : null}
        <Button
          className="flex-1"
          onPress={() => void handleSubmit(submitTable)()}
          disabled={isSaving}
        >
          {isSaving ? t("common.saving") : t("areasManagement.saveTable")}
        </Button>
      </View>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange } }) => (
          <Input
            size="sm"
            label={t("areasManagement.name")}
            placeholder={t("areasManagement.tableNamePlaceholder")}
            errorMessage={errors.name?.message}
            isRequired
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <View className="gap-2">
        <Animated.View className="w-32 h-24 self-center items-center justify-center bg-surface-secondary p-5 rounded-3xl">
          <TableSymbol
            seats={getTableSeatCount(Number(capacityValue))}
            scale={0.4}
            color={accentColor}
          />
        </Animated.View>
        <NumberInput
          size="sm"
          label={t("areasManagement.capacity")}
          errorMessage={errors.pax?.message}
          isRequired
          value={Number(capacityValue || 1)}
          min={1}
          step={1}
          onValueChange={(value) => capacityChange(String(value))}
          onBlur={capacityBlur}
        />
      </View>

      <Controller
        control={control}
        name="active"
        render={({ field: { value, onChange } }) => (
          <SwitchFieldRow
            value={Boolean(value)}
            onValueChange={onChange}
            label={t("common.active")}
            description={t("areasManagement.tableActiveDescription")}
          />
        )}
      />
    </View>
  );
  const title = table ? t("areasManagement.editTable") : t("areasManagement.newTable");
  const description = t("areasManagement.tableDescription");

  const deleteDialog = (
    <SheetDeleteConfirmation
      open={isDeleteOpen}
      onOpenChange={setIsDeleteOpen}
      title={t("areasManagement.deleteTableTitle")}
      description={t("areasManagement.deleteTableDescription")}
      isPending={deleteMutation.isPending}
      onDelete={handleDelete}
    />
  );

  return (
    <>
      {isPhonePortrait ? (
        <FormSheet
          sheetRef={sheetRef}
          detents={[0.75, 0.9]}
          backgroundColor={surfaceColor}
          onDidDismiss={handleDidDismiss}
          onClose={() => onOpenChange(false)}
          title={title}
          description={description}
          footer={footer}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-4">
            {content}
          </ScrollView>
        </FormSheet>
      ) : (
        <FormDialog
          open={isOpen}
          onOpenChange={onOpenChange}
          title={title}
          description={description}
          footer={footer}
          style={dialogKeyboardStyle}
        >
          {content}
        </FormDialog>
      )}
      {isPhonePortrait ? (
        <SheetOverlayHost visible={isDeleteOpen} onRequestClose={() => setIsDeleteOpen(false)}>
          {deleteDialog}
        </SheetOverlayHost>
      ) : (
        deleteDialog
      )}
    </>
  );
}

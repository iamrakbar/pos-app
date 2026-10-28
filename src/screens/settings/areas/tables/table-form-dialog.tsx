import {
  Button as PanelDialogButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  NumberInput,
  Switch as PanelSwitch,
  Typography as PanelTypography,
  useToast,
  cn,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useCreateTable, useDeleteTable, useUpdateTable } from "@/hooks/db/use-tables";
import { createTableSchema, toTableRequest, type TableFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { Pressable as ActiveFieldPressable, View } from "react-native";
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
          <PanelDialogButton variant="destructive" onPress={() => setIsDeleteOpen(true)}>
            {t("common.delete")}
          </PanelDialogButton>
        ) : null}
        <PanelDialogButton
          className="flex-1"
          onPress={handleSubmit(submitTable)}
          disabled={isSaving}
        >
          {isSaving ? t("common.saving") : t("areasManagement.saveTable")}
        </PanelDialogButton>
      </View>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange } }) => (
          <PanelInput
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
          <ActiveFieldPressable
            accessible={false}
            onPress={() => onChange(!value)}
            className="flex-row items-center justify-between gap-4 py-1"
          >
            <View className="flex-1">
              <PanelTypography type="body-sm" weight="semibold">
                {t("common.active")}
              </PanelTypography>
              <PanelTypography type="body-xs" muted>
                {t("areasManagement.tableActiveDescription")}
              </PanelTypography>
            </View>
            <PanelSwitch
              value={Boolean(value)}
              onValueChange={onChange}
              accessibilityLabel={t("common.active")}
              accessibilityHint={t("areasManagement.tableActiveDescription")}
            />
          </ActiveFieldPressable>
        )}
      />
    </View>
  );
  const title = table ? t("areasManagement.editTable") : t("areasManagement.newTable");
  const description = t("areasManagement.tableDescription");

  return (
    <>
      {isPhonePortrait ? (
        <TrueSheet
          ref={sheetRef}
          detents={[0.9]}
          scrollable
          cornerRadius={24}
          grabber
          dimmed
          onDidDismiss={handleDidDismiss}
          header={
            <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
              <PanelTypography type="h4" weight="semibold">
                {title}
              </PanelTypography>
              <PanelTypography type="body-sm" muted>
                {description}
              </PanelTypography>
              <PanelDialogButton
                variant="ghost"
                size="sm"
                accessibilityLabel={t("common.close")}
                className="absolute right-3 top-3"
                onPress={() => onOpenChange(false)}
              >
                {t("common.close")}
              </PanelDialogButton>
            </View>
          }
          footer={<View className="bg-surface">{footer}</View>}
        >
          {content}
        </TrueSheet>
      ) : (
        <PanelDialog open={isOpen} onOpenChange={onOpenChange}>
          <PanelDialog.Content
            dismissible={false}
            className="w-full max-w-md self-center overflow-hidden p-0"
            style={dialogKeyboardStyle}
          >
            <PanelDialogButton
              variant="ghost"
              size="sm"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3 z-50"
              onPress={() => onOpenChange(false)}
            >
              {t("common.close")}
            </PanelDialogButton>
            <View className="gap-1.5 px-5 pb-4 pr-14 pt-5">
              <PanelDialog.Title>{title}</PanelDialog.Title>
              <PanelDialog.Description>{description}</PanelDialog.Description>
            </View>
            {content}
            {footer}
          </PanelDialog.Content>
        </PanelDialog>
      )}
      <PanelDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <PanelDialog.Content dismissible={false} className="w-full max-w-md self-center">
          <PanelDialogButton
            variant="ghost"
            size="icon"
            accessibilityLabel={t("common.close")}
            className="absolute right-3 top-3 z-50"
            onPress={() => setIsDeleteOpen(false)}
          >
            ×
          </PanelDialogButton>
          <View className="mb-5 gap-1.5">
            <View className="pr-10">
              <PanelDialog.Title>{t("areasManagement.deleteTableTitle")}</PanelDialog.Title>
            </View>
            <PanelDialog.Description>
              {t("areasManagement.deleteTableDescription")}
            </PanelDialog.Description>
          </View>
          <View className="flex-row items-center gap-3">
            <PanelDialogButton variant="ghost" size="sm" onPress={() => setIsDeleteOpen(false)}>
              {t("common.cancel")}
            </PanelDialogButton>
            <PanelDialogButton
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onPress={handleDelete}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </PanelDialogButton>
          </View>
        </PanelDialog.Content>
      </PanelDialog>
    </>
  );
}

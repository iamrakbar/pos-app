import FormSheet from "@/components/common/form-sheet";
import FormDialog from "@/components/common/form-dialog";
import SheetDeleteConfirmation from "@/components/common/sheet-delete-confirmation";
import SheetOverlayHost from "@/components/common/sheet-overlay-host";
import { Typography, Button, Input, useToast, cn } from "panelui-native";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { createAreaSchema, type AreaFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import { useCSSVariable } from "uniwind";

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
  const { locale, t } = useTranslation();
  const surfaceColor = useCSSVariable("--color-surface") as string;
  const { toast } = useToast();
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea(area?.id ?? "");
  const deleteMutation = useDeleteArea();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const { isPhonePortrait, sheetRef, handleDidDismiss, dialogKeyboardStyle } =
    useAdaptiveOverlayPresentation(isOpen, onOpenChange);
  const areaSchema = createAreaSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (!isOpen) return;
    reset({ name: area?.name ?? "" });
  }, [area, isOpen, reset]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submitArea = async (values: AreaFormValues) => {
    try {
      await (area ? updateMutation.mutateAsync(values) : createMutation.mutateAsync(values));
      toast.show({
        variant: "success",
        label: area ? t("areasManagement.areaUpdated") : t("areasManagement.areaCreated"),
      });
      onOpenChange(false);
    } catch (error) {
      const fieldMessage = isApiError(error) ? error.errors?.name?.[0] : undefined;
      if (fieldMessage) setError("name", { type: "server", message: fieldMessage });
      const message = fieldMessage ?? getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("areasManagement.areaSaveFailed"),
        description: message,
      });
    }
  };

  const handleDelete = async () => {
    if (!area) return;
    try {
      await deleteMutation.mutateAsync(area.id);
      setIsDeleteOpen(false);
      onOpenChange(false);
      toast.show({ variant: "success", label: t("areasManagement.areaDeleted") });
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("areasManagement.areaDeleteFailed"),
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
        {area ? (
          <Button variant="destructive" size="sm" onPress={() => setIsDeleteOpen(true)}>
            {t("common.delete")}
          </Button>
        ) : null}
        <Button
          className="flex-1"
          onPress={() => void handleSubmit(submitArea)()}
          disabled={isSaving}
        >
          {isSaving ? t("common.saving") : t("areasManagement.saveArea")}
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
            placeholder={t("areasManagement.areaNamePlaceholder")}
            errorMessage={errors.name?.message}
            isRequired
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.root?.server?.message ? (
        <Typography type="body-sm" className="text-destructive">
          {errors.root.server.message}
        </Typography>
      ) : null}
    </View>
  );
  const title = area ? t("areasManagement.editAreaOverlay") : t("areasManagement.newAreaOverlay");
  const description = t("areasManagement.areaDescription");

  return (
    <>
      {isPhonePortrait ? (
        <FormSheet
          sheetRef={sheetRef}
          detents={[0.6, 0.9]}
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

      <SheetOverlayHost
        enabled={isPhonePortrait}
        visible={isDeleteOpen}
        onRequestClose={() => setIsDeleteOpen(false)}
      >
        <SheetDeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title={t("areasManagement.deleteAreaTitle")}
          description={t("areasManagement.deleteAreaDescription")}
          isPending={deleteMutation.isPending}
          onDelete={handleDelete}
        />
      </SheetOverlayHost>
    </>
  );
}

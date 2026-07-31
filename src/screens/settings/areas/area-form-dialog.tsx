import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import AdaptiveFormOverlay, {
  AdaptiveFormKeyboardHandlers,
} from "@/components/common/adaptive-form-overlay";
import { useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { createAreaSchema, type AreaFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, TextField, Typography, useToast } from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

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
  const { toast } = useToast();
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea(area?.id ?? "");
  const deleteMutation = useDeleteArea();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
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
        variant: "danger",
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
        variant: "danger",
        label: t("areasManagement.areaDeleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <AdaptiveFormOverlay
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={area ? t("areasManagement.editAreaOverlay") : t("areasManagement.newAreaOverlay")}
        description={t("areasManagement.areaDescription")}
        footer={
          <View className="gap-3 px-5 pb-5 pt-4">
            <View className="flex-1 flex-row items-center gap-3">
              {area ? (
                <Button variant="danger-soft" size="sm" onPress={() => setIsDeleteOpen(true)}>
                  <Button.Label>{t("common.delete")}</Button.Label>
                </Button>
              ) : null}
              <Button className="flex-1" onPress={handleSubmit(submitArea)} isDisabled={isSaving}>
                <Button.Label>
                  {isSaving ? t("common.saving") : t("areasManagement.saveArea")}
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
                      placeholder={t("areasManagement.areaNamePlaceholder")}
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
        title={t("areasManagement.deleteAreaTitle")}
        description={t("areasManagement.deleteAreaDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

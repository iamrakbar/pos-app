import {
  Typography,
  Button as PanelDialogButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  useToast,
  cn,
} from "panelui-native";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { createAreaSchema, type AreaFormValues } from "@/schemas/area";
import { zodResolver } from "@hookform/resolvers/zod";
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
          <PanelDialogButton variant="destructive" size="sm" onPress={() => setIsDeleteOpen(true)}>
            {t("common.delete")}
          </PanelDialogButton>
        ) : null}
        <PanelDialogButton
          className="flex-1"
          onPress={handleSubmit(submitArea)}
          disabled={isSaving}
        >
          {isSaving ? t("common.saving") : t("areasManagement.saveArea")}
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
            placeholder={t("areasManagement.areaNamePlaceholder")}
            errorMessage={errors.name?.message}
            isRequired
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.root?.server?.message ? (
        <Typography type="body-sm" className="text-destructive-foreground">
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
              <Typography type="h4" weight="semibold">
                {title}
              </Typography>
              <Typography type="body-sm" muted>
                {description}
              </Typography>
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
              <PanelDialog.Title>{t("areasManagement.deleteAreaTitle")}</PanelDialog.Title>
            </View>
            <PanelDialog.Description>
              {t("areasManagement.deleteAreaDescription")}
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

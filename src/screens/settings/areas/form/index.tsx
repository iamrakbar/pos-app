import { Typography ,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Button as PanelButton,
  Dialog as PanelDialog,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Input as PanelInput, Card } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useArea, useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { createAreaSchema, type AreaFormValues } from "@/schemas/area";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useTranslation } from "@/stores/use-locale";

export default function AreaFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useCSSVariable("--color-destructive") as string;
  const isNew = id === "new";
  const areaQuery = useArea(id);
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea(id);
  const deleteMutation = useDeleteArea();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedId = React.useRef<string | null>(null);
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
    const area = areaQuery.data;
    if (isNew || !area || hydratedId.current === area.id) return;
    reset({ name: area.name });
    hydratedId.current = area.id;
  }, [areaQuery.data, isNew, reset]);

  if (!isNew && areaQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("areasManagement.loadingArea")}
        </PanelLoadingText>
      </View>
    );
  }
  if (!isNew && areaQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(areaQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void areaQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const submitArea = async (values: AreaFormValues) => {
    try {
      await (isNew ? createMutation.mutateAsync(values) : updateMutation.mutateAsync(values));
      toast.show({
        variant: "success",
        label: isNew ? t("areasManagement.areaCreated") : t("areasManagement.areaUpdated"),
      });
      router.back();
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
    try {
      await deleteMutation.mutateAsync(id);
      setIsDeleteOpen(false);
      toast.show({ variant: "success", label: t("areasManagement.areaDeleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("areasManagement.areaDeleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isNew ? t("areasManagement.newArea") : t("areasManagement.editArea"),
        }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel={t("areasManagement.deleteAreaAccessibility")}
            onPress={() => setIsDeleteOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <KeyboardAwareScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Card className="w-full max-w-3xl p-4">
          <Card.Header className="p-0">
            <View className="gap-1">
              <Card.Title>{t("areasManagement.seatingArea")}</Card.Title>
              <Card.Description>{t("areasManagement.areaDescription")}</Card.Description>
            </View>
          </Card.Header>
          <Card.Content className="gap-5 p-0">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <PanelInput
                  ref={ref}
                  label={t("areasManagement.name")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t("areasManagement.areaNamePlaceholder")}

                  isRequired
                  errorMessage={errors.name?.message}
                />
              )}
            />
            {errors.root?.server?.message ? (
              <Typography type="body-sm" className="text-destructive">
                {errors.root.server.message}
              </Typography>
            ) : null}
            {!isNew ? (
              <PanelButton variant="outline" onPress={() => router.push(`/settings/areas/${id}/tables`)}>
                {t("areasManagement.manageTables")}
              </PanelButton>
            ) : null}
            <View className="flex-row justify-end gap-3">
              <PanelButton variant="ghost" onPress={() => router.back()}>
                {t("common.cancel")}
              </PanelButton>
              <PanelButton onPress={handleSubmit(submitArea)} disabled={isSaving}>
                {isSaving ? t("common.saving") : t("areasManagement.saveArea")}
              </PanelButton>
            </View>
          </Card.Content>
        </Card>
      </KeyboardAwareScrollView>

      <PanelDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("areasManagement.deleteAreaTitle")}</PanelDialog.Title>
          <PanelDialog.Description>
            {t("areasManagement.deleteAreaDescription")}
          </PanelDialog.Description>
          <PanelDialog.Footer>
            <PanelDialog.Close>
              <PanelButton variant="ghost" size="sm">
                {t("common.cancel")}
              </PanelButton>
            </PanelDialog.Close>
            <PanelButton
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onPress={handleDelete}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </PanelButton>
          </PanelDialog.Footer>
        </PanelDialog.Content>
      </PanelDialog>
    </>
  );
}

import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useArea, useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/db/use-areas";
import { createAreaSchema, type AreaFormValues } from "@/schemas/area";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Input,
  Label,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export default function AreaFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
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
    return <LoadingState message={t("areasManagement.loadingArea")} />;
  }
  if (!isNew && areaQuery.isError) {
    return <ErrorState error={areaQuery.error} onRetry={areaQuery.refetch} />;
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
        variant: "danger",
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
        variant: "danger",
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

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="w-full max-w-3xl">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>{t("areasManagement.seatingArea")}</Card.Title>
              <Card.Description>{t("areasManagement.areaDescription")}</Card.Description>
            </View>
          </Card.Header>
          <Card.Body className="gap-5">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <TextField isRequired isInvalid={Boolean(errors.name)}>
                  <Label>{t("areasManagement.name")}</Label>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("areasManagement.areaNamePlaceholder")}
                  />
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
            {!isNew ? (
              <Button variant="outline" onPress={() => router.push(`/settings/areas/${id}/tables`)}>
                <Button.Label>{t("areasManagement.manageTables")}</Button.Label>
              </Button>
            ) : null}
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => router.back()}>
                <Button.Label>{t("common.cancel")}</Button.Label>
              </Button>
              <Button onPress={handleSubmit(submitArea)} isDisabled={isSaving}>
                <Button.Label>
                  {isSaving ? t("common.saving") : t("areasManagement.saveArea")}
                </Button.Label>
              </Button>
            </View>
          </Card.Body>
        </Card>
      </ScrollView>

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

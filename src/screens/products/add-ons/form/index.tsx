import { Typography ,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Button as PanelButton,
  Dialog as PanelDialog,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton, Card } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage } from "@/api/api-error";
import { useAddOn, useCreateAddOn, useDeleteAddOn, useUpdateAddOn } from "@/hooks/db/use-add-ons";
import {
  createAddOnManagementSchema,
  toAddOnRequest,
  type AddOnManagementValues,
} from "@/schemas/add-on-management";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import OptionRow from "./option-row";
import SelectionRulesCard from "./selection-rules-card";
import { useTranslation } from "@/stores/use-locale";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";

const EMPTY_OPTION = { id: null, name: "", price: "0", destroyed: false };

export default function AddOnFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id: productId, addOnId } = useLocalSearchParams<{
    id: string;
    addOnId: string;
  }>();
  const router = useRouter();
  const { toast } = useToast();
  const [foregroundColor, dangerColor] = useCSSVariable([
    "--color-foreground",
    "--color-destructive",
  ]) as [string, string];
  const isNew = addOnId === "new";
  const addOnQuery = useAddOn(productId, addOnId);
  const createMutation = useCreateAddOn(productId);
  const updateMutation = useUpdateAddOn(productId, addOnId);
  const deleteMutation = useDeleteAddOn(productId);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const hydratedId = React.useRef<string | null>(null);
  const addOnManagementSchema = createAddOnManagementSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AddOnManagementValues>({
    resolver: zodResolver(addOnManagementSchema),
    defaultValues: {
      name: "",
      required: false,
      multiple: false,
      min: "0",
      max: "1",
      options: [EMPTY_OPTION],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const options = useWatch({ control, name: "options" });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    const addOn = addOnQuery.data;
    if (isNew || !addOn || hydratedId.current === addOn.id) return;
    reset({
      name: addOn.name,
      required: addOn.required,
      multiple: addOn.multiple,
      min: String(addOn.min),
      max: String(addOn.max),
      options: addOn.options.map((option) => ({
        id: option.id,
        name: option.name,
        price: String(option.price),
        destroyed: false,
      })),
    });
    hydratedId.current = addOn.id;
  }, [addOnQuery.data, isNew, reset]);

  if (!isNew && addOnQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("addOnManagement.loadingOne")}
        </PanelLoadingText>
      </View>
    );
  }
  if (!isNew && addOnQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(addOnQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void addOnQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleRemoveOption = (index: number) => {
    if (options[index]?.id) {
      setValue(`options.${index}.destroyed`, true, { shouldDirty: true, shouldValidate: true });
    } else {
      remove(index);
    }
  };

  const submitAddOn = async (values: AddOnManagementValues) => {
    try {
      const request = toAddOnRequest(values);
      await (isNew ? createMutation.mutateAsync(request) : updateMutation.mutateAsync(request));
      toast.show({
        variant: "success",
        label: isNew ? t("addOnManagement.created") : t("addOnManagement.updated"),
      });
      router.back();
    } catch (error) {
      const message = getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("addOnManagement.saveFailed"),
        description: message,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(addOnId);
      setIsDeleteOpen(false);
      toast.show({ variant: "success", label: t("addOnManagement.deleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("addOnManagement.deleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isNew ? t("addOnManagement.newTitle") : t("addOnManagement.editTitle"),
        }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel={t("addOnManagement.deleteAccessibility")}
            onPress={() => setIsDeleteOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}
      <KeyboardAwareScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-3xl gap-4">
          <SelectionRulesCard control={control} errors={errors} setValue={setValue} />

          <Card className="gap-3 p-4">
            <Card.Header className="p-0">
              <View className="gap-1">
                <Card.Title>{t("addOnManagement.options")}</Card.Title>
                <Card.Description>{t("addOnManagement.optionsDescription")}</Card.Description>
              </View>
            </Card.Header>
            <Card.Content className="gap-3 p-0">
              {fields.map((field, index) => (
                <OptionRow
                  key={field.id}
                  control={control}
                  errors={errors}
                  index={index}
                  isDestroyed={options[index]?.destroyed ?? false}
                  canRestore={Boolean(options[index]?.id)}
                  onRemove={() => handleRemoveOption(index)}
                  onRestore={() =>
                    setValue(`options.${index}.destroyed`, false, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              ))}
              {errors.options?.root?.message ? (
                <Typography type="body-xs" className="text-destructive-foreground">
                  {errors.options.root.message}
                </Typography>
              ) : null}
              <PanelButton variant="outline" onPress={() => append(EMPTY_OPTION)}>
                <AppIcon icon={AppIcons.add} size={16} color={foregroundColor} />
                {t("addOnManagement.addOption")}
              </PanelButton>
            </Card.Content>
          </Card>

          <View className="flex-1 gap-3">
            {errors.root?.server?.message ? (
              <Typography type="body-sm" className="text-destructive-foreground">
                {errors.root.server.message}
              </Typography>
            ) : null}
            <View className="flex-row gap-3 pt-2">
              <PanelButton variant="ghost" onPress={() => router.back()}>
                {t("common.cancel")}
              </PanelButton>
              <PanelButton className="flex-1" onPress={handleSubmit(submitAddOn)} disabled={isSaving}>
                {isSaving ? t("common.saving") : t("addOnManagement.save")}
              </PanelButton>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <PanelDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("addOnManagement.deleteTitle")}</PanelDialog.Title>
          <PanelDialog.Description>
            {t("addOnManagement.deleteDescription")}
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

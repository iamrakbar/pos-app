import { getErrorMessage } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useAddOn, useCreateAddOn, useDeleteAddOn, useUpdateAddOn } from "@/hooks/db/use-add-ons";
import {
  createAddOnManagementSchema,
  toAddOnRequest,
  type AddOnManagementValues,
} from "@/schemas/add-on-management";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Typography, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import OptionRow from "./option-row";
import SelectionRulesCard from "./selection-rules-card";
import { useTranslation } from "@/stores/use-locale";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import AppIcon from "@/components/common/app-icon";

const EMPTY_OPTION = { id: null, name: "", price: "0", destroyed: false };

export default function AddOnFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { productId, addOnId } = useLocalSearchParams<{
    productId: string;
    addOnId: string;
  }>();
  const router = useRouter();
  const { toast } = useToast();
  const [foregroundColor, dangerColor] = useThemeColor(["foreground", "danger"]);
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
    return <LoadingState message={t("addOnManagement.loadingOne")} />;
  }
  if (!isNew && addOnQuery.isError) {
    return <ErrorState error={addOnQuery.error} onRetry={addOnQuery.refetch} />;
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
        variant: "danger",
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
        variant: "danger",
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

          <Card className="gap-3">
            <Card.Header>
              <View className="gap-1">
                <Card.Title>{t("addOnManagement.options")}</Card.Title>
                <Card.Description>{t("addOnManagement.optionsDescription")}</Card.Description>
              </View>
            </Card.Header>
            <Card.Body className="gap-3">
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
                <Typography type="body-xs" className="text-danger">
                  {errors.options.root.message}
                </Typography>
              ) : null}
              <Button variant="outline" onPress={() => append(EMPTY_OPTION)}>
                <AppIcon name="add-outline" size={16} color={foregroundColor} />
                <Button.Label>{t("addOnManagement.addOption")}</Button.Label>
              </Button>
            </Card.Body>
          </Card>

          <View className="flex-1 gap-3">
            {errors.root?.server?.message ? (
              <Typography type="body-sm" className="text-danger">
                {errors.root.server.message}
              </Typography>
            ) : null}
            <View className="flex-row gap-3 pt-2">
              <Button variant="ghost" onPress={() => router.back()}>
                <Button.Label>{t("common.cancel")}</Button.Label>
              </Button>
              <Button className="flex-1" onPress={handleSubmit(submitAddOn)} isDisabled={isSaving}>
                <Button.Label>
                  {isSaving ? t("common.saving") : t("addOnManagement.save")}
                </Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <ActionDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("addOnManagement.deleteTitle")}
        description={t("addOnManagement.deleteDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

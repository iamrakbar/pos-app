import {
  Typography,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Button as PanelButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  Select as PanelSelect,
  Label as PanelLabel,
  Switch as PanelSwitch,
  Typography as PanelTypography,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Card,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
import {
  useCreateIngredient,
  useDeleteIngredient,
  useIngredient,
  useUpdateIngredient,
} from "@/hooks/db/use-ingredients";
import type { Translate, TranslationKey } from "@/locales";
import {
  createIngredientSchema,
  INGREDIENT_UNITS,
  toIngredientCreateRequest,
  toIngredientUpdateRequest,
  type IngredientFormValues,
} from "@/schemas/ingredient";
import { useTranslation } from "@/stores/use-locale";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { createOperationId } from "@/utils/operation-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useController, useForm } from "react-hook-form";
import { Pressable as ActiveFieldPressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";

const INGREDIENT_FIELDS = new Set<keyof IngredientFormValues>([
  "name",
  "base_unit",
  "reorder_point",
  "cost_per_unit",
  "initial_quantity",
  "active",
]);

const QUANTITY_FORMAT_OPTIONS = {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
} satisfies Intl.NumberFormatOptions;

function applyIngredientServerErrors(
  error: unknown,
  setError: (field: keyof IngredientFormValues, error: { type: string; message: string }) => void
): boolean {
  if (!isApiError(error) || !error.errors) return false;
  let applied = false;

  for (const [field, messages] of Object.entries(error.errors)) {
    if (INGREDIENT_FIELDS.has(field as keyof IngredientFormValues) && messages[0]) {
      setError(field as keyof IngredientFormValues, { type: "server", message: messages[0] });
      applied = true;
    }
  }

  return applied;
}

async function saveIngredient({
  values,
  isNew,
  operationIdRef,
  createMutation,
  updateMutation,
}: {
  values: IngredientFormValues;
  isNew: boolean;
  operationIdRef: React.MutableRefObject<string | null>;
  createMutation: ReturnType<typeof useCreateIngredient>;
  updateMutation: ReturnType<typeof useUpdateIngredient>;
}): Promise<void> {
  if (isNew) {
    const operationId = operationIdRef.current ?? (operationIdRef.current = createOperationId());
    await createMutation.mutateAsync(toIngredientCreateRequest(values, operationId));
    return;
  }

  await updateMutation.mutateAsync(toIngredientUpdateRequest(values));
}

async function deleteIngredient({
  isNew,
  id,
  deleteMutation,
}: {
  isNew: boolean;
  id: string;
  deleteMutation: ReturnType<typeof useDeleteIngredient>;
}): Promise<void> {
  if (isNew) return;
  await deleteMutation.mutateAsync(id);
}

function IngredientFormCard({
  isNew,
  control,
  errors,
  t,
}: {
  isNew: boolean;
  control: Control<IngredientFormValues>;
  errors: FieldErrors<IngredientFormValues>;
  t: Translate;
}): React.JSX.Element {
  const { choicePresentation } = useOverlayPresentation();
  const {
    field: {
      value: costFieldValue,
      onChange: costFieldChange,
      onBlur: costFieldBlur,
      ref: costFieldRef,
    },
  } = useController({ control, name: "cost_per_unit" });
  const { localizedInputProps: costInput } = useLocalizedNumberInput({
    value: costFieldValue,
    onChange: costFieldChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: costFieldBlur },
  });
  const {
    field: { value: reorderValue, onChange: changeReorder, onBlur: blurReorder, ref: reorderRef },
  } = useController({ control, name: "reorder_point" });
  const { localizedInputProps: reorderInput } = useLocalizedNumberInput({
    value: reorderValue,
    onChange: changeReorder,
    formatOptions: QUANTITY_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: blurReorder },
  });
  const {
    field: { value: initialValue, onChange: changeInitial, onBlur: blurInitial, ref: initialRef },
  } = useController({ control, name: "initial_quantity" });
  const { localizedInputProps: initialInput } = useLocalizedNumberInput({
    value: initialValue,
    onChange: changeInitial,
    formatOptions: QUANTITY_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: blurInitial },
  });
  const unitOptions = INGREDIENT_UNITS.map((unit) => ({
    value: unit,
    label: t(`ingredients.units.${unit}` as TranslationKey),
  }));

  return (
    <Card className="gap-4 w-full max-w-3xl overflow-hidden p-4">
      <Card.Header className="p-0">
        <View className="gap-1">
          <Card.Title>
            {isNew ? t("ingredients.createTitle") : t("ingredients.detailsTitle")}
          </Card.Title>
          <Card.Description>{t("ingredients.formDescription")}</Card.Description>
        </View>
      </Card.Header>

      <Card.Content className="gap-5 p-0">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("ingredients.name")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("ingredients.namePlaceholder")}
              isRequired
              errorMessage={errors.name?.message}
            />
          )}
        />

        <PanelInput
          ref={costFieldRef}
          label={t("ingredients.costPerUnit")}
          placeholder={t("ingredients.costPerUnitPlaceholder")}
          description={t("ingredients.costPerUnitDescription")}
          errorMessage={errors.cost_per_unit?.message}
          keyboardType="numeric"
          startContent={
            <PanelTypography type="body-sm" weight="medium" muted>
              {RUPIAH_PREFIX}
            </PanelTypography>
          }
          interactiveContent={false}
          {...costInput}
        />

        <Controller
          control={control}
          name="base_unit"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <PanelLabel isRequired isInvalid={Boolean(errors.base_unit)}>
                {t("ingredients.unit")}
              </PanelLabel>
              <PanelSelect
                presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
                value={value}
                onValueChange={onChange}
                placeholder={t("ingredients.unitPlaceholder")}
                title={t("ingredients.unit")}
                triggerClassName={errors.base_unit ? "border-destructive" : undefined}
              >
                {unitOptions.map((option) => (
                  <PanelSelect.Item key={option.value} {...option} />
                ))}
              </PanelSelect>
              {errors.base_unit?.message ? (
                <PanelTypography type="body-xs" className="text-destructive">
                  {errors.base_unit.message}
                </PanelTypography>
              ) : null}
            </View>
          )}
        />

        <View className="gap-2">
          <View className="flex-row items-end gap-2">
            <PanelButton
              variant="outline"
              size="icon"
              disabled={Number(reorderValue || 0) <= 0}
              accessibilityLabel={t("productForm.decreaseAccessibility", {
                field: t("ingredients.reorderPoint"),
              })}
              onPress={() => changeReorder(String(Math.max(0, Number(reorderValue || 0) - 1)))}
            >
              -
            </PanelButton>
            <PanelInput
              className="flex-1"
              label={t("ingredients.reorderPoint")}
              keyboardType="decimal-pad"
              {...reorderInput}
              errorMessage={errors.reorder_point?.message}
              ref={reorderRef}
            />
            <PanelButton
              variant="outline"
              size="icon"
              accessibilityLabel={t("productForm.increaseAccessibility", {
                field: t("ingredients.reorderPoint"),
              })}
              onPress={() => changeReorder(String(Number(reorderValue || 0) + 1))}
            >
              +
            </PanelButton>
          </View>
          {!errors.reorder_point?.message ? (
            <PanelTypography type="body-xs" muted>
              {t("ingredients.reorderPointDescription")}
            </PanelTypography>
          ) : null}
        </View>

        {isNew ? (
          <View className="gap-2">
            <View className="flex-row items-end gap-2">
              <PanelButton
                variant="outline"
                size="icon"
                disabled={Number(initialValue || 0) <= 0}
                accessibilityLabel={t("productForm.decreaseAccessibility", {
                  field: t("ingredients.initialQuantity"),
                })}
                onPress={() => changeInitial(String(Math.max(0, Number(initialValue || 0) - 1)))}
              >
                -
              </PanelButton>
              <PanelInput
                className="flex-1"
                label={t("ingredients.initialQuantity")}
                keyboardType="decimal-pad"
                {...initialInput}
                errorMessage={errors.initial_quantity?.message}
                ref={initialRef}
              />
              <PanelButton
                variant="outline"
                size="icon"
                accessibilityLabel={t("productForm.increaseAccessibility", {
                  field: t("ingredients.initialQuantity"),
                })}
                onPress={() => changeInitial(String(Number(initialValue || 0) + 1))}
              >
                +
              </PanelButton>
            </View>
            {!errors.initial_quantity?.message ? (
              <PanelTypography type="body-xs" muted>
                {t("ingredients.initialQuantityDescription")}
              </PanelTypography>
            ) : null}
          </View>
        ) : null}

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
                  {t("ingredients.activeDescription")}
                </PanelTypography>
              </View>
              <PanelSwitch
                value={Boolean(value)}
                onValueChange={onChange}
                accessibilityLabel={t("common.active")}
                accessibilityHint={t("ingredients.activeDescription")}
              />
            </ActiveFieldPressable>
          )}
        />

        {errors.root?.server?.message ? (
          <Typography type="body-sm" className="text-destructive">
            {errors.root.server.message}
          </Typography>
        ) : null}
      </Card.Content>
    </Card>
  );
}

type IngredientFormMode = "new" | "edit";
type IngredientFormStatus = "idle" | "saving";
type IngredientDeleteState = "hidden" | "confirming" | "deleting";

function getIngredientDeleteState(
  isConfirmingDelete: boolean,
  isDeletePending: boolean
): IngredientDeleteState {
  if (isConfirmingDelete) return "confirming";
  if (isDeletePending) return "deleting";
  return "hidden";
}

function IngredientFormContent({
  mode,
  formStatus,
  deleteState,
  ingredient,
  control,
  errors,
  t,
  dangerColor,
  onCancel,
  onSubmit,
  onDeleteRequest,
  onConfirmingDeleteChange,
  onDelete,
}: {
  mode: IngredientFormMode;
  formStatus: IngredientFormStatus;
  deleteState: IngredientDeleteState;
  ingredient: App.Data.Merchant.Inventory.IngredientData | undefined;
  control: Control<IngredientFormValues>;
  errors: FieldErrors<IngredientFormValues>;
  t: Translate;
  dangerColor: string;
  onCancel: () => void;
  onSubmit: () => void;
  onDeleteRequest: () => void;
  onConfirmingDeleteChange: (isOpen: boolean) => void;
  onDelete: () => void;
}): React.JSX.Element {
  const isNew = mode === "new";
  const isSaving = formStatus === "saving";
  const isConfirmingDelete = deleteState === "confirming";
  const isDeletePending = deleteState === "deleting";

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? t("ingredients.newTitle") : t("ingredients.editTitle") }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel={t("ingredients.deleteAccessibility", {
              ingredient: ingredient?.name ?? t("ingredients.name"),
            })}
            onPress={onDeleteRequest}
          />
        </Stack.Toolbar>
      ) : null}

      <KeyboardAwareScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6 gap-3"
        keyboardShouldPersistTaps="handled"
      >
        <IngredientFormCard isNew={isNew} control={control} errors={errors} t={t} />

        <View className="flex-row gap-3 pt-2 w-full max-w-3xl">
          <PanelButton variant="ghost" onPress={onCancel} disabled={isSaving}>
            {t("common.cancel")}
          </PanelButton>
          <PanelButton className="flex-1" onPress={onSubmit} disabled={isSaving}>
            {isSaving ? t("common.saving") : t("ingredients.save")}
          </PanelButton>
        </View>
      </KeyboardAwareScrollView>

      <PanelDialog open={isConfirmingDelete} onOpenChange={onConfirmingDeleteChange}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("ingredients.deleteTitle")}</PanelDialog.Title>
          <PanelDialog.Description>{t("ingredients.deleteDescription")}</PanelDialog.Description>
          <PanelDialog.Footer>
            <PanelDialog.Close>
              <PanelButton variant="ghost" size="sm">
                {t("common.cancel")}
              </PanelButton>
            </PanelDialog.Close>
            <PanelButton
              variant="destructive"
              size="sm"
              disabled={isDeletePending}
              onPress={onDelete}
            >
              {isDeletePending ? t("common.deleting") : t("common.delete")}
            </PanelButton>
          </PanelDialog.Footer>
        </PanelDialog.Content>
      </PanelDialog>
    </>
  );
}

export default function IngredientFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useCSSVariable("--color-destructive") as string;
  const isNew = id === "new";
  const ingredientQuery = useIngredient(id);
  const ingredient = ingredientQuery.data;
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient(id);
  const deleteMutation = useDeleteIngredient();
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const operationIdRef = React.useRef<string | null>(null);
  const hydratedIngredientId = React.useRef<string | null>(null);
  const ingredientSchema = createIngredientSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      base_unit: "gram",
      reorder_point: "0",
      cost_per_unit: "",
      initial_quantity: "",
      active: true,
    },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isNew || !ingredient || hydratedIngredientId.current === ingredient.id) return;

    reset({
      name: ingredient.name,
      base_unit: ingredient.base_unit,
      reorder_point: String(ingredient.reorder_point),
      cost_per_unit: ingredient.cost_per_unit === null ? "" : String(ingredient.cost_per_unit),
      initial_quantity: "",
      active: ingredient.active,
    });
    hydratedIngredientId.current = ingredient.id;
  }, [ingredient, isNew, reset]);

  if (!isNew && ingredientQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("ingredients.loadingOne")}
        </PanelLoadingText>
      </View>
    );
  }

  if (!isNew && ingredientQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(ingredientQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void ingredientQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  const applyServerErrors = (error: unknown) => {
    return applyIngredientServerErrors(error, setError);
  };

  const submitIngredient = async (values: IngredientFormValues) => {
    try {
      await saveIngredient({ values, isNew, operationIdRef, createMutation, updateMutation });

      toast.show({
        variant: "success",
        label: isNew ? t("ingredients.created") : t("ingredients.updated"),
      });
      router.back();
    } catch (error) {
      const hasFieldErrors = applyServerErrors(error);
      const message = hasFieldErrors ? t("ingredients.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("ingredients.saveFailed"),
        description: message,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIngredient({ isNew, id, deleteMutation });
      setIsConfirmingDelete(false);
      toast.show({ variant: "success", label: t("ingredients.deleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("ingredients.deleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  return (
    <IngredientFormContent
      mode={isNew ? "new" : "edit"}
      formStatus={isSaving ? "saving" : "idle"}
      deleteState={getIngredientDeleteState(isConfirmingDelete, deleteMutation.isPending)}
      ingredient={ingredient}
      control={control}
      errors={errors}
      t={t}
      dangerColor={dangerColor}
      onCancel={() => router.back()}
      onSubmit={() => void handleSubmit(submitIngredient)()}
      onDeleteRequest={() => setIsConfirmingDelete(true)}
      onConfirmingDeleteChange={setIsConfirmingDelete}
      onDelete={handleDelete}
    />
  );
}

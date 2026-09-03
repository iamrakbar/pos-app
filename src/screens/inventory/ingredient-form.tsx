import { getErrorMessage, isApiError } from "@/api/api-error";
import AppIcon from "@/components/common/app-icon";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import { FormNumberField, RupiahField } from "@/components/common/form-number-field";
import FormActiveField from "@/components/common/form-active-field";
import LoadingState from "@/components/common/loading-state";
import AdjustStockOverlay from "@/screens/inventory/adjust-stock-overlay";
import RecordMovementOverlay from "@/screens/inventory/record-movement-overlay";
import IngredientInventoryMovementsSheet from "@/screens/inventory/ingredient-inventory-movements-sheet";
import IngredientSupplierOffersSheet from "@/screens/inventory/ingredient-supplier-offers-sheet";
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
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
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

function FieldMessage({ message, fallback }: { message?: string; fallback?: string }) {
  const text = message ?? fallback;
  if (!text) return null;

  return (
    <Typography
      type="body-xs"
      color={message ? undefined : "muted"}
      className={message ? "text-danger" : undefined}
    >
      {text}
    </Typography>
  );
}

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
  onShowSupplierOffers,
  onShowMovements,
  onAdjustStock,
  onRecordMovement,
}: {
  isNew: boolean;
  control: Control<IngredientFormValues>;
  errors: FieldErrors<IngredientFormValues>;
  t: Translate;
  onShowSupplierOffers?: () => void;
  onShowMovements?: () => void;
  onAdjustStock?: () => void;
  onRecordMovement?: () => void;
}): React.JSX.Element {
  const { choicePresentation } = useOverlayPresentation();
  const [themeColorForeground] = useThemeColor(["foreground"]);
  const unitOptions = INGREDIENT_UNITS.map((unit) => ({
    value: unit,
    label: t(`ingredients.units.${unit}` as TranslationKey),
  }));

  return (
    <Card className="gap-4 w-full max-w-3xl overflow-hidden">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>
            {isNew ? t("ingredients.createTitle") : t("ingredients.detailsTitle")}
          </Card.Title>
          <Card.Description>{t("ingredients.formDescription")}</Card.Description>
        </View>
      </Card.Header>

      <Card.Body className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={Boolean(errors.name)}>
              <Label>{t("ingredients.name")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("ingredients.namePlaceholder")}
              />
              <FieldMessage message={errors.name?.message} />
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="cost_per_unit"
          render={({ field: { value, onChange } }) => (
            <RupiahField
              label={t("ingredients.costPerUnit")}
              value={value}
              onChange={onChange}
              placeholder={t("ingredients.costPerUnitPlaceholder")}
              minValue={0}
              isInvalid={Boolean(errors.cost_per_unit)}
            >
              <FieldMessage
                message={errors.cost_per_unit?.message}
                fallback={t("ingredients.costPerUnitDescription")}
              />
            </RupiahField>
          )}
        />

        <Controller
          control={control}
          name="base_unit"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <Label isRequired isInvalid={Boolean(errors.base_unit)}>
                {t("ingredients.unit")}
              </Label>
              <Select
                presentation={choicePresentation}
                value={unitOptions.find((option) => option.value === value)}
                onValueChange={(option) => onChange(option?.value ?? "")}
              >
                <Select.Trigger
                  accessibilityLabel={t("ingredients.selectUnit")}
                  className={errors.base_unit ? "border-danger" : undefined}
                >
                  <Select.Value placeholder={t("ingredients.unitPlaceholder")} />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content
                    presentation={choicePresentation}
                    width={choicePresentation === "popover" ? "trigger" : undefined}
                  >
                    <Select.ListLabel>{t("ingredients.unit")}</Select.ListLabel>
                    {unitOptions.map((option) => (
                      <Select.Item key={option.value} {...option} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
              <FieldMessage message={errors.base_unit?.message} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="reorder_point"
          render={({ field: { value, onChange } }) => (
            <FormNumberField
              label={t("ingredients.reorderPoint")}
              minValue={0}
              showStepper
              value={value}
              onChange={onChange}
              formatOptions={QUANTITY_FORMAT_OPTIONS}
              isInvalid={Boolean(errors.reorder_point)}
            >
              <FieldMessage
                message={errors.reorder_point?.message}
                fallback={t("ingredients.reorderPointDescription")}
              />
            </FormNumberField>
          )}
        />

        {isNew ? (
          <Controller
            control={control}
            name="initial_quantity"
            render={({ field: { value, onChange } }) => (
              <FormNumberField
                label={t("ingredients.initialQuantity")}
                minValue={0}
                showStepper
                value={value}
                onChange={onChange}
                formatOptions={QUANTITY_FORMAT_OPTIONS}
                isInvalid={Boolean(errors.initial_quantity)}
              >
                <FieldMessage
                  message={errors.initial_quantity?.message}
                  fallback={t("ingredients.initialQuantityDescription")}
                />
              </FormNumberField>
            )}
          />
        ) : null}

        <FormActiveField
          control={control}
          name="active"
          label={t("common.active")}
          description={t("ingredients.activeDescription")}
        />

        {errors.root?.server?.message ? (
          <Typography type="body-sm" className="text-danger">
            {errors.root.server.message}
          </Typography>
        ) : null}
      </Card.Body>
      {!isNew ? (
        <Card.Footer className="gap-2 pt-0">
          <View className="flex-row gap-2">
            {onAdjustStock ? (
              <Button
                variant="outline"
                className="min-w-0 flex-1 px-1"
                accessibilityLabel={t("ingredients.showAdjustStockAccessibility")}
                onPress={onAdjustStock}
              >
                <AppIcon name="options-outline" size={16} color={themeColorForeground} />
                <Button.Label numberOfLines={1}>{t("ingredients.adjustStock")}</Button.Label>
              </Button>
            ) : null}
            {onRecordMovement ? (
              <Button
                variant="outline"
                className="min-w-0 flex-1 px-1"
                accessibilityLabel={t("ingredients.showRecordMovementAccessibility")}
                onPress={onRecordMovement}
              >
                <AppIcon name="add-circle-outline" size={16} color={themeColorForeground} />
                <Button.Label numberOfLines={1}>{t("ingredients.recordMovement")}</Button.Label>
              </Button>
            ) : null}
          </View>
          {onShowSupplierOffers && onShowMovements ? (
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="min-w-0 flex-1 px-1"
                accessibilityLabel={t("ingredients.showSupplierOffersAccessibility")}
                onPress={onShowSupplierOffers}
              >
                <AppIcon name="people-outline" size={16} color={themeColorForeground} />
                <Button.Label numberOfLines={1}>{t("ingredients.supplierOffers")}</Button.Label>
              </Button>
              <Button
                variant="outline"
                className="min-w-0 flex-1 px-1"
                accessibilityLabel={t("ingredients.showInventoryMovementsAccessibility")}
                onPress={onShowMovements}
              >
                <AppIcon name="swap-vertical-outline" size={16} color={themeColorForeground} />
                <Button.Label numberOfLines={1}>{t("ingredients.inventoryMovements")}</Button.Label>
              </Button>
            </View>
          ) : null}
        </Card.Footer>
      ) : null}
    </Card>
  );
}

type IngredientFormMode = "new" | "edit";
type IngredientFormStatus = "idle" | "saving";
type IngredientDeleteState = "hidden" | "confirming" | "deleting";
type IngredientStockAction = "none" | "adjust" | "record";

function getIngredientDeleteState(
  isConfirmingDelete: boolean,
  isDeletePending: boolean
): IngredientDeleteState {
  if (isConfirmingDelete) return "confirming";
  if (isDeletePending) return "deleting";
  return "hidden";
}

function getIngredientStockAction(
  isAdjustStockOpen: boolean,
  isRecordMovementOpen: boolean
): IngredientStockAction {
  if (isAdjustStockOpen) return "adjust";
  if (isRecordMovementOpen) return "record";
  return "none";
}

function IngredientFormContent({
  mode,
  formStatus,
  deleteState,
  stockAction,
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
  supplierOffersSheetRef,
  movementsSheetRef,
  onStockActionChange,
  onShowSupplierOffers,
  onShowMovements,
  onAdjustStock,
  onRecordMovement,
}: {
  mode: IngredientFormMode;
  formStatus: IngredientFormStatus;
  deleteState: IngredientDeleteState;
  stockAction: IngredientStockAction;
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
  supplierOffersSheetRef: React.MutableRefObject<TrueSheet | null>;
  movementsSheetRef: React.MutableRefObject<TrueSheet | null>;
  onStockActionChange: (action: IngredientStockAction) => void;
  onShowSupplierOffers?: () => void;
  onShowMovements?: () => void;
  onAdjustStock?: () => void;
  onRecordMovement?: () => void;
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
        <IngredientFormCard
          isNew={isNew}
          control={control}
          errors={errors}
          t={t}
          onShowSupplierOffers={onShowSupplierOffers}
          onShowMovements={onShowMovements}
          onAdjustStock={onAdjustStock}
          onRecordMovement={onRecordMovement}
        />

        <View className="flex-row gap-3 pt-2 w-full max-w-3xl">
          <Button variant="ghost" onPress={onCancel} isDisabled={isSaving}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={onSubmit} isDisabled={isSaving}>
            <Button.Label>{isSaving ? t("common.saving") : t("ingredients.save")}</Button.Label>
          </Button>
        </View>
      </KeyboardAwareScrollView>

      {!isNew && ingredient ? (
        <>
          <IngredientSupplierOffersSheet
            ingredientId={ingredient.id}
            ingredientName={ingredient.name}
            sheetRef={supplierOffersSheetRef}
          />
          <IngredientInventoryMovementsSheet
            ingredientId={ingredient.id}
            ingredientName={ingredient.name}
            sheetRef={movementsSheetRef}
          />
          <AdjustStockOverlay
            ingredient={ingredient}
            isOpen={stockAction === "adjust"}
            onOpenChange={(isOpen) => onStockActionChange(isOpen ? "adjust" : "none")}
          />
          <RecordMovementOverlay
            ingredient={ingredient}
            isOpen={stockAction === "record"}
            onOpenChange={(isOpen) => onStockActionChange(isOpen ? "record" : "none")}
          />
        </>
      ) : null}

      <ActionDialog
        isOpen={isConfirmingDelete}
        onOpenChange={onConfirmingDeleteChange}
        title={t("ingredients.deleteTitle")}
        description={t("ingredients.deleteDescription")}
        actionLabel={isDeletePending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={isDeletePending}
        onAction={onDelete}
      />
    </>
  );
}

export default function IngredientFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
  const isNew = id === "new";
  const ingredientQuery = useIngredient(id);
  const ingredient = ingredientQuery.data;
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient(id);
  const deleteMutation = useDeleteIngredient();
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const supplierOffersSheetRef = React.useRef<TrueSheet | null>(null);
  const movementsSheetRef = React.useRef<TrueSheet | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = React.useState(false);
  const [isRecordMovementOpen, setIsRecordMovementOpen] = React.useState(false);
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
    return <LoadingState message={t("ingredients.loadingOne")} />;
  }

  if (!isNew && ingredientQuery.isError) {
    return <ErrorState error={ingredientQuery.error} onRetry={ingredientQuery.refetch} />;
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
        variant: "danger",
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
        variant: "danger",
        label: t("ingredients.deleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const showSupplierOffers = () => {
    void supplierOffersSheetRef.current?.present(0).catch(() => undefined);
  };
  const showMovements = () => {
    void movementsSheetRef.current?.present(0).catch(() => undefined);
  };
  const showAdjustStock = () => setIsAdjustStockOpen(true);
  const showRecordMovement = () => setIsRecordMovementOpen(true);

  return (
    <IngredientFormContent
      mode={isNew ? "new" : "edit"}
      formStatus={isSaving ? "saving" : "idle"}
      deleteState={getIngredientDeleteState(isConfirmingDelete, deleteMutation.isPending)}
      stockAction={getIngredientStockAction(isAdjustStockOpen, isRecordMovementOpen)}
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
      supplierOffersSheetRef={supplierOffersSheetRef}
      movementsSheetRef={movementsSheetRef}
      onStockActionChange={(action) => {
        setIsAdjustStockOpen(action === "adjust");
        setIsRecordMovementOpen(action === "record");
      }}
      onShowSupplierOffers={!isNew ? showSupplierOffers : undefined}
      onShowMovements={!isNew ? showMovements : undefined}
      onAdjustStock={!isNew ? showAdjustStock : undefined}
      onRecordMovement={!isNew ? showRecordMovement : undefined}
    />
  );
}

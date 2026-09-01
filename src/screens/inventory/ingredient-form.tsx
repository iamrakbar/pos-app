import { getErrorMessage, isApiError } from "@/api/api-error";
import AppIcon from "@/components/common/app-icon";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import { FormNumberField, RupiahField } from "@/components/common/form-number-field";
import LoadingState from "@/components/common/loading-state";
import IngredientRelationshipSheets from "@/screens/inventory/ingredient-relationship-sheets";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Switch,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
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

function createOperationId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

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

function IngredientFormCard({
  isNew,
  control,
  errors,
  t,
  onShowSupplierOffers,
  onShowMovements,
}: {
  isNew: boolean;
  control: Control<IngredientFormValues>;
  errors: FieldErrors<IngredientFormValues>;
  t: Translate;
  onShowSupplierOffers?: () => void;
  onShowMovements?: () => void;
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

        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: value }}
              onPress={() => onChange(!value)}
              className="flex-row items-center justify-between gap-4 py-1"
            >
              <View className="flex-1">
                <Typography type="body-sm" weight="semibold">
                  {t("common.active")}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {t("ingredients.activeDescription")}
                </Typography>
              </View>
              <Switch isSelected={value} onSelectedChange={onChange} />
            </Pressable>
          )}
        />

        {errors.root?.server?.message ? (
          <Typography type="body-sm" className="text-danger">
            {errors.root.server.message}
          </Typography>
        ) : null}
      </Card.Body>
      {!isNew && onShowSupplierOffers && onShowMovements ? (
        <Card.Footer className="flex-row gap-2 pt-0">
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
        </Card.Footer>
      ) : null}
    </Card>
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
    if (!isApiError(error) || !error.errors) return false;
    let applied = false;

    for (const [field, messages] of Object.entries(error.errors)) {
      if (INGREDIENT_FIELDS.has(field as keyof IngredientFormValues) && messages[0]) {
        setError(field as keyof IngredientFormValues, { type: "server", message: messages[0] });
        applied = true;
      }
    }

    return applied;
  };

  const submitIngredient = async (values: IngredientFormValues) => {
    try {
      if (isNew) {
        const operationId =
          operationIdRef.current ?? (operationIdRef.current = createOperationId());
        await createMutation.mutateAsync(toIngredientCreateRequest(values, operationId));
      } else {
        await updateMutation.mutateAsync(toIngredientUpdateRequest(values));
      }

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
    if (isNew) return;

    try {
      await deleteMutation.mutateAsync(id);
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
            onPress={() => setIsConfirmingDelete(true)}
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
          onShowSupplierOffers={!isNew ? showSupplierOffers : undefined}
          onShowMovements={!isNew ? showMovements : undefined}
        />

        <View className="flex-row gap-3 pt-2 w-full max-w-3xl">
          <Button variant="ghost" onPress={() => router.back()} isDisabled={isSaving}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button
            className="flex-1"
            onPress={() => void handleSubmit(submitIngredient)()}
            isDisabled={isSaving}
          >
            <Button.Label>{isSaving ? t("common.saving") : t("ingredients.save")}</Button.Label>
          </Button>
        </View>
      </KeyboardAwareScrollView>

      {!isNew && ingredient ? (
        <IngredientRelationshipSheets
          ingredientId={ingredient.id}
          ingredientName={ingredient.name}
          supplierOffersSheetRef={supplierOffersSheetRef}
          movementsSheetRef={movementsSheetRef}
        />
      ) : null}

      <ActionDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={t("ingredients.deleteTitle")}
        description={t("ingredients.deleteDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

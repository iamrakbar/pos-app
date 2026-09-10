import { getErrorMessage } from "@/api/api-error";
import { AdaptiveFormKeyboardHandlers } from "@/components/common/adaptive-form-overlay";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import FormActiveField from "@/components/common/form-active-field";
import { FormNumberField, RupiahField } from "@/components/common/form-number-field";
import {
  useDeleteIngredientSupplierOffer,
  useIngredientSupplierOffers,
  useCreateIngredientSupplierOffer,
  useUpdateIngredientSupplierOffer,
} from "@/hooks/db/use-supplier-offers";
import { useSuppliers } from "@/hooks/db/use-suppliers";
import {
  createSupplierOfferSchema,
  toSupplierOfferRequest,
  type SupplierOfferFormValues,
} from "@/schemas/supplier-offer";
import { useTranslation } from "@/stores/use-locale";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm, type Control, type FieldErrors } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { FieldMessage } from "@/screens/inventory/ingredient-stock-overlay-shared";
import {
  mapServerErrors,
  QUANTITY_FORMAT_OPTIONS,
} from "@/screens/inventory/ingredient-stock-overlay-utils";

function SupplierOfferTextField({
  control,
  errors,
  name,
  label,
  placeholder,
  isRequired = false,
}: {
  control: Control<SupplierOfferFormValues>;
  errors: FieldErrors<SupplierOfferFormValues>;
  name: "supplier_sku" | "purchase_unit";
  label: string;
  placeholder: string;
  isRequired?: boolean;
}): React.JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <TextField
          className="w-full md:flex-1"
          isRequired={isRequired}
          isInvalid={Boolean(errors[name])}
        >
          <Label>{label}</Label>
          <Input
            variant="secondary"
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
          />
          <FieldMessage message={errors[name]?.message} />
        </TextField>
      )}
    />
  );
}

function SupplierOfferNumberField({
  control,
  errors,
  name,
  label,
  placeholder,
  required = false,
  formatOptions = QUANTITY_FORMAT_OPTIONS,
}: {
  control: Control<SupplierOfferFormValues>;
  errors: FieldErrors<SupplierOfferFormValues>;
  name: "pack_quantity" | "minimum_order_quantity" | "lead_time_days";
  label: string;
  placeholder: string;
  required?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <AdaptiveFormKeyboardHandlers>
          {(keyboardHandlers) => (
            <FormNumberField
              className="w-full md:flex-1"
              label={label}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              minValue={0}
              step={1}
              showStepper
              inputVariant="secondary"
              inputProps={keyboardHandlers}
              formatOptions={formatOptions}
              isRequired={required}
              isInvalid={Boolean(errors[name])}
              decreaseAccessibilityLabel={t("productForm.decreaseAccessibility", { field: label })}
              increaseAccessibilityLabel={t("productForm.increaseAccessibility", { field: label })}
            >
              <FieldMessage message={errors[name]?.message} />
            </FormNumberField>
          )}
        </AdaptiveFormKeyboardHandlers>
      )}
    />
  );
}

function SupplierOfferSaveActions({
  isEditing,
  isPending,
  serverError,
  onCancel,
  onSubmit,
}: {
  isEditing: boolean;
  isPending: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View className="gap-3 pt-2">
      {serverError ? (
        <Typography type="body-xs" className="text-danger">
          {serverError}
        </Typography>
      ) : null}
      <View className="flex-row gap-3">
        <Button variant="ghost" onPress={onCancel} isDisabled={isPending}>
          <Button.Label>{t("common.cancel")}</Button.Label>
        </Button>
        <Button className="flex-1" onPress={onSubmit} isDisabled={isPending}>
          <Button.Label>
            {isPending
              ? t("common.saving")
              : isEditing
                ? t("ingredients.updateSupplierOffer")
                : t("common.save")}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

type SupplierOption = { value: string; label: string };

function getRouteParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getSupplierSelectPresentation(
  presentation: "bottom-sheet" | "dialog" | "popover"
): "dialog" | "popover" {
  return presentation === "bottom-sheet" ? "dialog" : presentation;
}

function getSupplierOptions(
  suppliers: App.Data.Merchant.Inventory.SupplierData[],
  offer: App.Data.Merchant.Inventory.SupplierOfferData | undefined
): SupplierOption[] {
  const options = suppliers.map((supplier) => ({
    value: supplier.id,
    label: supplier.name,
  }));

  if (offer && !options.some((option) => option.value === offer.supplier_id)) {
    options.unshift({
      value: offer.supplier_id,
      label: offer.supplier_name ?? offer.supplier_id,
    });
  }

  return options;
}

function getSupplierOfferFormValues(
  offer: App.Data.Merchant.Inventory.SupplierOfferData | undefined
): SupplierOfferFormValues {
  if (!offer) {
    return {
      supplier_id: "",
      supplier_sku: "",
      purchase_unit: "",
      pack_quantity: "",
      minimum_order_quantity: "",
      last_purchase_price: "",
      lead_time_days: "",
      is_preferred: false,
      active: true,
    };
  }

  return {
    supplier_id: offer.supplier_id,
    supplier_sku: offer.supplier_sku ?? "",
    purchase_unit: offer.purchase_unit,
    pack_quantity: String(offer.pack_quantity),
    minimum_order_quantity:
      offer.minimum_order_quantity === null ? "" : String(offer.minimum_order_quantity),
    last_purchase_price:
      offer.last_purchase_price === null ? "" : String(offer.last_purchase_price),
    lead_time_days: offer.lead_time_days === null ? "" : String(offer.lead_time_days),
    is_preferred: offer.is_preferred,
    active: offer.active,
  };
}

function getSupplierOfferLoadState({
  isEditing,
  isLoading,
  isError,
  error,
  onRetry,
  offer,
  loadingMessage,
  notFoundMessage,
}: {
  isEditing: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  offer: App.Data.Merchant.Inventory.SupplierOfferData | undefined;
  loadingMessage: string;
  notFoundMessage: string;
}): React.JSX.Element | null {
  if (!isEditing) return null;
  if (isLoading) return <LoadingState message={loadingMessage} />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  if (!offer) return <ErrorState error={new Error(notFoundMessage)} />;
  return null;
}

function SupplierSelectField({
  control,
  errors,
  options,
  presentation,
  isLoading,
  isError,
  error,
  isPending,
}: {
  control: Control<SupplierOfferFormValues>;
  errors: FieldErrors<SupplierOfferFormValues>;
  options: SupplierOption[];
  presentation: "dialog" | "popover";
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isPending: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name="supplier_id"
      render={({ field: { value, onChange } }) => (
        <View className="gap-1.5">
          <Label isRequired isInvalid={Boolean(errors.supplier_id)}>
            {t("ingredients.supplierOfferSupplier")}
          </Label>
          <Select
            presentation={presentation}
            value={options.find((option) => option.value === value)}
            onValueChange={(option) => onChange(option?.value ?? "")}
            isDisabled={isLoading || isError || options.length === 0 || isPending}
          >
            <Select.Trigger
              accessibilityLabel={t("ingredients.supplierOfferSupplier")}
              className={errors.supplier_id ? "border-danger" : undefined}
            >
              <Select.Value placeholder={t("ingredients.supplierOfferSupplierPlaceholder")} />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content
                presentation={presentation}
                width={presentation === "popover" ? "trigger" : undefined}
              >
                <Select.ListLabel>{t("ingredients.supplierOfferSupplier")}</Select.ListLabel>
                {options.map((option) => (
                  <Select.Item key={option.value} {...option} />
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
          <FieldMessage message={errors.supplier_id?.message} />
          {!errors.supplier_id && (isLoading || isError || options.length === 0) ? (
            <Typography type="body-xs" color={isError ? undefined : "muted"}>
              {isLoading
                ? t("suppliers.loadingOne")
                : isError
                  ? getErrorMessage(error)
                  : t("ingredients.supplierOfferNoSuppliers")}
            </Typography>
          ) : null}
        </View>
      )}
    />
  );
}

function SupplierOfferFormCard({
  control,
  errors,
  supplierOptions,
  supplierSelectPresentation,
  suppliersLoading,
  suppliersError,
  suppliersErrorValue,
  isPending,
  isEditing,
}: {
  control: Control<SupplierOfferFormValues>;
  errors: FieldErrors<SupplierOfferFormValues>;
  supplierOptions: SupplierOption[];
  supplierSelectPresentation: "dialog" | "popover";
  suppliersLoading: boolean;
  suppliersError: boolean;
  suppliersErrorValue: unknown;
  isPending: boolean;
  isEditing: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="w-full gap-4 overflow-hidden">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>
            {t(isEditing ? "ingredients.editSupplierOffer" : "ingredients.addSupplierOffer")}
          </Card.Title>
          <Card.Description>{t("ingredients.supplierOfferFormDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Body className="gap-5">
        <SupplierSelectField
          control={control}
          errors={errors}
          options={supplierOptions}
          presentation={supplierSelectPresentation}
          isLoading={suppliersLoading}
          isError={suppliersError}
          error={suppliersErrorValue}
          isPending={isPending}
        />

        <View className="gap-4 md:flex-row">
          <SupplierOfferTextField
            control={control}
            errors={errors}
            name="purchase_unit"
            label={t("ingredients.supplierOfferPurchaseUnit")}
            placeholder={t("ingredients.supplierOfferPurchaseUnitPlaceholder")}
            isRequired
          />
          <SupplierOfferTextField
            control={control}
            errors={errors}
            name="supplier_sku"
            label={t("ingredients.supplierOfferSku")}
            placeholder={t("ingredients.supplierOfferSku")}
          />
        </View>

        <View className="gap-4 md:flex-row">
          <SupplierOfferNumberField
            control={control}
            errors={errors}
            name="pack_quantity"
            label={t("ingredients.supplierOfferPackQuantity")}
            placeholder={t("ingredients.supplierOfferPackQuantityPlaceholder")}
            required
          />
          <SupplierOfferNumberField
            control={control}
            errors={errors}
            name="minimum_order_quantity"
            label={t("ingredients.supplierOfferMinimumOrderQuantity")}
            placeholder={t("ingredients.supplierOfferMinimumOrderQuantityPlaceholder")}
          />
        </View>

        <View className="gap-4 md:flex-row">
          <Controller
            control={control}
            name="last_purchase_price"
            render={({ field: { value, onChange } }) => (
              <AdaptiveFormKeyboardHandlers>
                {(keyboardHandlers) => (
                  <RupiahField
                    className="w-full md:flex-1"
                    label={t("ingredients.supplierOfferLastPurchasePrice")}
                    value={value}
                    onChange={onChange}
                    placeholder={t("ingredients.supplierOfferLastPurchasePricePlaceholder")}
                    minValue={0}
                    inputVariant="secondary"
                    inputProps={keyboardHandlers}
                    isInvalid={Boolean(errors.last_purchase_price)}
                  >
                    <FieldMessage message={errors.last_purchase_price?.message} />
                  </RupiahField>
                )}
              </AdaptiveFormKeyboardHandlers>
            )}
          />
          <SupplierOfferNumberField
            control={control}
            errors={errors}
            name="lead_time_days"
            label={t("ingredients.supplierOfferLeadTime")}
            placeholder={t("ingredients.supplierOfferLeadTimePlaceholder")}
          />
        </View>

        <FormActiveField
          control={control}
          name="is_preferred"
          label={t("ingredients.supplierOfferPreferred")}
          description={t("ingredients.supplierOfferPreferredDescription")}
        />
        <FormActiveField
          control={control}
          name="active"
          label={t("common.active")}
          description={t("ingredients.supplierOfferActiveDescription")}
        />
      </Card.Body>
    </Card>
  );
}

export default function IngredientSupplierOfferFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; offerId?: string }>();
  const ingredientId = getRouteParam(params.id) ?? "";
  const offerId = getRouteParam(params.offerId);
  const router = useRouter();
  const { toast } = useToast();
  const { choicePresentation } = useOverlayPresentation();
  const supplierSelectPresentation = getSupplierSelectPresentation(choicePresentation);
  const isEditing = Boolean(offerId);
  const supplierOffersQuery = useIngredientSupplierOffers(ingredientId, isEditing);
  const offer = supplierOffersQuery.data?.find((item) => String(item.id) === offerId);
  const suppliersQuery = useSuppliers({ active: isEditing ? undefined : true, sort: "name" });
  const createMutation = useCreateIngredientSupplierOffer(ingredientId);
  const updateMutation = useUpdateIngredientSupplierOffer(
    ingredientId,
    offerId ? Number(offerId) : 0
  );
  const isPending = createMutation.isPending || updateMutation.isPending;
  const deleteMutation = useDeleteIngredientSupplierOffer(ingredientId);
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const dangerColor = useThemeColor("danger");
  const suppliers = suppliersQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const supplierOptions = getSupplierOptions(suppliers, offer);
  const schema = createSupplierOfferSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SupplierOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplier_id: "",
      supplier_sku: "",
      purchase_unit: "",
      pack_quantity: "",
      minimum_order_quantity: "",
      last_purchase_price: "",
      lead_time_days: "",
      is_preferred: false,
      active: true,
    },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    reset(getSupplierOfferFormValues(offer));
  }, [offer, reset]);

  const handleClose = () => {
    if (isPending || deleteMutation.isPending) return;
    router.back();
  };

  const handleDelete = async () => {
    if (!offer) return;

    try {
      await deleteMutation.mutateAsync(offer.id);
      setIsConfirmingDelete(false);
      toast.show({ variant: "success", label: t("ingredients.supplierOfferDeleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("ingredients.supplierOfferDeleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const submit = async (values: SupplierOfferFormValues) => {
    try {
      const request = toSupplierOfferRequest(values);
      if (offer) {
        await updateMutation.mutateAsync(request);
      } else {
        await createMutation.mutateAsync(request);
      }
      toast.show({
        variant: "success",
        label: t(
          isEditing ? "ingredients.supplierOfferUpdated" : "ingredients.supplierOfferCreated"
        ),
      });
      handleClose();
    } catch (error) {
      const hasFieldErrors = mapServerErrors(
        error,
        [
          "supplier_id",
          "supplier_sku",
          "purchase_unit",
          "pack_quantity",
          "minimum_order_quantity",
          "last_purchase_price",
          "lead_time_days",
          "is_preferred",
          "active",
        ],
        setError
      );
      const message = hasFieldErrors ? t("ingredients.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "danger",
        label: t("ingredients.supplierOfferSaveFailed"),
        description: message,
      });
    }
  };

  const loadState = getSupplierOfferLoadState({
    isEditing,
    isLoading: supplierOffersQuery.isLoading,
    isError: supplierOffersQuery.isError,
    error: supplierOffersQuery.error,
    onRetry: () => void supplierOffersQuery.refetch(),
    offer,
    loadingMessage: t("ingredients.loadingOne"),
    notFoundMessage: t("ingredients.supplierOfferNotFound"),
  });
  if (loadState) return loadState;

  return (
    <>
      <Stack.Screen
        options={{
          title: t(isEditing ? "ingredients.editSupplierOffer" : "ingredients.addSupplierOffer"),
        }}
      />
      {isEditing ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel={t("ingredients.deleteSupplierOfferAccessibility", {
              supplier: offer?.supplier_name ?? t("ingredients.supplier"),
            })}
            onPress={() => setIsConfirmingDelete(true)}
          />
        </Stack.Toolbar>
      ) : null}
      <View className="flex-1 bg-background">
        <KeyboardAwareScrollView
          className="flex-1"
          bottomOffset={32}
          contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-3xl gap-4">
            <SupplierOfferFormCard
              control={control}
              errors={errors}
              supplierOptions={supplierOptions}
              supplierSelectPresentation={supplierSelectPresentation}
              suppliersLoading={suppliersQuery.isLoading}
              suppliersError={suppliersQuery.isError}
              suppliersErrorValue={suppliersQuery.error}
              isPending={isPending}
              isEditing={isEditing}
            />
            <SupplierOfferSaveActions
              isEditing={isEditing}
              isPending={isPending}
              serverError={errors.root?.server?.message}
              onSubmit={() => void handleSubmit(submit)()}
              onCancel={handleClose}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>
      <ActionDialog
        isOpen={isConfirmingDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteMutation.isPending) setIsConfirmingDelete(false);
        }}
        title={t("ingredients.supplierOfferDeleteTitle")}
        description={t("ingredients.supplierOfferDeleteDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

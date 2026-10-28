import {
  Typography,
  Typography as PanelFieldText,
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
import { getErrorMessage } from "@/api/api-error";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { IDR_NUMBER_FIELD_FORMAT_OPTIONS, RUPIAH_PREFIX } from "@/utils/format";
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Controller,
  useController,
  useForm,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { Pressable as ActiveFieldPressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  mapServerErrors,
  QUANTITY_FORMAT_OPTIONS,
} from "@/screens/inventory/ingredient-stock-overlay-utils";

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
        <Typography type="body-xs" className="text-destructive">
          {serverError}
        </Typography>
      ) : null}
      <View className="flex-row gap-3">
        <PanelButton variant="ghost" onPress={onCancel} disabled={isPending}>
          {t("common.cancel")}
        </PanelButton>
        <PanelButton className="flex-1" onPress={onSubmit} disabled={isPending}>
          {isPending
            ? t("common.saving")
            : isEditing
              ? t("ingredients.updateSupplierOffer")
              : t("common.save")}
        </PanelButton>
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
  retryLabel,
}: {
  isEditing: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  offer: App.Data.Merchant.Inventory.SupplierOfferData | undefined;
  loadingMessage: string;
  notFoundMessage: string;
  retryLabel: string;
}): React.JSX.Element | null {
  if (!isEditing) return null;
  if (isLoading)
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {loadingMessage}
        </PanelLoadingText>
      </View>
    );
  if (isError)
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>{getErrorMessage(error)}</PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void onRetry()}>
          {retryLabel}
        </PanelErrorButton>
      </View>
    );
  if (!offer)
    return (
      <PanelErrorAlert variant="destructive">
        <PanelErrorAlert.Indicator />
        <PanelErrorAlert.Content>
          <PanelErrorAlert.Description>{notFoundMessage}</PanelErrorAlert.Description>
        </PanelErrorAlert.Content>
      </PanelErrorAlert>
    );
  return null;
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
  const {
    field: { value: priceValue, onChange: priceChange, onBlur: priceBlur, ref: priceRef },
  } = useController({ control, name: "last_purchase_price" });
  const { localizedInputProps: priceInput } = useLocalizedNumberInput({
    value: priceValue,
    onChange: priceChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: priceBlur },
  });
  const {
    field: { value: packValue, onChange: changePack, onBlur: blurPack },
  } = useController({ control, name: "pack_quantity" });
  const { numericValue: packNumber, localizedInputProps: packInput } = useLocalizedNumberInput({
    value: packValue,
    onChange: changePack,
    formatOptions: QUANTITY_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: blurPack },
  });

  const {
    field: { value: minimumValue, onChange: changeMinimum, onBlur: blurMinimum },
  } = useController({ control, name: "minimum_order_quantity" });
  const { numericValue: minimumNumber, localizedInputProps: minimumInput } =
    useLocalizedNumberInput({
      value: minimumValue,
      onChange: changeMinimum,
      formatOptions: QUANTITY_FORMAT_OPTIONS,
      minValue: 0,
      inputProps: { onBlur: blurMinimum },
    });

  const {
    field: { value: leadValue, onChange: changeLead, onBlur: blurLead },
  } = useController({ control, name: "lead_time_days" });
  const { numericValue: leadNumber, localizedInputProps: leadInput } = useLocalizedNumberInput({
    value: leadValue,
    onChange: changeLead,
    formatOptions: QUANTITY_FORMAT_OPTIONS,
    minValue: 0,
    inputProps: { onBlur: blurLead },
  });

  return (
    <Card className="w-full gap-4 overflow-hidden p-4">
      <Card.Header className="p-0">
        <View className="gap-1">
          <Card.Title>
            {t(isEditing ? "ingredients.editSupplierOffer" : "ingredients.addSupplierOffer")}
          </Card.Title>
          <Card.Description>{t("ingredients.supplierOfferFormDescription")}</Card.Description>
        </View>
      </Card.Header>
      <Card.Content className="gap-5 p-0">
        <Controller
          control={control}
          name="supplier_id"
          render={({ field: { value, onChange } }) => (
            <View className="gap-1.5">
              <PanelLabel isRequired isInvalid={Boolean(errors.supplier_id)}>
                {t("ingredients.supplierOfferSupplier")}
              </PanelLabel>
              <PanelSelect
                presentation={supplierSelectPresentation === "popover" ? "overlay" : "sheet"}
                value={value}
                onValueChange={onChange}
                disabled={
                  suppliersLoading || suppliersError || supplierOptions.length === 0 || isPending
                }
                triggerClassName={errors.supplier_id ? "h-12 border-destructive" : "h-12"}
                placeholder={t("ingredients.supplierOfferSupplierPlaceholder")}
                title={t("ingredients.supplierOfferSupplier")}
              >
                {supplierOptions.map((option) => (
                  <PanelSelect.Item key={option.value} {...option} />
                ))}
              </PanelSelect>
              {errors.supplier_id?.message ? (
                <PanelFieldText type="body-xs" className="text-destructive">
                  {errors.supplier_id?.message}
                </PanelFieldText>
              ) : null}
              {!errors.supplier_id &&
              (suppliersLoading || suppliersError || supplierOptions.length === 0) ? (
                <Typography type="body-xs" muted={!suppliersError}>
                  {suppliersLoading
                    ? t("suppliers.loadingOne")
                    : suppliersError
                      ? getErrorMessage(suppliersErrorValue)
                      : t("ingredients.supplierOfferNoSuppliers")}
                </Typography>
              ) : null}
            </View>
          )}
        />

        <View className="gap-4 md:flex-row">
          <Controller
            control={control}
            name="purchase_unit"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                ref={ref}
                containerClassName="w-full md:flex-1"

                label={t("ingredients.supplierOfferPurchaseUnit")}
                placeholder={t("ingredients.supplierOfferPurchaseUnitPlaceholder")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.purchase_unit?.message}
                isRequired
              />
            )}
          />
          <Controller
            control={control}
            name="supplier_sku"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                ref={ref}
                containerClassName="w-full md:flex-1"

                label={t("ingredients.supplierOfferSku")}
                placeholder={t("ingredients.supplierOfferSku")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.supplier_sku?.message}
              />
            )}
          />
        </View>

        <View className="gap-4 md:flex-row">
          <PanelInput
            containerClassName="w-full md:flex-1"
            label={t("ingredients.supplierOfferPackQuantity")}
            placeholder={t("ingredients.supplierOfferPackQuantityPlaceholder")}
            keyboardType="decimal-pad"
            errorMessage={errors.pack_quantity?.message}
            isRequired
            {...packInput}
            startContent={
              <PanelButton
                size="icon"
                variant="ghost"
                accessibilityLabel={t("productForm.decreaseAccessibility", {
                  field: t("ingredients.supplierOfferPackQuantity"),
                })}
                disabled={Number.isFinite(packNumber) && packNumber <= 0}
                onPress={() => changePack(String(Math.max(0, (packNumber || 0) - 1)))}
              >
                −
              </PanelButton>
            }
            endContent={
              <PanelButton
                size="icon"
                variant="ghost"
                accessibilityLabel={t("productForm.increaseAccessibility", {
                  field: t("ingredients.supplierOfferPackQuantity"),
                })}
                onPress={() => changePack(String((packNumber || 0) + 1))}
              >
                +
              </PanelButton>
            }
          />
          <PanelInput
            containerClassName="w-full md:flex-1"
            label={t("ingredients.supplierOfferMinimumOrderQuantity")}
            placeholder={t("ingredients.supplierOfferMinimumOrderQuantityPlaceholder")}
            keyboardType="decimal-pad"
            errorMessage={errors.minimum_order_quantity?.message}
            {...minimumInput}
            startContent={
              <PanelButton
                size="icon"
                variant="ghost"
                accessibilityLabel={t("productForm.decreaseAccessibility", {
                  field: t("ingredients.supplierOfferMinimumOrderQuantity"),
                })}
                disabled={Number.isFinite(minimumNumber) && minimumNumber <= 0}
                onPress={() => changeMinimum(String(Math.max(0, (minimumNumber || 0) - 1)))}
              >
                −
              </PanelButton>
            }
            endContent={
              <PanelButton
                size="icon"
                variant="ghost"
                accessibilityLabel={t("productForm.increaseAccessibility", {
                  field: t("ingredients.supplierOfferMinimumOrderQuantity"),
                })}
                onPress={() => changeMinimum(String((minimumNumber || 0) + 1))}
              >
                +
              </PanelButton>
            }
          />
        </View>

        <View className="gap-4 md:flex-row">
          <PanelInput
            ref={priceRef}
            containerClassName="w-full md:flex-1"
            label={t("ingredients.supplierOfferLastPurchasePrice")}
            placeholder={t("ingredients.supplierOfferLastPurchasePricePlaceholder")}
            errorMessage={errors.last_purchase_price?.message}

            keyboardType="numeric"
            startContent={
              <PanelTypography type="body-sm" weight="medium" muted>
                {RUPIAH_PREFIX}
              </PanelTypography>
            }
            interactiveContent={false}

            {...priceInput}
            onBlur={(event) => {
              priceInput.onBlur(event);
            }}
          />
          <PanelInput
            containerClassName="w-full md:flex-1"
            label={t("ingredients.supplierOfferLeadTime")}
            placeholder={t("ingredients.supplierOfferLeadTimePlaceholder")}
            keyboardType="decimal-pad"
            errorMessage={errors.lead_time_days?.message}
            {...leadInput}
            startContent={
              <PanelButton
                size="icon"
                variant="ghost"
                accessibilityLabel={t("productForm.decreaseAccessibility", {
                  field: t("ingredients.supplierOfferLeadTime"),
                })}
                disabled={Number.isFinite(leadNumber) && leadNumber <= 0}
                onPress={() => changeLead(String(Math.max(0, (leadNumber || 0) - 1)))}
              >
                −
              </PanelButton>
            }
            endContent={
              <PanelButton
                size="icon"
                variant="ghost"
                accessibilityLabel={t("productForm.increaseAccessibility", {
                  field: t("ingredients.supplierOfferLeadTime"),
                })}
                onPress={() => changeLead(String((leadNumber || 0) + 1))}
              >
                +
              </PanelButton>
            }
          />
        </View>

        <Controller
          control={control}
          name="is_preferred"
          render={({ field: { value, onChange } }) => (
            <ActiveFieldPressable
              accessible={false}
              onPress={() => onChange(!value)}
              className="flex-row items-center justify-between gap-4 py-1"
            >
              <View className="flex-1">
                <PanelTypography type="body-sm" weight="semibold">
                  {t("ingredients.supplierOfferPreferred")}
                </PanelTypography>
                <PanelTypography type="body-xs" muted>
                  {t("ingredients.supplierOfferPreferredDescription")}
                </PanelTypography>
              </View>
              <PanelSwitch
                value={Boolean(value)}
                onValueChange={onChange}
                accessibilityLabel={t("ingredients.supplierOfferPreferred")}
                accessibilityHint={t("ingredients.supplierOfferPreferredDescription")}
              />
            </ActiveFieldPressable>
          )}
        />
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
                  {t("ingredients.supplierOfferActiveDescription")}
                </PanelTypography>
              </View>
              <PanelSwitch
                value={Boolean(value)}
                onValueChange={onChange}
                accessibilityLabel={t("common.active")}
                accessibilityHint={t("ingredients.supplierOfferActiveDescription")}
              />
            </ActiveFieldPressable>
          )}
        />
      </Card.Content>
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
  const dangerColor = useCSSVariable("--color-destructive") as string;
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
        variant: "destructive",
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
        variant: "destructive",
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
    retryLabel: t("common.retry"),
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
      <PanelDialog
        open={isConfirmingDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteMutation.isPending) setIsConfirmingDelete(false);
        }}
      >
        <PanelDialog.Content>
          <PanelDialog.Title>{t("ingredients.supplierOfferDeleteTitle")}</PanelDialog.Title>
          <PanelDialog.Description>
            {t("ingredients.supplierOfferDeleteDescription")}
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

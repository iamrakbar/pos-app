import {
  Typography,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Button as PanelButton,
  Dialog as PanelDialog,
  Switch as PanelSwitch,
  Typography as PanelTypography,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Input as PanelInput,
  Card,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSupplier,
  useUpdateSupplier,
} from "@/hooks/db/use-suppliers";
import {
  createSupplierSchema,
  toSupplierRequest,
  type SupplierFormValues,
} from "@/schemas/supplier";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller, useController, useForm } from "react-hook-form";
import { Pressable as ActiveFieldPressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import type { Translate } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

const SUPPLIER_FIELDS = new Set<keyof SupplierFormValues>([
  "name",
  "contact_name",
  "email",
  "phone",
  "lead_time_days",
  "payment_terms",
  "active",
]);

function SupplierFormCard({
  isNew,
  control,
  errors,
  t,
}: {
  isNew: boolean;
  control: Control<SupplierFormValues>;
  errors: FieldErrors<SupplierFormValues>;
  t: Translate;
}): React.JSX.Element {
  const {
    field: {
      value: leadTimeValue,
      onChange: changeLeadTime,
      onBlur: blurLeadTime,
      ref: leadTimeRef,
    },
  } = useController({ control, name: "lead_time_days" });
  const { localizedInputProps: leadTimeInput } = useLocalizedNumberInput({
    value: leadTimeValue,
    onChange: changeLeadTime,
    formatOptions: { useGrouping: false, maximumFractionDigits: 0 },
    minValue: 0,
    inputProps: { onBlur: blurLeadTime },
  });
  return (
    <Card className="gap-4 w-full max-w-3xl overflow-hidden p-4">
      <Card.Header className="p-0">
        <View className="gap-1">
          <Card.Title>
            {isNew ? t("suppliers.createTitle") : t("suppliers.detailsTitle")}
          </Card.Title>
          <Card.Description>{t("suppliers.formDescription")}</Card.Description>
        </View>
      </Card.Header>

      <Card.Content className="gap-5 p-0">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              label={t("suppliers.name")}
              isRequired
              errorMessage={errors.name?.message}
              ref={ref}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("suppliers.namePlaceholder")}
            />
          )}
        />

        <Controller
          control={control}
          name="contact_name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              label={t("suppliers.contactName")}
              errorMessage={errors.contact_name?.message}
              ref={ref}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("suppliers.contactNamePlaceholder")}
            />
          )}
        />

        <View className="gap-5 md:flex-row">
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                containerClassName="flex-1"
                label={t("suppliers.email")}
                errorMessage={errors.email?.message}
                ref={ref}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("suppliers.emailPlaceholder")}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                containerClassName="flex-1"
                label={t("suppliers.phone")}
                errorMessage={errors.phone?.message}
                ref={ref}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("suppliers.phonePlaceholder")}
                keyboardType="phone-pad"
              />
            )}
          />
        </View>

        <View className="gap-5 md:flex-row">
          <View className="flex-1 gap-2">
            <View className="flex-row items-end gap-2">
              <PanelButton
                variant="outline"
                size="icon"
                disabled={Number(leadTimeValue || 0) <= 0}
                accessibilityLabel={t("productForm.decreaseAccessibility", {
                  field: t("suppliers.leadTime"),
                })}
                onPress={() => changeLeadTime(String(Math.max(0, Number(leadTimeValue || 0) - 1)))}
              >
                -
              </PanelButton>
              <PanelInput
                className="flex-1"
                label={t("suppliers.leadTime")}
                placeholder={t("suppliers.leadTimePlaceholder")}
                keyboardType="number-pad"
                {...leadTimeInput}
                errorMessage={errors.lead_time_days?.message}
                ref={leadTimeRef}
              />
              <PanelButton
                variant="outline"
                size="icon"
                accessibilityLabel={t("productForm.increaseAccessibility", {
                  field: t("suppliers.leadTime"),
                })}
                onPress={() => changeLeadTime(String(Number(leadTimeValue || 0) + 1))}
              >
                +
              </PanelButton>
            </View>
            {!errors.lead_time_days?.message ? (
              <PanelTypography type="body-xs" muted>
                {t("suppliers.leadTimeDescription")}
              </PanelTypography>
            ) : null}
          </View>

          <Controller
            control={control}
            name="payment_terms"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                containerClassName="flex-1"
                label={t("suppliers.paymentTerms")}
                errorMessage={errors.payment_terms?.message}
                ref={ref}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("suppliers.paymentTermsPlaceholder")}
              />
            )}
          />
        </View>

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
                  {t("suppliers.activeDescription")}
                </PanelTypography>
              </View>
              <PanelSwitch
                value={Boolean(value)}
                onValueChange={onChange}
                accessibilityLabel={t("common.active")}
                accessibilityHint={t("suppliers.activeDescription")}
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

export default function SupplierFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useCSSVariable("--color-destructive") as string;
  const isNew = id === "new";
  const supplierQuery = useSupplier(id);
  const supplier = supplierQuery.data;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(id);
  const deleteMutation = useDeleteSupplier();
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const hydratedSupplierId = React.useRef<string | null>(null);
  const supplierSchema = createSupplierSchema(t);
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      lead_time_days: "",
      payment_terms: "",
      active: true,
    },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useEffect(() => {
    if (isNew || !supplier || hydratedSupplierId.current === supplier.id) return;

    reset({
      name: supplier.name,
      contact_name: supplier.contact_name ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      lead_time_days: supplier.lead_time_days === null ? "" : String(supplier.lead_time_days),
      payment_terms: supplier.payment_terms ?? "",
      active: supplier.active,
    });
    hydratedSupplierId.current = supplier.id;
  }, [isNew, reset, supplier]);

  if (!isNew && supplierQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("suppliers.loadingOne")}
        </PanelLoadingText>
      </View>
    );
  }

  if (!isNew && supplierQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(supplierQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void supplierQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  const applyServerErrors = (error: unknown) => {
    if (!isApiError(error) || !error.errors) return false;
    let applied = false;

    for (const [field, messages] of Object.entries(error.errors)) {
      if (SUPPLIER_FIELDS.has(field as keyof SupplierFormValues) && messages[0]) {
        setError(field as keyof SupplierFormValues, { type: "server", message: messages[0] });
        applied = true;
      }
    }

    return applied;
  };

  const submitSupplier = async (values: SupplierFormValues) => {
    try {
      const request = toSupplierRequest(values);
      if (isNew) {
        await createMutation.mutateAsync(request);
      } else {
        await updateMutation.mutateAsync(request);
      }

      toast.show({
        variant: "success",
        label: isNew ? t("suppliers.created") : t("suppliers.updated"),
      });
      router.back();
    } catch (error) {
      const hasFieldErrors = applyServerErrors(error);
      const message = hasFieldErrors ? t("suppliers.checkFields") : getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("suppliers.saveFailed"),
        description: message,
      });
    }
  };

  const handleDelete = async () => {
    if (isNew) return;

    try {
      await deleteMutation.mutateAsync(id);
      setIsConfirmingDelete(false);
      toast.show({ variant: "success", label: t("suppliers.deleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("suppliers.deleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? t("suppliers.newTitle") : t("suppliers.editTitle") }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={dangerColor}
            accessibilityLabel={t("suppliers.deleteAccessibility", {
              supplier: supplier?.name ?? t("suppliers.name"),
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
        <SupplierFormCard isNew={isNew} control={control} errors={errors} t={t} />

        <View className="flex-row gap-3 pt-2 w-full max-w-3xl">
          <PanelButton variant="ghost" onPress={() => router.back()} disabled={isSaving}>
            {t("common.cancel")}
          </PanelButton>
          <PanelButton
            className="flex-1"
            onPress={handleSubmit(submitSupplier)}
            disabled={isSaving}
          >
            {isSaving ? t("common.saving") : t("suppliers.save")}
          </PanelButton>
        </View>
      </KeyboardAwareScrollView>

      <PanelDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("suppliers.deleteTitle")}</PanelDialog.Title>
          <PanelDialog.Description>{t("suppliers.deleteDescription")}</PanelDialog.Description>
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

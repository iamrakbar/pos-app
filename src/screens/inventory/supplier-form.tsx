import { getErrorMessage, isApiError } from "@/api/api-error";
import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import StringNumberField from "@/components/common/string-number-field";
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
import {
  Button,
  Card,
  Input,
  Label,
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
  return (
    <Card className="gap-4 w-full max-w-3xl overflow-hidden">
      <Card.Header>
        <View className="gap-1">
          <Card.Title>
            {isNew ? t("suppliers.createTitle") : t("suppliers.detailsTitle")}
          </Card.Title>
          <Card.Description>{t("suppliers.formDescription")}</Card.Description>
        </View>
      </Card.Header>

      <Card.Body className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange } }) => (
            <TextField isRequired isInvalid={Boolean(errors.name)}>
              <Label>{t("suppliers.name")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("suppliers.namePlaceholder")}
              />
              <FieldMessage message={errors.name?.message} />
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="contact_name"
          render={({ field: { value, onChange } }) => (
            <TextField isInvalid={Boolean(errors.contact_name)}>
              <Label>{t("suppliers.contactName")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("suppliers.contactNamePlaceholder")}
              />
              <FieldMessage message={errors.contact_name?.message} />
            </TextField>
          )}
        />

        <View className="gap-5 md:flex-row">
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <TextField className="flex-1" isInvalid={Boolean(errors.email)}>
                <Label>{t("suppliers.email")}</Label>
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder={t("suppliers.emailPlaceholder")}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <FieldMessage message={errors.email?.message} />
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <TextField className="flex-1" isInvalid={Boolean(errors.phone)}>
                <Label>{t("suppliers.phone")}</Label>
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder={t("suppliers.phonePlaceholder")}
                  keyboardType="phone-pad"
                />
                <FieldMessage message={errors.phone?.message} />
              </TextField>
            )}
          />
        </View>

        <View className="gap-5 md:flex-row">
          <Controller
            control={control}
            name="lead_time_days"
            render={({ field: { value, onChange } }) => (
              <StringNumberField
                className="flex-1"
                label={t("suppliers.leadTime")}
                value={value}
                onChange={onChange}
                placeholder={t("suppliers.leadTimePlaceholder")}
                minValue={0}
                formatOptions={{ maximumFractionDigits: 0 }}
                isInvalid={Boolean(errors.lead_time_days)}
              >
                <FieldMessage
                  message={errors.lead_time_days?.message}
                  fallback={t("suppliers.leadTimeDescription")}
                />
              </StringNumberField>
            )}
          />

          <Controller
            control={control}
            name="payment_terms"
            render={({ field: { value, onChange } }) => (
              <TextField className="flex-1" isInvalid={Boolean(errors.payment_terms)}>
                <Label>{t("suppliers.paymentTerms")}</Label>
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder={t("suppliers.paymentTermsPlaceholder")}
                />
                <FieldMessage message={errors.payment_terms?.message} />
              </TextField>
            )}
          />
        </View>

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
                  {t("suppliers.activeDescription")}
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
    </Card>
  );
}

export default function SupplierFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
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
    return <LoadingState message={t("suppliers.loadingOne")} />;
  }

  if (!isNew && supplierQuery.isError) {
    return <ErrorState error={supplierQuery.error} onRetry={supplierQuery.refetch} />;
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
        variant: "danger",
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
        variant: "danger",
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
          <Button variant="ghost" onPress={() => router.back()} isDisabled={isSaving}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSubmit(submitSupplier)} isDisabled={isSaving}>
            <Button.Label>{isSaving ? t("common.saving") : t("suppliers.save")}</Button.Label>
          </Button>
        </View>
      </KeyboardAwareScrollView>

      <ActionDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title={t("suppliers.deleteTitle")}
        description={t("suppliers.deleteDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

import { Typography ,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Input as PanelInput, Card } from "panelui-native";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { useAccountProfile, useUpdateAccountProfile } from "@/hooks/db/use-account-profile";
import { createAccountSchema, type AccountFormValues } from "@/schemas/account";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function AccountScreen(): React.JSX.Element {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const storedMerchants = useAuth((state) => state.merchants);
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const merchants =
    storedMerchants.length > 0 ? storedMerchants : activeMerchant ? [activeMerchant] : [];
  const profileQuery = useAccountProfile();
  const updateProfile = useUpdateAccountProfile();
  const accountSchema = createAccountSchema(t);
  const user = profileQuery.data;
  const profileFormValues: AccountFormValues | undefined = user
    ? {
        name: user.name,
        email: user.email,
        role: user.role,
        roleLabel: user.role_label,
        merchantIds: merchants.map((merchant) => merchant.id),
      }
    : undefined;
  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      roleLabel: "",
      merchantIds: merchants.map((merchant) => merchant.id),
    },
    values: profileFormValues,
    resetOptions: {
      keepDirtyValues: true,
      keepErrors: true,
    },
  });
  const formValues = useWatch({ control });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  if (profileQuery.isLoading || (profileQuery.isFetching && !profileQuery.isFetchedAfterMount)) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("profile.loading")}
        </PanelLoadingText>
      </View>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(profileQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void profileQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  const roleOption = formValues.role
    ? { value: formValues.role, label: formValues.roleLabel || formValues.role }
    : undefined;
  const merchantOptions = merchants.map((merchant) => ({
    value: merchant.id,
    label: merchant.name,
  }));

  const submitAccount = async (values: AccountFormValues) => {
    try {
      const updatedUser = await updateProfile.mutateAsync({ name: values.name.trim() });
      reset({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        roleLabel: updatedUser.role_label,
        merchantIds: values.merchantIds,
      });
      toast.show({ variant: "success", label: t("profile.updated") });
    } catch (error) {
      const fieldMessage = isApiError(error) ? error.errors?.name?.[0] : undefined;
      if (fieldMessage) setError("name", { type: "server", message: fieldMessage });
      const message = fieldMessage ?? getErrorMessage(error);
      setError("root.server", { type: "server", message });
      toast.show({
        variant: "destructive",
        label: t("profile.updateFailed"),
        description: message,
      });
    }
  };

  return (
    <AccountForm
      control={control}
      errors={errors}
      roleOption={roleOption}
      merchantOptions={merchantOptions}
      isDirty={isDirty}
      isPending={updateProfile.isPending}
      onCancel={() => router.back()}
      onSubmit={() => void handleSubmit(submitAccount)()}
    />
  );
}

function AccountForm({
  control,
  errors,
  roleOption,
  merchantOptions,
  isDirty,
  isPending,
  onCancel,
  onSubmit,
}: {
  control: Control<AccountFormValues>;
  errors: FieldErrors<AccountFormValues>;
  roleOption?: { value: string; label: string };
  merchantOptions: { value: string; label: string }[];
  isDirty: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <View className="w-full max-w-3xl gap-6">
        <Card className="gap-3 p-4">
          <Card.Header className="p-0">
            <View className="gap-1">
              <Card.Title>{t("profile.accountDetails")}</Card.Title>
              <Card.Description>{t("profile.accountDescription")}</Card.Description>
            </View>
          </Card.Header>
          <Card.Content className="gap-5 p-0">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <PanelInput
                  ref={ref}
                  label={t("profile.name")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  isRequired
                  errorMessage={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { value } }) => (
                <PanelInput
                  label={t("profile.email")}
                  value={value}
                  editable={false}
                  accessibilityState={{ disabled: true }}
                  description={t("profile.readOnly")}
                />
              )}
            />

            <PanelInput
              label={t("profile.role")}
              value={roleOption?.label ?? t("profile.role")}
              editable={false}
              accessibilityState={{ disabled: true }}
              description={t("profile.readOnly")}
            />
            <PanelInput
              label={t("profile.merchants")}
              value={
                merchantOptions.map((merchant) => merchant.label).join(", ") ||
                t("profile.noMerchants")
              }
              editable={false}
              accessibilityState={{ disabled: true }}
              description={t("profile.readOnly")}
            />
          </Card.Content>
        </Card>

        <View className="flex-1 gap-3">
          {errors.root?.server?.message ? (
            <Typography type="body-sm" className="text-destructive">
              {errors.root.server.message}
            </Typography>
          ) : null}
          <View className="flex-col gap-3 md:flex-row">
            <PanelErrorButton variant="ghost" onPress={onCancel} disabled={isPending}>
              {t("common.cancel")}
            </PanelErrorButton>
            <PanelErrorButton className="flex-1" onPress={onSubmit} disabled={!isDirty || isPending}>
              {isPending ? t("common.saving") : t("profile.saveChanges")}
            </PanelErrorButton>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

import { getErrorMessage, isApiError } from "@/api/api-error";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import {
  useAccountProfile,
  useUpdateAccountProfile,
} from "@/hooks/db/use-account-profile";
import { createAccountSchema, type AccountFormValues } from "@/schemas/account";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  TextField,
  Typography,
  useToast,
} from "heroui-native";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function AccountScreen(): React.JSX.Element {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const { toast } = useToast();
  const storedUser = useAuth((state) => state.user);
  const storedMerchants = useAuth((state) => state.merchants);
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const merchants = React.useMemo(
    () => (storedMerchants.length > 0 ? storedMerchants : activeMerchant ? [activeMerchant] : []),
    [activeMerchant, storedMerchants]
  );
  const profileQuery = useAccountProfile();
  const updateProfile = useUpdateAccountProfile();
  const accountSchema = createAccountSchema(t);
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
      name: storedUser?.name ?? "",
      email: storedUser?.email ?? "",
      role: storedUser?.role ?? "",
      roleLabel: storedUser?.role_label ?? "",
      merchantIds: merchants.map((merchant) => merchant.id),
    },
  });
  const formValues = useWatch({ control });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  React.useLayoutEffect(() => {
    const user = profileQuery.data;
    if (!user || isDirty) return;
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: user.role_label,
      merchantIds: merchants.map((merchant) => merchant.id),
    });
  }, [isDirty, merchants, profileQuery.data, reset]);

  if (
    profileQuery.isLoading ||
    (profileQuery.isFetching && !profileQuery.isFetchedAfterMount)
  ) {
    return <LoadingState message={t("profile.loading")} />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} />;
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
        variant: "danger",
        label: t("profile.updateFailed"),
        description: message,
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <View className="w-full max-w-3xl gap-6">
        <Card>
          <Card.Header>
            <View className="gap-1">
              <Card.Title>{t("profile.accountDetails")}</Card.Title>
              <Card.Description>{t("profile.accountDescription")}</Card.Description>
            </View>
          </Card.Header>
          <Card.Body className="gap-5">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField isRequired isInvalid={Boolean(errors.name)}>
                  <Label>{t("profile.name")}</Label>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                  />
                  {errors.name?.message ? (
                    <Typography type="body-xs" className="text-danger">
                      {errors.name.message}
                    </Typography>
                  ) : null}
                </TextField>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { value } }) => (
                <TextField>
                  <Label>{t("profile.email")}</Label>
                  <Input value={value} editable={false} accessibilityState={{ disabled: true }} />
                  <Typography type="body-xs" color="muted">
                    {t("profile.readOnly")}
                  </Typography>
                </TextField>
              )}
            />

            <View className="gap-1.5">
              <Label>{t("profile.role")}</Label>
              <Select value={roleOption} isDisabled presentation="popover">
                <Select.Trigger>
                  <Typography type="body-sm" className="flex-1">
                    {roleOption?.label ?? t("profile.role")}
                  </Typography>
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content presentation="popover">
                    {roleOption ? (
                      <Select.Item
                        value={roleOption.value}
                        label={roleOption.label}
                      />
                    ) : null}
                  </Select.Content>
                </Select.Portal>
              </Select>
              <Typography type="body-xs" color="muted">
                {t("profile.readOnly")}
              </Typography>
            </View>

            <View className="gap-1.5">
              <Label>{t("profile.merchants")}</Label>
              <Select
                selectionMode="multiple"
                value={merchantOptions}
                isDisabled
                presentation="popover"
              >
                <Select.Trigger>
                  <Typography type="body-sm" className="flex-1" numberOfLines={1}>
                    {merchantOptions.map((merchant) => merchant.label).join(", ") ||
                      t("profile.noMerchants")}
                  </Typography>
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content presentation="popover">
                    {merchantOptions.map((merchant) => (
                      <Select.Item
                        key={merchant.value}
                        value={merchant.value}
                        label={merchant.label}
                      />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
              <Typography type="body-xs" color="muted">
                {t("profile.readOnly")}
              </Typography>
            </View>
          </Card.Body>
        </Card>

        <View className="flex-1 gap-3">
          {errors.root?.server?.message ? (
            <Typography type="body-sm" className="text-danger">
              {errors.root.server.message}
            </Typography>
          ) : null}
          <View className="flex-col gap-3 md:flex-row">
            <Button
              variant="ghost"
              onPress={() => router.back()}
              isDisabled={updateProfile.isPending}
            >
              <Button.Label>{t("common.cancel")}</Button.Label>
            </Button>
            <Button
              className="flex-1"
              onPress={handleSubmit(submitAccount)}
              isDisabled={!isDirty || updateProfile.isPending}
            >
              <Button.Label>
                {updateProfile.isPending ? t("common.saving") : t("profile.saveChanges")}
              </Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

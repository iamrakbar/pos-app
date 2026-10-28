import {
  Button as PanelButton,
  Label as PanelLabel,
  Tabs as PanelTabs,
  Typography,
  Spinner as PanelLoadingSpinner,
  Typography as PanelLoadingText,
  Input as PanelInput,
  Textarea as PanelTextarea,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Card,
  Switch as PanelSwitch,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage, isApiError } from "@/api/api-error";
import type { MerchantImageAsset } from "@/api/endpoints/merchant";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import {
  useMerchantProfile,
  useUpdateMerchantProfile,
  useUploadMerchantCover,
  useUploadMerchantLogo,
} from "@/hooks/db/use-merchant-profile";
import type { Translate } from "@/locales";
import {
  createMerchantProfileSchema,
  type MerchantProfileFormValues,
} from "@/schemas/merchant-profile";
import { useTranslation } from "@/stores/use-locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { File as ExpoFile } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Controller,
  useController,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { Platform, Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router, Stack } from "expo-router";
import MerchantQrOverlay from "./merchant-qr-overlay";

const MERCHANT_IMAGE_MAX_EDGE = 1600;
const MERCHANT_IMAGE_QUALITY = 0.82;
const MERCHANT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

type ImageKind = "logo" | "cover";

async function optimizeMerchantImage(
  asset: ImagePicker.ImagePickerAsset,
  kind: ImageKind,
  t: Translate
): Promise<MerchantImageAsset> {
  const context = ImageManipulator.manipulate(asset.uri);
  const scale = Math.min(1, MERCHANT_IMAGE_MAX_EDGE / Math.max(asset.width, asset.height));

  if (scale < 1) {
    context.resize({
      width: Math.round(asset.width * scale),
      height: Math.round(asset.height * scale),
    });
  }

  const renderedImage = await context.renderAsync();
  const optimizedImage = await renderedImage.saveAsync({
    compress: MERCHANT_IMAGE_QUALITY,
    format: SaveFormat.JPEG,
  });

  let size: number;
  if (Platform.OS === "web") {
    const response = await fetch(optimizedImage.uri);
    if (!response.ok)
      throw new Error(t("productForm.imageReadFailed", { status: response.status }));
    size = (await response.blob()).size;
  } else {
    size = new ExpoFile(optimizedImage.uri).size ?? 0;
  }

  if (size > MERCHANT_IMAGE_MAX_BYTES) {
    throw new Error(t("productForm.imageTooLarge"));
  }

  return {
    uri: optimizedImage.uri,
    name: `${kind}-${Date.now()}.jpg`,
    type: "image/jpeg",
  };
}

async function uploadMerchantImage({
  asset,
  kind,
  t,
  toast,
  uploadLogo,
  uploadCover,
  onSettled,
}: {
  asset: ImagePicker.ImagePickerAsset;
  kind: ImageKind;
  t: Translate;
  toast: ReturnType<typeof useToast>["toast"];
  uploadLogo: ReturnType<typeof useUploadMerchantLogo>;
  uploadCover: ReturnType<typeof useUploadMerchantCover>;
  onSettled: () => void;
}): Promise<void> {
  try {
    const optimized = await optimizeMerchantImage(asset, kind, t);
    if (kind === "logo") {
      await uploadLogo.mutateAsync(optimized);
      toast.show({ variant: "success", label: t("merchantProfile.logoUpdated") });
    } else {
      await uploadCover.mutateAsync(optimized);
      toast.show({ variant: "success", label: t("merchantProfile.coverUpdated") });
    }
  } catch (error) {
    toast.show({
      variant: "destructive",
      label:
        kind === "logo"
          ? t("merchantProfile.logoUpdateFailed")
          : t("merchantProfile.coverUpdateFailed"),
      description: getErrorMessage(error),
    });
  } finally {
    onSettled();
  }
}

async function pickMerchantImage({
  kind,
  t,
  toast,
  uploadLogo,
  uploadCover,
  onStart,
  onSettled,
}: {
  kind: ImageKind;
  t: Translate;
  toast: ReturnType<typeof useToast>["toast"];
  uploadLogo: ReturnType<typeof useUploadMerchantLogo>;
  uploadCover: ReturnType<typeof useUploadMerchantCover>;
  onStart: () => void;
  onSettled: () => void;
}): Promise<void> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    toast.show({
      variant: "warning",
      label: t("productForm.photoPermission"),
      description: t("productForm.photoPermissionDescription"),
    });
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: kind === "logo" ? [1, 1] : [16, 9],
    quality: 1,
  });
  if (result.canceled) return;

  onStart();
  await uploadMerchantImage({
    asset: result.assets[0],
    kind,
    t,
    toast,
    uploadLogo,
    uploadCover,
    onSettled,
  });
}

async function saveMerchantProfile({
  values,
  updateProfile,
  reset,
  t,
  toast,
  setError,
}: {
  values: MerchantProfileFormValues;
  updateProfile: ReturnType<typeof useUpdateMerchantProfile>;
  reset: (values: MerchantProfileFormValues) => void;
  t: Translate;
  toast: ReturnType<typeof useToast>["toast"];
  setError: (field: "name" | "root.server", error: { type: string; message: string }) => void;
}): Promise<void> {
  try {
    const updated = await updateProfile.mutateAsync({
      name: values.name.trim(),
      description: values.description.trim() || null,
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      website: values.website.trim() || null,
      terms: values.terms.trim() || null,
      dine_in: values.dine_in,
      takeaway: values.takeaway,
      delivery: values.delivery,
      tax_is_enable: values.tax_is_enable,
      tax_name: values.tax_name.trim(),
      tax_value: values.tax_is_enable ? Number(values.tax_value) : 0,
      charge_app_payment_fee_to_customer: values.charge_app_payment_fee_to_customer,
    });
    reset({
      name: updated.name,
      description: updated.description ?? "",
      phone: updated.phone ?? "",
      email: updated.email ?? "",
      website: updated.website ?? "",
      terms: updated.terms ?? "",
      dine_in: updated.dine_in,
      takeaway: updated.takeaway,
      delivery: updated.delivery,
      tax_is_enable: updated.tax_is_enable,
      tax_name: updated.tax_name ?? "",
      tax_value: updated.tax_value !== null ? String(updated.tax_value) : "",
      charge_app_payment_fee_to_customer: updated.charge_app_payment_fee_to_customer,
    });
    toast.show({ variant: "success", label: t("merchantProfile.updated") });
  } catch (error) {
    const fieldMessage = isApiError(error) ? error.errors?.name?.[0] : undefined;
    if (fieldMessage) setError("name", { type: "server", message: fieldMessage });
    const message = fieldMessage ?? getErrorMessage(error);
    setError("root.server", { type: "server", message });
    toast.show({
      variant: "destructive",
      label: t("merchantProfile.updateFailed"),
      description: message,
    });
  }
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header className="pb-2 p-0">
      <View className="gap-1">
        <Card.Title>{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </View>
    </Card.Header>
  );
}

function MerchantImageSlot({
  title,
  imageUri,
  aspectRatio,
  accentColor,
  isUploading,
  onSelect,
}: {
  title: string;
  imageUri: string | null | undefined;
  aspectRatio: number;
  accentColor: string;
  isUploading: boolean;
  onSelect: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-2">
      <PanelLabel>{title}</PanelLabel>
      <Pressable
        accessibilityRole="button"
        onPress={onSelect}
        disabled={isUploading}
        style={{ aspectRatio }}
        className="w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-surface-secondary active:opacity-80"
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <>
            <View className="size-12 items-center justify-center rounded-full bg-secondary">
              <AppIcon icon={AppIcons.image} size={22} color={accentColor} />
            </View>
            <Typography type="body-sm" weight="semibold">
              {isUploading ? t("common.saving") : t("merchantProfile.chooseImage")}
            </Typography>
          </>
        )}
      </Pressable>
      <Typography type="body-xs" muted>
        {t("merchantProfile.imageRequirements")}
      </Typography>
    </View>
  );
}

function GeneralTab({
  control,
  errors,
}: {
  control: Control<MerchantProfileFormValues>;
  errors: FieldErrors<MerchantProfileFormValues>;
}) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 p-4">
      <SectionHeading
        title={t("merchantProfile.generalTitle")}
        description={t("merchantProfile.generalDescription")}
      />
      <Card.Content className="gap-5 p-0">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("merchantProfile.name")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.name?.message}
              isRequired
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelTextarea
              ref={ref}
              label={t("merchantProfile.description")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.description?.message}
              rows={3}
            />
          )}
        />

        <View className="flex-col gap-5 md:flex-row">
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                ref={ref}
                label={t("merchantProfile.phone")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.phone?.message}
                containerClassName="flex-1"
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur, ref } }) => (
              <PanelInput
                ref={ref}
                label={t("merchantProfile.email")}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.email?.message}
                containerClassName="flex-1"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="website"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelInput
              ref={ref}
              label={t("merchantProfile.website")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.website?.message}
              keyboardType="url"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="terms"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <PanelTextarea
              ref={ref}
              label={t("merchantProfile.terms")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.terms?.message}
              rows={3}
              description={t("merchantProfile.termsHint")}
            />
          )}
        />
      </Card.Content>
    </Card>
  );
}

function ImagesTab({
  logoUri,
  coverUri,
  uploadingKind,
  accentColor,
  onSelectLogo,
  onSelectCover,
}: {
  logoUri: string | null | undefined;
  coverUri: string | null | undefined;
  uploadingKind: ImageKind | null;
  accentColor: string;
  onSelectLogo: () => void;
  onSelectCover: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 p-4">
      <SectionHeading
        title={t("merchantProfile.imagesTitle")}
        description={t("merchantProfile.imagesDescription")}
      />
      <Card.Content className="gap-5 p-0">
        <MerchantImageSlot
          title={t("merchantProfile.logo")}
          imageUri={logoUri}
          aspectRatio={1}
          accentColor={accentColor}
          isUploading={uploadingKind === "logo"}
          onSelect={onSelectLogo}
        />
        <MerchantImageSlot
          title={t("merchantProfile.cover")}
          imageUri={coverUri}
          aspectRatio={16 / 9}
          accentColor={accentColor}
          isUploading={uploadingKind === "cover"}
          onSelect={onSelectCover}
        />
      </Card.Content>
    </Card>
  );
}

function TypeTab({ control }: { control: Control<MerchantProfileFormValues> }) {
  const { t } = useTranslation();
  const rows: { name: "dine_in" | "takeaway" | "delivery"; label: string }[] = [
    { name: "dine_in", label: t("merchantProfile.dineIn") },
    { name: "takeaway", label: t("merchantProfile.takeaway") },
    { name: "delivery", label: t("merchantProfile.delivery") },
  ];

  return (
    <Card className="gap-3 p-4">
      <SectionHeading
        title={t("merchantProfile.typeTitle")}
        description={t("merchantProfile.typeDescription")}
      />
      <Card.Content className="gap-4 p-0">
        {rows.map((row) => (
          <Controller
            key={row.name}
            control={control}
            name={row.name}
            render={({ field: { value, onChange } }) => (
              <View className="flex-row items-center justify-between gap-3">
                <Typography type="body-sm" weight="semibold">
                  {row.label}
                </Typography>
                <PanelSwitch value={value} onValueChange={onChange} label={row.label} />
              </View>
            )}
          />
        ))}
      </Card.Content>
    </Card>
  );
}

function TaxTab({
  control,
  errors,
}: {
  control: Control<MerchantProfileFormValues>;
  errors: FieldErrors<MerchantProfileFormValues>;
}) {
  const { t } = useTranslation();
  const taxEnabled = useWatch({ control, name: "tax_is_enable" });
  const {
    field: {
      value: taxFieldValue,
      onChange: taxFieldChange,
      onBlur: taxFieldBlur,
      ref: taxFieldRef,
    },
  } = useController({ control, name: "tax_value" });
  const { localizedInputProps: taxInput } = useLocalizedNumberInput({
    value: taxFieldValue,
    onChange: taxFieldChange,
    formatOptions: { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 2 },
    minValue: 0,
    inputProps: { onBlur: taxFieldBlur },
  });

  return (
    <View className="gap-6">
      <Card className="gap-3 p-4">
        <SectionHeading title={t("merchantProfile.taxCalculationTitle")} />
        <Card.Content className="gap-4 p-0">
          <Controller
            control={control}
            name="tax_is_enable"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row items-center justify-between gap-3">
                <Typography type="body-sm" weight="semibold">
                  {t("merchantProfile.taxEnable")}
                </Typography>
                <PanelSwitch
                  value={value}
                  onValueChange={onChange}
                  label={t("merchantProfile.taxEnable")}
                />
              </View>
            )}
          />

          {taxEnabled ? (
            <View className="flex-col gap-4 md:flex-row">
              <Controller
                control={control}
                name="tax_name"
                render={({ field: { value, onChange, onBlur, ref } }) => (
                  <PanelInput
                    ref={ref}
                    label={t("merchantProfile.taxName")}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorMessage={errors.tax_name?.message}
                    containerClassName="flex-1"
                    isRequired
                  />
                )}
              />
              <PanelInput
                ref={taxFieldRef}
                containerClassName="flex-1"
                label={t("merchantProfile.taxValue")}
                errorMessage={errors.tax_value?.message}
                isRequired
                keyboardType="decimal-pad"
                {...taxInput}
              />
            </View>
          ) : null}
        </Card.Content>
      </Card>

      <Card className="gap-3 p-4">
        <SectionHeading title={t("merchantProfile.feesTitle")} />
        <Card.Content className="p-0">
          <Controller
            control={control}
            name="charge_app_payment_fee_to_customer"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row items-center justify-between gap-3">
                <Typography type="body-sm" weight="semibold">
                  {t("merchantProfile.chargeFeeToCustomer")}
                </Typography>
                <PanelSwitch
                  value={value}
                  onValueChange={onChange}
                  label={t("merchantProfile.chargeFeeToCustomer")}
                />
              </View>
            )}
          />
        </Card.Content>
      </Card>
    </View>
  );
}

function MerchantProfileContent({
  t,
  profile,
  control,
  errors,
  activeTab,
  onTabChange,
  accentColor,
  foregroundColor,
  uploadingKind,
  onSelectLogo,
  onSelectCover,
  isQrOpen,
  onQrChange,
  isDirty,
  isSaving,
  onCancel,
  onSubmit,
}: {
  t: Translate;
  profile: App.Data.Merchant.Profile.MerchantProfileData;
  control: Control<MerchantProfileFormValues>;
  errors: FieldErrors<MerchantProfileFormValues>;
  activeTab: string;
  onTabChange: (value: string) => void;
  accentColor: string;
  foregroundColor: string;
  uploadingKind: ImageKind | null;
  onSelectLogo: () => void;
  onSelectCover: () => void;
  isQrOpen: boolean;
  onQrChange: (isOpen: boolean) => void;
  isDirty: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}): React.JSX.Element {
  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <PanelButton
              variant="ghost"
              size="icon"
              onPress={() => onQrChange(true)}
              accessibilityLabel={t("merchantProfile.qrTitle")}
            >
              <AppIcon icon={AppIcons.qrCode} size={20} color={foregroundColor} />
            </PanelButton>
          ),
        }}
      />
      <MerchantQrOverlay slug={profile.slug} isOpen={isQrOpen} onOpenChange={onQrChange} />
      <View className="w-full max-w-3xl gap-6">
        <View className="flex-1 gap-6">
          <PanelTabs
            defaultValue="general"
            value={activeTab}
            onValueChange={onTabChange}
            keepMounted
          >
            <PanelTabs.List scrollable>
              <PanelTabs.Trigger value="general">
                {t("merchantProfile.tabGeneral")}
              </PanelTabs.Trigger>
              <PanelTabs.Trigger value="images">{t("merchantProfile.tabImages")}</PanelTabs.Trigger>
              <PanelTabs.Trigger value="type">{t("merchantProfile.tabType")}</PanelTabs.Trigger>
              <PanelTabs.Trigger value="tax">{t("merchantProfile.tabTax")}</PanelTabs.Trigger>
            </PanelTabs.List>

            <PanelTabs.Content value="general" className="pt-4">
              <GeneralTab control={control} errors={errors} />
            </PanelTabs.Content>
            <PanelTabs.Content value="images" className="pt-4">
              <ImagesTab
                logoUri={profile.logo_url}
                coverUri={profile.cover_url}
                uploadingKind={uploadingKind}
                accentColor={accentColor}
                onSelectLogo={onSelectLogo}
                onSelectCover={onSelectCover}
              />
            </PanelTabs.Content>
            <PanelTabs.Content value="type" className="pt-4">
              <TypeTab control={control} />
            </PanelTabs.Content>
            <PanelTabs.Content value="tax" className="pt-4">
              <TaxTab control={control} errors={errors} />
            </PanelTabs.Content>
          </PanelTabs>

          {activeTab !== "images" ? (
            <View className="gap-3">
              {errors.root?.server?.message ? (
                <Typography type="body-sm" className="text-destructive">
                  {errors.root.server.message}
                </Typography>
              ) : null}

              <View className="flex-col gap-3 md:flex-row">
                <PanelButton variant="ghost" onPress={onCancel} disabled={isSaving}>
                  {t("common.cancel")}
                </PanelButton>
                <PanelButton className="flex-1" onPress={onSubmit} disabled={!isDirty || isSaving}>
                  {isSaving ? t("common.saving") : t("merchantProfile.saveChanges")}
                </PanelButton>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

export default function MerchantProfileScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accentColor, foregroundColor] = useCSSVariable([
    "--color-primary",
    "--color-foreground",
  ]) as [string, string];
  const profileQuery = useMerchantProfile();
  const updateProfile = useUpdateMerchantProfile();
  const uploadLogo = useUploadMerchantLogo();
  const uploadCover = useUploadMerchantCover();
  const [activeTab, setActiveTab] = React.useState("general");
  const [uploadingKind, setUploadingKind] = React.useState<ImageKind | null>(null);
  const [isQrOpen, setIsQrOpen] = React.useState(false);

  const merchantProfileSchema = createMerchantProfileSchema(t);
  const profile = profileQuery.data;
  const formValues: MerchantProfileFormValues | undefined = profile
    ? {
        name: profile.name,
        description: profile.description ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        terms: profile.terms ?? "",
        dine_in: profile.dine_in,
        takeaway: profile.takeaway,
        delivery: profile.delivery,
        tax_is_enable: profile.tax_is_enable,
        tax_name: profile.tax_name ?? "",
        tax_value: profile.tax_value !== null ? String(profile.tax_value) : "",
        charge_app_payment_fee_to_customer: profile.charge_app_payment_fee_to_customer,
      }
    : undefined;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<MerchantProfileFormValues>({
    resolver: zodResolver(merchantProfileSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      email: "",
      website: "",
      terms: "",
      dine_in: true,
      takeaway: true,
      delivery: false,
      tax_is_enable: false,
      tax_name: "",
      tax_value: "",
      charge_app_payment_fee_to_customer: false,
    },
    values: formValues,
    resetOptions: { keepDirtyValues: true, keepErrors: true },
  });

  if (profileQuery.isLoading || (profileQuery.isFetching && !profileQuery.isFetchedAfterMount)) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <PanelLoadingSpinner />
        <PanelLoadingText type="body-sm" muted>
          {t("merchantProfile.loading")}
        </PanelLoadingText>
      </View>
    );
  }

  if (profileQuery.isError || !profile) {
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

  const pickImage = async (kind: ImageKind) => {
    await pickMerchantImage({
      kind,
      t,
      toast,
      uploadLogo,
      uploadCover,
      onStart: () => setUploadingKind(kind),
      onSettled: () => setUploadingKind(null),
    });
  };

  const submitProfile = async (values: MerchantProfileFormValues) => {
    await saveMerchantProfile({ values, updateProfile, reset, t, toast, setError });
  };

  return (
    <MerchantProfileContent
      t={t}
      profile={profile}
      control={control}
      errors={errors}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentColor={accentColor}
      foregroundColor={foregroundColor}
      uploadingKind={uploadingKind}
      onSelectLogo={() => void pickImage("logo")}
      onSelectCover={() => void pickImage("cover")}
      isQrOpen={isQrOpen}
      onQrChange={setIsQrOpen}
      isDirty={isDirty}
      isSaving={updateProfile.isPending}
      onCancel={() => router.back()}
      onSubmit={() => void handleSubmit(submitProfile)()}
    />
  );
}

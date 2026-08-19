import { getErrorMessage, isApiError } from "@/api/api-error";
import type { MerchantImageAsset } from "@/api/endpoints/merchant";
import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
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
import {
  Button,
  Card,
  Input,
  Label,
  Switch,
  Tabs,
  TextArea,
  TextField,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import { Controller, useForm, useWatch, type Control, type FieldErrors } from "react-hook-form";
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

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header className="pb-2">
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
      <Label>{title}</Label>
      <Pressable
        accessibilityRole="button"
        onPress={onSelect}
        disabled={isUploading}
        style={{ aspectRatio }}
        className="w-full items-center justify-center gap-2 overflow-hidden rounded-panel-inner bg-surface-secondary active:opacity-80"
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <>
            <View className="size-12 items-center justify-center rounded-full bg-accent-soft">
              <AppIcon name="image-outline" size={22} color={accentColor} />
            </View>
            <Typography type="body-sm" weight="semibold">
              {isUploading ? t("common.saving") : t("merchantProfile.chooseImage")}
            </Typography>
          </>
        )}
      </Pressable>
      <Typography type="body-xs" color="muted">
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
    <Card className="gap-3">
      <SectionHeading
        title={t("merchantProfile.generalTitle")}
        description={t("merchantProfile.generalDescription")}
      />
      <Card.Body className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isRequired isInvalid={Boolean(errors.name)}>
              <Label>{t("merchantProfile.name")}</Label>
              <Input value={value} onChangeText={onChange} onBlur={onBlur} />
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
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isInvalid={Boolean(errors.description)}>
              <Label>{t("merchantProfile.description")}</Label>
              <TextArea value={value} onChangeText={onChange} onBlur={onBlur} numberOfLines={3} />
              {errors.description?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.description.message}
                </Typography>
              ) : null}
            </TextField>
          )}
        />

        <View className="flex-col gap-5 md:flex-row">
          <Controller
            control={control}
            name="phone"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField className="flex-1" isInvalid={Boolean(errors.phone)}>
                <Label>{t("merchantProfile.phone")}</Label>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                />
                {errors.phone?.message ? (
                  <Typography type="body-xs" className="text-danger">
                    {errors.phone.message}
                  </Typography>
                ) : null}
              </TextField>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField className="flex-1" isInvalid={Boolean(errors.email)}>
                <Label>{t("merchantProfile.email")}</Label>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email?.message ? (
                  <Typography type="body-xs" className="text-danger">
                    {errors.email.message}
                  </Typography>
                ) : null}
              </TextField>
            )}
          />
        </View>

        <Controller
          control={control}
          name="website"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isInvalid={Boolean(errors.website)}>
              <Label>{t("merchantProfile.website")}</Label>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.website?.message ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.website.message}
                </Typography>
              ) : null}
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="terms"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField isInvalid={Boolean(errors.terms)}>
              <Label>{t("merchantProfile.terms")}</Label>
              <TextArea value={value} onChangeText={onChange} onBlur={onBlur} numberOfLines={3} />
              <Typography type="body-xs" color="muted">
                {t("merchantProfile.termsHint")}
              </Typography>
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="auto_process_on_payment_settlement"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-1">
                <Typography type="body-sm" weight="semibold">
                  {t("merchantProfile.autoProcessTitle")}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {t("merchantProfile.autoProcessDescription")}
                </Typography>
              </View>
              <Switch isSelected={value} onSelectedChange={onChange} />
            </View>
          )}
        />
      </Card.Body>
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
    <Card className="gap-3">
      <SectionHeading
        title={t("merchantProfile.imagesTitle")}
        description={t("merchantProfile.imagesDescription")}
      />
      <Card.Body className="gap-5">
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
      </Card.Body>
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
    <Card className="gap-3">
      <SectionHeading
        title={t("merchantProfile.typeTitle")}
        description={t("merchantProfile.typeDescription")}
      />
      <Card.Body className="gap-4">
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
                <Switch isSelected={value} onSelectedChange={onChange} />
              </View>
            )}
          />
        ))}
      </Card.Body>
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

  return (
    <View className="gap-6">
      <Card className="gap-3">
        <SectionHeading title={t("merchantProfile.taxCalculationTitle")} />
        <Card.Body className="gap-4">
          <Controller
            control={control}
            name="tax_is_enable"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row items-center justify-between gap-3">
                <Typography type="body-sm" weight="semibold">
                  {t("merchantProfile.taxEnable")}
                </Typography>
                <Switch isSelected={value} onSelectedChange={onChange} />
              </View>
            )}
          />

          {taxEnabled ? (
            <View className="flex-col gap-4 md:flex-row">
              <Controller
                control={control}
                name="tax_name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField className="flex-1" isRequired isInvalid={Boolean(errors.tax_name)}>
                    <Label>{t("merchantProfile.taxName")}</Label>
                    <Input value={value} onChangeText={onChange} onBlur={onBlur} />
                    {errors.tax_name?.message ? (
                      <Typography type="body-xs" className="text-danger">
                        {errors.tax_name.message}
                      </Typography>
                    ) : null}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="tax_value"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField className="flex-1" isRequired isInvalid={Boolean(errors.tax_value)}>
                    <Label>{t("merchantProfile.taxValue")}</Label>
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                    />
                    {errors.tax_value?.message ? (
                      <Typography type="body-xs" className="text-danger">
                        {errors.tax_value.message}
                      </Typography>
                    ) : null}
                  </TextField>
                )}
              />
            </View>
          ) : null}
        </Card.Body>
      </Card>

      <Card className="gap-3">
        <SectionHeading title={t("merchantProfile.feesTitle")} />
        <Card.Body>
          <Controller
            control={control}
            name="charge_app_payment_fee_to_customer"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row items-center justify-between gap-3">
                <Typography type="body-sm" weight="semibold">
                  {t("merchantProfile.chargeFeeToCustomer")}
                </Typography>
                <Switch isSelected={value} onSelectedChange={onChange} />
              </View>
            )}
          />
        </Card.Body>
      </Card>
    </View>
  );
}

export default function MerchantProfileScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accentColor, foregroundColor] = useThemeColor(["accent", "foreground"]);
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
        auto_process_on_payment_settlement: profile.auto_process_on_payment_settlement,
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
      auto_process_on_payment_settlement: false,
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
    return <LoadingState message={t("merchantProfile.loading")} />;
  }

  if (profileQuery.isError || !profile) {
    return <ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} />;
  }

  const pickImage = async (kind: ImageKind) => {
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

    setUploadingKind(kind);
    try {
      const asset = await optimizeMerchantImage(result.assets[0], kind, t);
      if (kind === "logo") {
        await uploadLogo.mutateAsync(asset);
        toast.show({ variant: "success", label: t("merchantProfile.logoUpdated") });
      } else {
        await uploadCover.mutateAsync(asset);
        toast.show({ variant: "success", label: t("merchantProfile.coverUpdated") });
      }
    } catch (error) {
      toast.show({
        variant: "danger",
        label:
          kind === "logo"
            ? t("merchantProfile.logoUpdateFailed")
            : t("merchantProfile.coverUpdateFailed"),
        description: getErrorMessage(error),
      });
    } finally {
      setUploadingKind(null);
    }
  };

  const submitProfile = async (values: MerchantProfileFormValues) => {
    try {
      const updated = await updateProfile.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim() || null,
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        website: values.website.trim() || null,
        terms: values.terms.trim() || null,
        auto_process_on_payment_settlement: values.auto_process_on_payment_settlement,
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
        auto_process_on_payment_settlement: updated.auto_process_on_payment_settlement,
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
        variant: "danger",
        label: t("merchantProfile.updateFailed"),
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              variant="ghost"
              isIconOnly
              onPress={() => setIsQrOpen(true)}
              accessibilityLabel={t("merchantProfile.qrTitle")}
            >
              <AppIcon name="qr-code-outline" size={20} color={foregroundColor} />
            </Button>
          ),
        }}
      />
      <MerchantQrOverlay slug={profile.slug} isOpen={isQrOpen} onOpenChange={setIsQrOpen} />
      <View className="w-full max-w-3xl gap-6">
        <View className="flex-1 gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.ScrollView>
                <Tabs.Indicator />
                <Tabs.Trigger value="general">
                  <Tabs.Label>{t("merchantProfile.tabGeneral")}</Tabs.Label>
                </Tabs.Trigger>
                <Tabs.Trigger value="images">
                  <Tabs.Label>{t("merchantProfile.tabImages")}</Tabs.Label>
                </Tabs.Trigger>
                <Tabs.Trigger value="type">
                  <Tabs.Label>{t("merchantProfile.tabType")}</Tabs.Label>
                </Tabs.Trigger>
                <Tabs.Trigger value="tax">
                  <Tabs.Label>{t("merchantProfile.tabTax")}</Tabs.Label>
                </Tabs.Trigger>
              </Tabs.ScrollView>
            </Tabs.List>

            <Tabs.Content value="general" className="pt-4">
              <GeneralTab control={control} errors={errors} />
            </Tabs.Content>
            <Tabs.Content value="images" className="pt-4">
              <ImagesTab
                logoUri={profile.logo_url}
                coverUri={profile.cover_url}
                uploadingKind={uploadingKind}
                accentColor={accentColor}
                onSelectLogo={() => pickImage("logo")}
                onSelectCover={() => pickImage("cover")}
              />
            </Tabs.Content>
            <Tabs.Content value="type" className="pt-4">
              <TypeTab control={control} />
            </Tabs.Content>
            <Tabs.Content value="tax" className="pt-4">
              <TaxTab control={control} errors={errors} />
            </Tabs.Content>
          </Tabs>

          {activeTab !== "images" ? (
            <View className="gap-3">
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
                  onPress={handleSubmit(submitProfile)}
                  isDisabled={!isDirty || updateProfile.isPending}
                >
                  <Button.Label>
                    {updateProfile.isPending
                      ? t("common.saving")
                      : t("merchantProfile.saveChanges")}
                  </Button.Label>
                </Button>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

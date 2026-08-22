import ActionDialog from "@/components/common/action-dialog";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import AppIcon from "@/components/common/app-icon";
import {
  useDiscount,
  useCreateDiscount,
  useDeleteDiscount,
  useUpdateDiscount,
} from "@/hooks/db/use-discounts";
import { useManagementProducts } from "@/hooks/db/use-products";
import { useDiscountProductDraft } from "@/stores/use-discount-product-draft-store";
import {
  createDiscountSchema,
  toDiscountRequest,
  type DiscountFormValues,
} from "@/schemas/discount";
import { getErrorMessage, isApiError } from "@/api/api-error";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { getLocaleTag } from "@/locales";
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
import { Controller, useForm } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Calendar, DatePicker, type DatePickerOption } from "heroui-native-pro";
import React from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

function FieldMessage({ message }: { message?: string }) {
  return message ? (
    <Typography type="body-xs" className="text-danger">
      {message}
    </Typography>
  ) : null;
}

function toDateOption(value: string, localeTag: string): DatePickerOption | undefined {
  if (!value) return undefined;
  return {
    value,
    label: new Date(`${value}T00:00:00`).toLocaleDateString(localeTag, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

function DiscountDatePicker({
  label,
  value,
  onChange,
  localeTag,
  presentation,
  isInvalid,
  message,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  localeTag: string;
  presentation: "dialog" | "popover" | "bottom-sheet";
  isInvalid: boolean;
  message?: string;
}) {
  return (
    <View className="flex-1 gap-1">
      <DatePicker
        value={toDateOption(value, localeTag)}
        onValueChange={(next) => onChange(next?.value ?? "")}
        locale={localeTag}
        dateDisplayFormat="medium"
        isInvalid={isInvalid}
      >
        <Label>{label}</Label>
        <DatePicker.Select presentation={presentation}>
          <DatePicker.Trigger>
            <DatePicker.Value />
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
          <DatePicker.Portal>
            <DatePicker.Overlay />
            <DatePicker.Content
              presentation={presentation}
              width={presentation === "popover" ? "trigger" : undefined}
            >
              <DatePicker.Calendar>
                <Calendar.Header>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell day={day} />}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => <Calendar.Cell date={date} />}
                  </Calendar.GridBody>
                </Calendar.Grid>
              </DatePicker.Calendar>
            </DatePicker.Content>
          </DatePicker.Portal>
        </DatePicker.Select>
      </DatePicker>
      <FieldMessage message={message} />
    </View>
  );
}

export default function DiscountFormScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { locale, t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const muted = useThemeColor("muted");
  const danger = useThemeColor("danger");
  const localeTag = getLocaleTag(locale);
  const { pickerPresentation } = useOverlayPresentation();
  const discountQuery = useDiscount(id);
  const productsQuery = useManagementProducts();
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount(id);
  const deleteMutation = useDeleteDiscount();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const hydratedId = React.useRef<string | null>(null);
  const schema = createDiscountSchema(t);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      unit: "percentage",
      value: "",
      start: "",
      end: "",
      active: true,
      products: [],
    },
  });
  const selectedProductIds = useDiscountProductDraft((state) => state.productIds);
  const initializeProductDraft = useDiscountProductDraft((state) => state.initialize);

  React.useEffect(() => {
    const discount = discountQuery.data;
    if (isNew) {
      initializeProductDraft("new", []);
      return;
    }
    if (!discount || hydratedId.current === discount.id) return;
    const productIds = Object.values(discount.product_ids ?? {});
    initializeProductDraft(discount.id, productIds);
    reset({
      name: discount.name,
      unit: discount.unit === "fixed" ? "fixed" : "percentage",
      value: String(discount.value),
      start: discount.start?.slice(0, 10) ?? "",
      end: discount.end?.slice(0, 10) ?? "",
      active: discount.active,
      products: productIds,
    });
    hydratedId.current = discount.id;
  }, [discountQuery.data, initializeProductDraft, isNew, reset]);

  if (!isNew && discountQuery.isLoading)
    return <LoadingState message={t("discounts.loadingOne")} />;
  if (!isNew && discountQuery.isError)
    return <ErrorState error={discountQuery.error} onRetry={discountQuery.refetch} />;

  const submit = async (values: DiscountFormValues) => {
    if (selectedProductIds.length === 0) {
      setError("products", { type: "manual", message: t("discounts.productsRequired") });
      toast.show({ variant: "warning", label: t("discounts.productsRequired") });
      return;
    }
    try {
      const request = toDiscountRequest({ ...values, products: selectedProductIds });
      if (isNew) await createMutation.mutateAsync(request);
      else await updateMutation.mutateAsync(request);
      toast.show({
        variant: "success",
        label: isNew ? t("discounts.created") : t("discounts.updated"),
      });
      router.back();
    } catch (error) {
      if (isApiError(error) && error.errors) {
        for (const [field, messages] of Object.entries(error.errors)) {
          if (
            ["name", "unit", "value", "start", "end", "products", "active"].some(
              (key) => field === key || field.startsWith(`${key}.`)
            ) &&
            messages[0]
          ) {
            setError(field as keyof DiscountFormValues, { type: "server", message: messages[0] });
          }
        }
      }
      toast.show({
        variant: "danger",
        label: t("discounts.saveFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.show({ variant: "success", label: t("discounts.deleted") });
      router.back();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("discounts.deleteFailed"),
        description: getErrorMessage(error),
      });
    }
  };
  const saving = createMutation.isPending || updateMutation.isPending;
  const selectedProducts = (productsQuery.data ?? []).filter((product) =>
    selectedProductIds.includes(product.id)
  );

  return (
    <>
      <Stack.Screen
        options={{ title: isNew ? t("discounts.newTitle") : t("discounts.editTitle") }}
      />
      {!isNew ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={danger}
            accessibilityLabel={t("discounts.deleteAccessibility")}
            onPress={() => setConfirmDelete(true)}
          />
        </Stack.Toolbar>
      ) : null}
      <KeyboardAwareScrollView
        className="flex-1 bg-background"
        contentContainerClassName="items-center gap-3 px-4 py-6 pb-10 md:px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="w-full max-w-3xl gap-5">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>{t("discounts.detailsTitle")}</Card.Title>
              <Card.Description>{t("discounts.detailsDescription")}</Card.Description>
            </View>
          </Card.Header>
          <Card.Body className="gap-5">
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <TextField isRequired isInvalid={!!errors.name}>
                  <Label>{t("discounts.name")}</Label>
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={t("discounts.namePlaceholder")}
                  />
                  <FieldMessage message={errors.name?.message} />
                </TextField>
              )}
            />
            <Controller
              control={control}
              name="unit"
              render={({ field: { value, onChange } }) => (
                <View className="gap-2">
                  <Label>{t("discounts.unit")}</Label>
                  <View className="flex-row gap-2">
                    {(["percentage", "fixed"] as const).map((unit) => (
                      <Button
                        key={unit}
                        variant={value === unit ? "primary" : "secondary"}
                        onPress={() => onChange(unit)}
                        className="flex-1"
                      >
                        <Button.Label>
                          {unit === "percentage" ? t("discounts.percentage") : t("discounts.fixed")}
                        </Button.Label>
                      </Button>
                    ))}
                  </View>
                </View>
              )}
            />
            <Controller
              control={control}
              name="value"
              render={({ field: { value, onChange } }) => (
                <TextField isRequired isInvalid={!!errors.value}>
                  <Label>{t("discounts.value")}</Label>
                  <Input
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ""))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                  <FieldMessage message={errors.value?.message} />
                </TextField>
              )}
            />
            <View className="gap-1">
              <Typography type="body-xs" color="muted">
                {t("discounts.dateHelp")}
              </Typography>
              <View className="flex-row gap-3">
                <Controller
                  control={control}
                  name="start"
                  render={({ field: { value, onChange } }) => (
                    <DiscountDatePicker
                      label={t("discounts.start")}
                      value={value}
                      onChange={onChange}
                      localeTag={localeTag}
                      presentation={pickerPresentation}
                      isInvalid={!!errors.start}
                      message={errors.start?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="end"
                  render={({ field: { value, onChange } }) => (
                    <DiscountDatePicker
                      label={t("discounts.end")}
                      value={value}
                      onChange={onChange}
                      localeTag={localeTag}
                      presentation={pickerPresentation}
                      isInvalid={!!errors.end}
                      message={errors.end?.message}
                    />
                  )}
                />
              </View>
            </View>
          </Card.Body>
        </Card>
        <Card className="w-full max-w-3xl">
          <Card.Header>
            <View className="gap-1">
              <Card.Title>{t("discounts.productsTitle")}</Card.Title>
              <Card.Description>{t("discounts.productsDescription")}</Card.Description>
            </View>
          </Card.Header>
          <Card.Body>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/settings/discounts/${id}/products` as never)}
              className="flex-row items-center gap-3 rounded-panel-inner bg-surface-secondary px-3 py-3 active:bg-surface-tertiary"
            >
              <View className="flex-1 gap-1">
                <Typography type="body-sm" weight="semibold">
                  {selectedProductIds.length
                    ? t("discounts.selectedProducts", { count: selectedProductIds.length })
                    : t("discounts.noProductsSelected")}
                </Typography>
              <Typography type="body-xs" color="muted" numberOfLines={1}>
                {selectedProductIds.length
                  ? selectedProducts.map((product) => product.name).join(", ")
                  : t("discounts.noProductsSelected")}
              </Typography>
              <FieldMessage message={errors.products?.message} />
              </View>
              <Typography type="body-sm" className="text-accent">
                {t("discounts.changeProducts")}
              </Typography>
              <AppIcon name="chevron-forward" size={16} color={muted} />
            </Pressable>
          </Card.Body>
        </Card>
        <Card className="w-full max-w-3xl">
          <Card.Header>
            <Card.Title>{t("discounts.statusTitle")}</Card.Title>
          </Card.Header>
          <Card.Body>
            <Controller
              control={control}
              name="active"
              render={({ field: { value, onChange } }) => (
                <View className="flex-row items-center gap-3">
                  <Switch isSelected={value} onSelectedChange={onChange}>
                    <Switch.Thumb />
                  </Switch>
                  <View className="flex-1">
                    <Typography type="body-sm" weight="semibold">
                      {value ? t("common.active") : t("common.inactive")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {t("discounts.statusDescription")}
                    </Typography>
                  </View>
                </View>
              )}
            />
          </Card.Body>
        </Card>
        <View className="w-full max-w-3xl flex-row gap-3 pt-2">
          <Button variant="ghost" onPress={() => router.back()} isDisabled={saving}>
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSubmit(submit)} isDisabled={saving}>
            <Button.Label>{saving ? t("common.saving") : t("common.save")}</Button.Label>
          </Button>
        </View>
      </KeyboardAwareScrollView>
      <ActionDialog
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("discounts.deleteTitle")}
        description={t("discounts.deleteDescription")}
        actionLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        actionVariant="danger"
        isActionDisabled={deleteMutation.isPending}
        onAction={handleDelete}
      />
    </>
  );
}

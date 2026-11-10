import ConfirmationDialog from "@/components/common/confirmation-dialog";
import RequestError from "@/components/common/request-error";
import { Spinner, Typography, Button, useToast } from "panelui-native";
import { useCSSVariable } from "uniwind";
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
import { isApiError } from "@/api/api-error";
import { getLocaleTag } from "@/locales";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import React from "react";
import { View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import {
  DiscountDetailsCard,
  DiscountProductsCard,
  DiscountStatusCard,
} from "./discount-form-sections";

export default function DiscountFormScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { locale, t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const muted = useCSSVariable("--color-muted-foreground") as string;
  const danger = useCSSVariable("--color-destructive") as string;
  const localeTag = getLocaleTag(locale);
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
    return (
      <View className="flex-1 items-center justify-center gap-3 py-20">
        <Spinner />
        <Typography type="body-sm" muted>
          {t("discounts.loadingOne")}
        </Typography>
      </View>
    );
  if (!isNew && discountQuery.isError)
    return (
      <RequestError error={discountQuery.error} onRetry={() => void discountQuery.refetch()} />
    );

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
      let hasFieldErrors = false;
      if (isApiError(error) && error.errors) {
        for (const [field, messages] of Object.entries(error.errors)) {
          if (
            ["name", "unit", "value", "start", "end", "products", "active"].some(
              (key) => field === key || field.startsWith(`${key}.`)
            ) &&
            messages[0]
          ) {
            setError(field as keyof DiscountFormValues, { type: "server", message: messages[0] });
            hasFieldErrors = true;
          }
        }
      }
      toast.show({
        variant: "destructive",
        label: t("discounts.saveFailed"),
        description: hasFieldErrors
          ? t("discounts.checkFields")
          : t("discounts.saveFailedDescription"),
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.show({ variant: "success", label: t("discounts.deleted") });
      router.back();
    } catch {
      toast.show({
        variant: "destructive",
        label: t("discounts.deleteFailed"),
        description: t("discounts.deleteFailedDescription"),
      });
    }
  };
  const saving = createMutation.isPending || updateMutation.isPending;
  const selectedProductIdSet = new Set(selectedProductIds);
  const selectedProducts = (productsQuery.data ?? []).filter((product) =>
    selectedProductIdSet.has(product.id)
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
        <DiscountDetailsCard control={control} errors={errors} localeTag={localeTag} t={t} />
        <DiscountProductsCard
          selectedProductIds={selectedProductIds}
          selectedProducts={selectedProducts}
          error={errors.products?.message}
          muted={muted}
          onChangeProducts={() => router.push(`/settings/discounts/${id}/products` as never)}
          t={t}
        />
        <DiscountStatusCard control={control} t={t} />
        <View className="w-full max-w-3xl flex-row gap-3 pt-2">
          <Button variant="ghost" onPress={() => router.back()} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" onPress={() => void handleSubmit(submit)()} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </View>
      </KeyboardAwareScrollView>
      <ConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("discounts.deleteTitle")}
        description={t("discounts.deleteDescription")}
        onConfirm={handleDelete}
        confirmLabel={deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
        disabled={deleteMutation.isPending}
      />
    </>
  );
}

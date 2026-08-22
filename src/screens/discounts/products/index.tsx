import AppIcon from "@/components/common/app-icon";
import LoadingState from "@/components/common/loading-state";
import ErrorState from "@/components/common/error-state";
import { useManagementProducts } from "@/hooks/db/use-products";
import { useDiscountProductDraft } from "@/stores/use-discount-product-draft-store";
import { useCategories } from "@/hooks/db/use-categories";
import { useTranslation } from "@/stores/use-locale";
import { formatRupiah } from "@/utils/format";
import { Stack, useRouter } from "expo-router";
import {
  Button,
  Card,
  Chip,
  SearchField,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function DiscountProductsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const muted = useThemeColor("muted");
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const productIds = useDiscountProductDraft((state) => state.productIds);
  const setProductIds = useDiscountProductDraft((state) => state.setProductIds);
  const productsQuery = useManagementProducts(deferredSearch || undefined);
  const { data: categories = [] } = useCategories();
  const products = (productsQuery.data ?? []).filter(
    (product) => !categoryId || product.category?.id === categoryId
  );
  const selectedProductIdSet = new Set(productIds);

  const toggleProduct = (productId: string) => {
    setProductIds(
      selectedProductIdSet.has(productId)
        ? productIds.filter((id) => id !== productId)
        : [...productIds, productId]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t("discounts.productsTitle") }} />
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-4 py-4 pb-28 md:px-6"
        >
          <View className="gap-1">
            <Typography type="body" weight="semibold">
              {productIds.length
                ? t("discounts.selectedProducts", { count: productIds.length })
                : t("discounts.noProductsSelected")}
            </Typography>
            <Typography type="body-sm" color="muted">
              {t("discounts.selectionSpecificDescription")}
            </Typography>
          </View>

          <SearchField value={search} onChange={setSearch}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={t("discounts.searchProductsPlaceholder")} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            <Chip
              variant={categoryId === null ? "primary" : "secondary"}
              onPress={() => setCategoryId(null)}
            >
              <Chip.Label>{t("common.all")}</Chip.Label>
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                variant={categoryId === category.id ? "primary" : "secondary"}
                onPress={() => setCategoryId(category.id)}
              >
                <Chip.Label>{category.name}</Chip.Label>
              </Chip>
            ))}
          </ScrollView>

          {productsQuery.isLoading ? (
            <LoadingState message={t("products.loading")} />
          ) : productsQuery.isError ? (
            <ErrorState error={productsQuery.error} onRetry={productsQuery.refetch} />
          ) : products.length === 0 ? (
            <View className="items-center gap-2 py-12">
              <AppIcon name="search-outline" size={24} color={muted} />
              <Typography weight="semibold">{t("products.empty")}</Typography>
              <Typography type="body-sm" color="muted">
                {t("products.emptyDescription")}
              </Typography>
            </View>
          ) : (
            <Card className="overflow-hidden p-0">
              {products.map((product, index) => {
                const selected = selectedProductIdSet.has(product.id);
                return (
                  <View key={product.id}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() => toggleProduct(product.id)}
                      className={`flex-row items-center gap-3 px-4 py-3 active:bg-surface-secondary ${selected ? "bg-accent-soft" : ""}`}
                    >
                      <AppIcon
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={selected ? muted : muted}
                      />
                      <View className="flex-1 gap-0.5">
                        <Typography type="body-sm" weight={selected ? "semibold" : undefined}>
                          {product.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                          {formatRupiah(product.price)} ·{" "}
                          {product.category?.name ?? t("navigation.category")}
                        </Typography>
                      </View>
                    </Pressable>
                    {index < products.length - 1 ? <Separator className="mx-4" /> : null}
                  </View>
                );
              })}
            </Card>
          )}
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-4 pb-safe pt-3 md:px-6">
          <View className="mx-auto w-full max-w-3xl flex-row items-center gap-3">
            <View className="flex-1">
              <Typography type="body-sm" weight="semibold">
                {productIds.length
                  ? t("discounts.selectedProducts", { count: productIds.length })
                  : t("discounts.noProductsSelected")}
              </Typography>
            </View>
            {productIds.length ? (
              <Button variant="ghost" size="sm" onPress={() => setProductIds([])}>
                <Button.Label>{t("common.clear")}</Button.Label>
              </Button>
            ) : null}
            <Button size="sm" isDisabled={!productIds.length} onPress={() => router.back()}>
              <Button.Label>{t("common.apply")}</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </>
  );
}

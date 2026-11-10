import LoadingListSkeleton from "@/components/common/loading-list-skeleton";
import RequestError from "@/components/common/request-error";
import {
  Button,
  Chip,
  Typography,
  Separator,
  SearchBar,
  Checkbox,
  EmptyState,
  Card,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useManagementProducts } from "@/hooks/db/use-products";
import { useDiscountProductDraft } from "@/stores/use-discount-product-draft-store";
import { useCategories } from "@/hooks/db/use-categories";
import { useTranslation } from "@/stores/use-locale";
import { formatRupiah } from "@/utils/format";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";

export default function DiscountProductsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const muted = useCSSVariable("--color-muted-foreground") as string;
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
          <View className="mx-auto w-full max-w-3xl gap-4">
            <View className="gap-1">
              <Typography type="body" weight="semibold">
                {t("discounts.productsTitle")}
              </Typography>
              <Typography type="body-sm" muted>
                {t("discounts.selectionSpecificDescription")}
              </Typography>
            </View>

            <SearchBar
              size="sm"
              value={search}
              onChangeText={setSearch}
              placeholder={t("discounts.searchProductsPlaceholder")}
              clearLabel={t("common.clear")}
              panel="never"
            />

            <View className="gap-2">
              <Typography type="body-xs" muted weight="semibold">
                {t("products.filterByCategory")}
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                <Chip
                  variant={categoryId === null ? "primary" : "default"}
                  selected={categoryId === null}
                  onPress={() => setCategoryId(null)}
                >
                  {t("common.all")}
                </Chip>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    variant={categoryId === category.id ? "primary" : "default"}
                    selected={categoryId === category.id}
                    onPress={() => setCategoryId(category.id)}
                  >
                    {category.name}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            {productsQuery.isLoading ? (
              <LoadingListSkeleton count={5} fill />
            ) : productsQuery.isError ? (
              <RequestError
                error={productsQuery.error}
                onRetry={() => void productsQuery.refetch()}
              />
            ) : products.length === 0 ? (
              <EmptyState className="py-12">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon icon={AppIcons.search} size={20} color={muted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("products.empty")}</EmptyState.Title>
                  <EmptyState.Description>{t("products.emptyDescription")}</EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              <Card className="overflow-hidden p-0">
                <Card.Content className="p-0">
                  {products.map((product, index) => {
                    const selected = selectedProductIdSet.has(product.id);
                    return (
                      <View key={product.id}>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleProduct(product.id)}
                          label={product.name}
                          description={`${formatRupiah(product.price)} · ${product.category?.name ?? t("navigation.category")}`}
                          className={
                            selected ? "min-h-16 px-4 py-3 bg-secondary" : "min-h-16 px-4 py-3"
                          }
                          labelClassName={selected ? "font-semibold" : ""}
                          descriptionClassName="tabular-nums"
                        />
                        {index < products.length - 1 ? <Separator className="mx-4" /> : null}
                      </View>
                    );
                  })}
                </Card.Content>
              </Card>
            )}
          </View>
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
                {t("common.clear")}
              </Button>
            ) : null}
            <Button size="sm" disabled={!productIds.length} onPress={() => router.back()}>
              {t("common.apply")}
            </Button>
          </View>
        </View>
      </View>
    </>
  );
}

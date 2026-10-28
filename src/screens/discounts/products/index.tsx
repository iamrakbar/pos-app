import {
  Button as PanelButton,
  Chip as PanelChip,
  Typography,
  Separator,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Skeleton as PanelListSkeleton,
  SearchBar as PanelSearchBar,
  Checkbox as PanelCheckbox,
  EmptyState,
  Card,
} from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
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

            <PanelSearchBar
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
                <PanelChip
                  variant={categoryId === null ? "primary" : "default"}
                  selected={categoryId === null}
                  onPress={() => setCategoryId(null)}
                >
                  {t("common.all")}
                </PanelChip>
                {categories.map((category) => (
                  <PanelChip
                    key={category.id}
                    variant={categoryId === category.id ? "primary" : "default"}
                    selected={categoryId === category.id}
                    onPress={() => setCategoryId(category.id)}
                  >
                    {category.name}
                  </PanelChip>
                ))}
              </ScrollView>
            </View>

            {productsQuery.isLoading ? (
              <View className="flex-1 gap-px py-2" accessibilityRole="progressbar">
                {Array.from({ length: 5 }, (_, index) => (
                  <View
                    key={`loading-row-${index}`}
                    className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6"
                  >
                    <PanelListSkeleton className="size-11 shrink-0 rounded-xl" />
                    <View className="flex-1 gap-2">
                      <PanelListSkeleton className="h-4 w-3/5 rounded-md" />
                      <PanelListSkeleton className="h-3 w-2/5 rounded-md" />
                      <PanelListSkeleton className="h-3 w-1/3 rounded-md" />
                    </View>
                    <PanelListSkeleton className="size-4 rounded-full" />
                  </View>
                ))}
              </View>
            ) : productsQuery.isError ? (
              <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
                <PanelErrorAlert variant="destructive">
                  <PanelErrorAlert.Indicator />
                  <PanelErrorAlert.Content>
                    <PanelErrorAlert.Description>
                      {getErrorMessage(productsQuery.error)}
                    </PanelErrorAlert.Description>
                  </PanelErrorAlert.Content>
                </PanelErrorAlert>
                <PanelErrorButton variant="outline" onPress={() => void productsQuery.refetch()}>
                  {t("common.retry")}
                </PanelErrorButton>
              </View>
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
                        <PanelCheckbox
                          checked={selected}
                          onCheckedChange={() => toggleProduct(product.id)}
                          label={product.name}
                          description={`${formatRupiah(product.price)} · ${product.category?.name ?? t("navigation.category")}`}
                          className={
                            selected ? "min-h-16 px-4 py-3 bg-accent" : "min-h-16 px-4 py-3"
                          }
                          labelClassName={selected ? "font-semibold" : undefined}
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
              <PanelButton variant="ghost" size="sm" onPress={() => setProductIds([])}>
                {t("common.clear")}
              </PanelButton>
            ) : null}
            <PanelButton size="sm" disabled={!productIds.length} onPress={() => router.back()}>
              {t("common.apply")}
            </PanelButton>
          </View>
        </View>
      </View>
    </>
  );
}

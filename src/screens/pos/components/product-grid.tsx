import { Alert, Button, Card, Skeleton, EmptyState } from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { useCSSVariable } from "uniwind";
import { usePOSStore } from "@/stores/use-pos-store";
import { useProducts } from "@/hooks/db/use-products";
import type { POSProduct } from "@/types/pos";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import type { JSX } from "react";
import { useState } from "react";
import { FlatList, Platform, RefreshControl, View } from "react-native";
import ProductCard from "./product-card";
import { getLocaleTag } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

const CARD_MIN_WIDTH = 180;
const GRID_HORIZONTAL_PADDING = 24;

type Props = {
  onSelectProduct: (product: POSProduct) => void;
  bottomInset?: number;
};

export default function ProductGrid({ onSelectProduct, bottomInset = 0 }: Props): JSX.Element {
  const { locale, t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;

  const searchQuery = usePOSStore((s) => s.searchQuery);
  const categoryId = usePOSStore((s) => s.categoryId);
  const productSort = usePOSStore((s) => s.productSort);

  const availableWidth = Math.max(containerWidth - GRID_HORIZONTAL_PADDING, 0);
  const numColumns = Math.max(1, Math.floor(availableWidth / CARD_MIN_WIDTH));
  const cardWidth = availableWidth / numColumns;
  const listBottomInset = Math.max(bottomInset, 16);

  const { data: allProducts, isLoading, isError, error, refetch, isRefetching } = useProducts();
  const localeTag = getLocaleTag(locale);
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase(localeTag);
  const filtered = (allProducts ?? [])
    .filter(
      (product) =>
        (!normalizedSearch ||
          product.name.toLocaleLowerCase(localeTag).includes(normalizedSearch)) &&
        (!categoryId || product.category?.id === categoryId) &&
        product.is_active &&
        (!product.stock?.enabled || (product.stock.qty ?? 0) > 0)
    )
    .sort((left, right) => {
      if (productSort === "name-asc") return left.name.localeCompare(right.name, localeTag);
      if (productSort === "name-desc") return right.name.localeCompare(left.name, localeTag);
      if (productSort === "price-asc") return left.price - right.price;
      return right.price - left.price;
    });

  const productRows = Array.from({ length: Math.ceil(filtered.length / numColumns) }, (_, index) =>
    filtered.slice(index * numColumns, (index + 1) * numColumns)
  );
  const skeletonRows = Array.from({ length: 3 }, (_, row) => row);

  return (
    <View
      className="flex-1"
      onLayout={(event) => setContainerWidth(Math.floor(event.nativeEvent.layout.width))}
    >
      {containerWidth > GRID_HORIZONTAL_PADDING ? (
        isLoading ? (
          <FlatList
            data={skeletonRows}
            keyExtractor={(row) => `product-skeleton-row-${row}`}
            renderItem={() => (
              <View className="flex-row">
                {Array.from({ length: numColumns }, (_, column) => (
                  <View
                    key={column}
                    style={{ width: cardWidth - 12 }}
                    className="m-1.5"
                    accessibilityLabel={t("pos.loadingProduct")}
                  >
                    <Card className="overflow-hidden rounded-3xl p-0">
                      <Skeleton className="aspect-square w-full rounded-t-3xl" />
                      <Card.Content className="min-h-20 justify-between gap-3 px-3.5 py-3">
                        <Skeleton className="h-4 w-3/4 rounded-md" />
                        <View className="gap-1.5">
                          <Skeleton className="h-3 w-2/5 rounded-md" />
                          <Skeleton className="h-4 w-3/5 rounded-md" />
                        </View>
                      </Card.Content>
                    </Card>
                  </View>
                ))}
              </View>
            )}
            contentContainerClassName="gap-2 px-3"
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            accessibilityLabel={t("pos.loadingProducts")}
          />
        ) : (
          <FlatList
            data={isError ? [] : productRows}
            keyExtractor={(row) => row[0].id}
            renderItem={({ item: row }) => (
              <View className="flex-row">
                {row.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={onSelectProduct}
                    width={cardWidth}
                  />
                ))}
              </View>
            )}
            contentContainerClassName="flex-grow gap-2 px-3"
            contentInset={{ bottom: listBottomInset }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
            }
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              Platform.OS === "ios" ? undefined : <View style={{ height: listBottomInset }} />
            }
            ListEmptyComponent={
              isError ? (
                <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
                  <Alert variant="destructive">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{getErrorMessage(error)}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                  <Button variant="outline" onPress={() => void refetch()}>
                    {t("common.retry")}
                  </Button>
                </View>
              ) : (
                <EmptyState className="py-20">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <AppIcon icon={AppIcons.food} size={20} color={themeColorMuted} />
                    </EmptyState.Media>
                    <EmptyState.Title>{t("pos.noProducts")}</EmptyState.Title>
                    <EmptyState.Description>
                      {t("pos.noProductsDescription")}
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              )
            }
          />
        )
      ) : null}
    </View>
  );
}

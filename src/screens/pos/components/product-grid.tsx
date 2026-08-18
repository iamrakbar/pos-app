import { usePOSStore } from "@/stores/use-pos-store";
import { useProducts } from "@/hooks/db/use-products";
import ErrorState from "@/components/common/error-state";
import type { POSProduct } from "@/types/pos";
import AppIcon from "@/components/common/app-icon";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { Card, ScrollShadow, Skeleton, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
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

function ProductCardSkeleton({ width }: { width: number }): JSX.Element {
  const { t } = useTranslation();
  return (
    <View
      style={{ width: width - 12 }}
      className="m-1.5"
      accessibilityLabel={t("pos.loadingProduct")}
    >
      <Card className="overflow-hidden p-0">
        <Skeleton className="aspect-square w-full rounded-none" />
        <Card.Body className="min-h-20 justify-between gap-3 px-3.5 py-3">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <View className="gap-1.5">
            <Skeleton className="h-3 w-2/5 rounded-md" />
            <Skeleton className="h-4 w-3/5 rounded-md" />
          </View>
        </Card.Body>
      </Card>
    </View>
  );
}

export default function ProductGrid({ onSelectProduct, bottomInset = 0 }: Props): JSX.Element {
  const { locale, t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);
  const themeColorMuted = useThemeColor("muted");

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

  const renderProduct = ({ item }: { item: POSProduct }) => (
    <ProductCard product={item} onPress={onSelectProduct} width={cardWidth} />
  );
  const skeletonItems = Array.from({ length: numColumns * 3 }, (_, index) => index);

  return (
    <ScrollShadow
      className="flex-1"
      LinearGradientComponent={LinearGradient}
      onLayout={(event) => setContainerWidth(Math.floor(event.nativeEvent.layout.width))}
    >
      <View className="flex-1">
        {containerWidth > GRID_HORIZONTAL_PADDING ? (
          isLoading ? (
            <FlatList
              data={skeletonItems}
              key={`product-grid-skeleton-${numColumns}`}
              numColumns={numColumns}
              keyExtractor={(item) => `product-skeleton-${item}`}
              renderItem={() => <ProductCardSkeleton width={cardWidth} />}
              contentContainerClassName="gap-2 px-3"
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              accessibilityLabel={t("pos.loadingProducts")}
            />
          ) : (
            <FlatList
              data={isError ? [] : filtered}
              key={`product-grid-${numColumns}`}
              numColumns={numColumns}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              contentContainerClassName="flex-grow gap-2 px-3"
              contentInset={{ bottom: listBottomInset }}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                Platform.OS === "ios" ? null : <View style={{ height: listBottomInset }} />
              }
              ListEmptyComponent={
                isError ? (
                  <ErrorState error={error} onRetry={refetch} />
                ) : (
                  <EmptyState className="py-20">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon name="fast-food-outline" size={20} color={themeColorMuted} />
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
    </ScrollShadow>
  );
}

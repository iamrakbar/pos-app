import { usePOSStore } from "@/stores/usePOSStore";
import { useProducts } from "@/hooks/db/useProducts";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { useCallback } from "react";
import { FlatList, RefreshControl, useWindowDimensions } from "react-native";
import ProductCard from "./ProductCard";

const CARD_MIN_WIDTH = 180;
const GRID_HORIZONTAL_PADDING = 24;

type Props = {
  onSelectProduct: (product: POSProduct) => void;
  cartPanelWidth: number;
};

export default function ProductGrid({ onSelectProduct, cartPanelWidth }: Props): JSX.Element {
  const { width } = useWindowDimensions();

  const searchQuery = usePOSStore((s) => s.searchQuery);
  const categoryId = usePOSStore((s) => s.categoryId);
  const productSort = usePOSStore((s) => s.productSort);

  const availableWidth = width - cartPanelWidth - GRID_HORIZONTAL_PADDING;
  const numColumns = Math.max(2, Math.floor(availableWidth / CARD_MIN_WIDTH));
  const cardWidth = Math.floor(availableWidth / numColumns);

  const {
    data: allProducts,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useProducts(searchQuery || undefined);
  const filtered = (allProducts ?? [])
    .filter(
      (product) =>
        (!categoryId || product.category_id === categoryId) &&
        product.is_active &&
        (!product.stock_enabled || (product.stock_qty ?? 0) > 0)
    )
    .sort((left, right) => {
      if (productSort === "name-asc") return left.name.localeCompare(right.name, "id");
      if (productSort === "name-desc") return right.name.localeCompare(left.name, "id");
      if (productSort === "price-asc") return left.price - right.price;
      return right.price - left.price;
    });

  const renderProduct = useCallback(
    ({ item }: { item: POSProduct }) => (
      <ProductCard product={item} onPress={onSelectProduct} width={cardWidth} />
    ),
    [cardWidth, onSelectProduct]
  );

  if (isLoading) return <LoadingState message="Loading products…" />;

  return (
    <FlatList
      data={isError ? [] : filtered}
      key={numColumns}
      numColumns={numColumns}
      keyExtractor={(item) => item.id}
      renderItem={renderProduct}
      contentContainerClassName="flex-grow gap-2 px-3 py-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <EmptyState icon="fast-food-outline" message="No products found" />
        )
      }
    />
  );
}

import { usePOSStore } from "@/stores/usePOSStore";
import { useProducts } from "@/hooks/db/useProducts";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import type { POSProduct } from "@/types/pos";
import type { JSX } from "react";
import { FlatList, RefreshControl, useWindowDimensions } from "react-native";
import ProductCard from "./ProductCard";

const CART_PANEL_WIDTH = 400;
const CARD_MIN_WIDTH = 180;

type Props = {
  onSelectProduct: (product: POSProduct) => void;
};

export default function ProductGrid({ onSelectProduct }: Props): JSX.Element {
  const { width } = useWindowDimensions();

  const searchQuery = usePOSStore((s) => s.searchQuery);
  const categoryId = usePOSStore((s) => s.categoryId);

  const availableWidth = width - CART_PANEL_WIDTH;
  const numColumns = Math.max(2, Math.floor(availableWidth / CARD_MIN_WIDTH));
  const cardWidth = Math.floor(availableWidth / numColumns);

  const {
    data: allProducts,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useProducts(searchQuery || undefined, categoryId || undefined);
  const filtered = (allProducts ?? []).filter(
    (p) => p.is_active && (!p.stock_enabled || (p.stock_qty ?? 0) > 0)
  );

  if (isLoading) return <LoadingState message="Loading products…" />;

  return (
    <FlatList
      data={isError ? [] : filtered}
      key={numColumns}
      numColumns={numColumns}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={onSelectProduct} width={cardWidth} />
      )}
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

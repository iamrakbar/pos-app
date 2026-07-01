import { usePOSStore } from '@/stores/usePOSStore';
import { useProducts } from '@/hooks/db/useProducts';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import type { POSProduct } from '@/types/pos';
import type { JSX } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import ProductCard from './ProductCard';

const CART_PANEL_WIDTH = 400;
const CARD_MIN_WIDTH = 400;

type Props = {
    onSelectProduct: (product: POSProduct) => void;
};

export default function ProductGrid({ onSelectProduct }: Props): JSX.Element {
    const { width } = useWindowDimensions();

    const searchQuery = usePOSStore((s) => s.searchQuery);
    const categoryId = usePOSStore((s) => s.categoryId);

    const availableWidth = width - CART_PANEL_WIDTH;
    const numColumns = Math.max(4, Math.floor(availableWidth / CARD_MIN_WIDTH)) || CARD_MIN_WIDTH;
    const cardWidth = Math.floor(availableWidth / numColumns);

    const { data: allProducts, isLoading, isError, error, refetch } = useProducts(
        searchQuery || undefined,
        categoryId || undefined,
    );
    const filtered = (allProducts ?? []).filter((p) => p.is_active);

    if (isLoading) return <LoadingState message="Loading products…" />;
    if (isError) return <ErrorState error={error} onRetry={refetch} />;
    if (filtered.length === 0) return <EmptyState icon="fast-food-outline" message="No products found" />;

    return (
        <FlatList
            data={filtered}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ProductCard product={item} onPress={onSelectProduct} width={cardWidth} />
            )}
            contentContainerClassName='gap-1 px-2 py-3'
            showsVerticalScrollIndicator={false}
        />
    );
}

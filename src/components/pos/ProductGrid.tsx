import { MOCK_PRODUCTS } from '@/data/pos-mock';
import { usePOSStore } from '@/stores/usePOSStore';
import type { POSProduct } from '@/types/pos';
import type { JSX } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import ProductCard from './ProductCard';

const CART_PANEL_WIDTH = 320;
const CARD_MIN_WIDTH = 140;

type Props = {
    onSelectProduct: (product: POSProduct) => void;
};

export default function ProductGrid({ onSelectProduct }: Props): JSX.Element {
    const { width } = useWindowDimensions();

    const searchQuery = usePOSStore((s) => s.searchQuery);
    const categoryId = usePOSStore((s) => s.categoryId);

    const availableWidth = width - CART_PANEL_WIDTH;
    const numColumns = Math.max(3, Math.floor(availableWidth / CARD_MIN_WIDTH)) || CARD_MIN_WIDTH;

    const cardWidth = Math.floor(availableWidth / numColumns);

    const filtered = MOCK_PRODUCTS.filter((p) => {
        const matchesSearch =
            searchQuery.length === 0 ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryId || p.category_id === categoryId;
        return matchesSearch && matchesCategory && p.is_active;
    });

    return (
        <FlatList
            data={filtered}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ProductCard product={item} onPress={onSelectProduct} width={cardWidth} />
            )}
            contentContainerClassName='px-2 pb-4'
            showsVerticalScrollIndicator={false}
        />
    );
}

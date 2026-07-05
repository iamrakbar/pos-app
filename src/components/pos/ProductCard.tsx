import type { POSProduct } from '@/types/pos';
import { formatRupiah } from '@/utils/format';
import { Card, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    product: POSProduct;
    onPress: (product: POSProduct) => void;
    width: number;
};

export default function ProductCard({ product, onPress, width }: Props): JSX.Element {
    const isDiscounted = product.original_price !== null;
    const effectivePrice = product.price;

    return (
        <Pressable
            onPress={() => onPress(product)}
            style={{
                maxWidth: width - 12,
            }}
            className="flex-1 m-1.5 active:opacity-85"
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name}`}
        >
            <Card className="flex-1 overflow-hidden p-0">
                <View className="aspect-square bg-surface-secondary items-center justify-center">
                    {product.image_url ? (
                        <Image
                            source={{ uri: product.image_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="fast-food-outline" size={30} color="hsl(var(--muted))" />
                    )}
                </View>
                <Card.Body className="min-h-[82px] justify-between px-3.5 py-3">
                    <Typography weight="medium" truncate>
                        {product.name}
                    </Typography>
                    <View className="gap-0.5">
                        {isDiscounted && (
                            <Typography type="body-xs" color="muted" className="line-through">
                                {formatRupiah(product.original_price!)}
                            </Typography>
                        )}
                        <Typography
                            type="body-sm"
                            weight="semibold"
                            className={isDiscounted ? 'text-accent tabular-nums' : 'tabular-nums'}
                        >
                            {formatRupiah(effectivePrice)}
                        </Typography>
                    </View>
                </Card.Body>
            </Card>
        </Pressable>
    );
}

import type { POSProduct } from '@/types/pos';
import { formatRupiah } from '@/utils/format';
import { Typography } from 'heroui-native';
import type { JSX } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    product: POSProduct;
    onPress: (product: POSProduct) => void;
    width: number
};

export default function ProductCard({ product, onPress, width }: Props): JSX.Element {
    const isDiscounted = product.original_price !== null;
    const effectivePrice = product.price;

    return (
        <Pressable
            onPress={() => onPress(product)}
            style={{
                maxWidth: width - 16
            }}
            className="flex-1 m-2 rounded-xl overflow-hidden bg-background border border-border active:opacity-70"
        >
            <View className="aspect-square bg-muted items-center justify-center">
                {product.image_url ? (
                    <Image
                        source={{ uri: product.image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons name="fast-food-outline" size={32} color="#9ca3af" />
                )}
            </View>
            <View className="p-2 gap-0.5">
                <Typography className="text-xs font-medium text-foreground" numberOfLines={2}>
                    {product.name}
                </Typography>
                {isDiscounted ? (
                    <>
                        <Typography className="text-xs text-muted-foreground line-through">
                            {formatRupiah(product.original_price!)}
                        </Typography>
                        <Typography className="text-xs font-semibold text-accent">
                            {formatRupiah(effectivePrice)}
                        </Typography>
                    </>
                ) : (
                    <Typography className="text-xs font-medium text-muted-foreground">
                        {formatRupiah(effectivePrice)}
                    </Typography>
                )}
            </View>
        </Pressable>
    );
}

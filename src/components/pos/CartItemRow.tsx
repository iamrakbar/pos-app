import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import type { CartItem } from '@/types/cart';
import { formatRupiah } from '@/utils/format';
import { MOCK_PRODUCTS } from '@/data/pos-mock';
import { Button, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    item: CartItem;
};

export default function CartItemRow({ item }: Props): JSX.Element {
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQty = useCartStore((s) => s.updateQty);
    const openAddonModal = usePOSStore((s) => s.openAddonModal);

    const product = MOCK_PRODUCTS.find((p) => p.id === item.product_id);

    const modifierSummary = item.add_ons
        .flatMap((ao) => ao.options.map((o) => o.name))
        .join('. ');

    const addOnTotal = item.add_ons
        .flatMap((ao) => ao.options)
        .reduce((sum, o) => sum + o.price, 0);

    const handleEdit = () => {
        if (product) {
            openAddonModal(product, item.id);
        }
    };

    const handleDecrement = () => {
        if (item.qty <= 1) {
            removeItem(item.id);
        } else {
            updateQty(item.id, item.qty - 1);
        }
    };

    return (
        <View className="flex-row gap-3 py-3 border-b border-border">
            <View className="w-16 h-16 rounded-lg overflow-hidden bg-muted items-center justify-center flex-shrink-0">
                {product?.image_url ? (
                    <Image
                        source={{ uri: product.image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons name="fast-food-outline" size={20} color="#9ca3af" />
                )}
            </View>

            <View className="flex-1 gap-1">
                <View className="flex-row items-start justify-between gap-2">
                    <Typography className="text-sm font-semibold text-foreground flex-1" numberOfLines={2}>
                        {item.name}
                    </Typography>
                    <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        onPress={() => removeItem(item.id)}
                        className="w-7 h-7"
                    >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    </Button>
                </View>

                <Typography className="text-sm font-medium text-foreground">
                    {formatRupiah(item.price)}
                </Typography>

                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            isIconOnly
                            onPress={handleDecrement}
                            className="w-7 h-7 rounded-full"
                        >
                            <Ionicons name="remove" size={14} color="#6b7280" />
                        </Button>
                        <Typography className="text-sm font-semibold w-5 text-center text-foreground">
                            {item.qty}
                        </Typography>
                        <Button
                            variant="outline"
                            size="sm"
                            isIconOnly
                            onPress={() => updateQty(item.id, item.qty + 1)}
                            className="w-7 h-7 rounded-full"
                        >
                            <Ionicons name="add" size={14} color="#6b7280" />
                        </Button>
                    </View>
                </View>

                {(modifierSummary || addOnTotal > 0) && (
                    <Typography className="text-xs text-muted-foreground" numberOfLines={2}>
                        {modifierSummary}
                        {addOnTotal > 0 ? ` (+${formatRupiah(addOnTotal)})` : ''}
                    </Typography>
                )}

                {product && product.add_ons.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onPress={handleEdit}
                        className="self-start h-6 px-0"
                    >
                        <Ionicons name="pencil-outline" size={12} color="#6b7280" />
                    </Button>
                )}
            </View>
        </View>
    );
}

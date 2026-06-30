import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import type { CartItem } from '@/types/cart';
import { formatRupiah } from '@/utils/format';
import { MOCK_PRODUCTS } from '@/data/pos-mock';
import { Button, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { Image, Pressable, View } from 'react-native';
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
        <View className="gap-3 py-3 border-b border-border">
            <Pressable className="flex-1 gap-1 active:opacity-70" onPress={handleEdit}>
                <View className="flex-row justify-between">
                    <Typography className="" numberOfLines={2}>
                        {item.name}
                    </Typography>

                    <Typography className="text-sm font-semibold">
                        {formatRupiah(item.price)}
                    </Typography>
                </View>

                {(modifierSummary || addOnTotal > 0) && (
                    <Typography.Paragraph className="text-sm text-muted" numberOfLines={2}>
                        {modifierSummary}
                        {addOnTotal > 0 ? ` (+${formatRupiah(addOnTotal)})` : ''}
                    </Typography.Paragraph>
                )}
            </Pressable>

            <View className="flex-row items-center gap-4">
                <View className="flex-1 flex-row items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        onPress={() => removeItem(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </Button>
                </View>
                <View className="flex-row items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        isIconOnly
                        onPress={handleDecrement}
                    >
                        <Ionicons name="remove" size={18} color="#6b7280" />
                    </Button>
                    <View className="w-8">
                        <Typography className="text-sm font-semibold text-center text-foreground">
                            {item.qty}
                        </Typography>
                    </View>
                    <Button
                        variant="outline"
                        size="sm"
                        isIconOnly
                        onPress={() => updateQty(item.id, item.qty + 1)}
                    >
                        <Ionicons name="add" size={18} color="#6b7280" />
                    </Button>
                </View>
            </View>
        </View>
    );
}

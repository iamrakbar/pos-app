import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import type { CartItem } from '@/types/cart';
import { formatRupiah } from '@/utils/format';
import { MOCK_PRODUCTS } from '@/data/pos-mock';
import { Button, Typography, useThemeColor } from 'heroui-native';
import type { JSX } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    item: CartItem;
};

export default function CartItemRow({ item }: Props): JSX.Element {
    const [themeColorForeground, themeColorDangerSoftForeground] = useThemeColor([
        'foreground',
        'danger-soft-foreground',
    ]);
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
                <View className="flex-row justify-between gap-3">
                    <Typography weight="medium" numberOfLines={2} className="flex-1">
                        {item.name}
                    </Typography>

                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                        {formatRupiah(item.price)}
                    </Typography>
                </View>

                {(modifierSummary || addOnTotal > 0) && (
                    <Typography.Paragraph type="body-sm" color="muted" numberOfLines={2}>
                        {modifierSummary}
                        {addOnTotal > 0 ? ` (+${formatRupiah(addOnTotal)})` : ''}
                    </Typography.Paragraph>
                )}
            </Pressable>

            <View className="flex-row items-center justify-between gap-4">
                <View>
                    <Button
                        variant="danger-soft"
                        size="sm"
                        isIconOnly
                        onPress={() => removeItem(item.id)}
                        accessibilityLabel={`Remove ${item.name}`}
                    >
                        <Ionicons name="trash-outline" size={17} color={themeColorDangerSoftForeground} />
                    </Button>
                </View>
                <View className="flex-row items-center gap-2 rounded-full bg-surface-secondary p-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        onPress={handleDecrement}
                        accessibilityLabel={`Decrease ${item.name} quantity`}
                    >
                        <Ionicons name="remove" size={17} color={themeColorForeground} />
                    </Button>
                    <View className="w-8">
                        <Typography type="body-sm" weight="semibold" align="center" className="tabular-nums">
                            {item.qty}
                        </Typography>
                    </View>
                    <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        onPress={() => updateQty(item.id, item.qty + 1)}
                        accessibilityLabel={`Increase ${item.name} quantity`}
                    >
                        <Ionicons name="add" size={17} color={themeColorForeground} />
                    </Button>
                </View>
            </View>
        </View>
    );
}

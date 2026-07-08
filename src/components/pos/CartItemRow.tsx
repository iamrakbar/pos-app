import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import type { CartItem } from "@/types/cart";
import type { POSProduct } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { Button, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    item: CartItem;
    product?: POSProduct;
};

export default function CartItemRow({ item, product }: Props): JSX.Element {
    const [themeColorForeground, themeColorDangerSoftForeground] = useThemeColor([
        "foreground",
        "danger-soft-foreground",
    ]);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQty = useCartStore((s) => s.updateQty);
    const openAddonModal = usePOSStore((s) => s.openAddonModal);

    const addOnGroups = item.add_ons.map((addOn) => {
        const unitTotal = addOn.options.reduce((sum, option) => sum + option.price, 0);
        return {
            ...addOn,
            unitTotal,
            subtotal: unitTotal * item.qty,
        };
    });

    const addOnUnitTotal = item.add_ons
        .flatMap((ao) => ao.options)
        .reduce((sum, o) => sum + o.price, 0);
    const unitTotal = item.price + addOnUnitTotal;
    const productSubtotal = item.price * item.qty;
    const addOnSubtotal = addOnUnitTotal * item.qty;
    const itemSubtotal = unitTotal * item.qty;

    const handleEdit = () => {
        if (product && product.add_ons.length > 0) {
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
            <Pressable
                className="flex-1 gap-3 active:opacity-70"
                disabled={!product || product.add_ons.length === 0}
                onPress={handleEdit}
            >
                <View className="flex-row justify-between gap-3">
                    <Typography weight="medium" numberOfLines={2} className="flex-1">
                        {item.name}
                    </Typography>

                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                        {formatRupiah(itemSubtotal)}
                    </Typography>
                </View>

                <View className="gap-1.5">
                    <View className="flex-row justify-between gap-3">
                        <Typography type="body-sm" color="muted">
                            Product
                        </Typography>
                        <Typography type="body-sm" color="muted" className="tabular-nums">
                            {formatRupiah(item.price)}
                        </Typography>
                    </View>
                    <View className="flex-row justify-between gap-3">
                        <Typography type="body-sm" color="muted">
                            Product subtotal
                        </Typography>
                        <Typography type="body-sm" color="muted" className="tabular-nums">
                            {item.qty} x {formatRupiah(item.price)} = {formatRupiah(productSubtotal)}
                        </Typography>
                    </View>
                </View>

                {addOnGroups.length > 0 && (
                    <View className="gap-2 rounded-lg bg-surface-secondary px-3 py-2.5">
                        <View className="flex-row justify-between gap-3">
                            <Typography type="body-sm" weight="medium">
                                Add-ons
                            </Typography>
                            <Typography type="body-sm" weight="medium" className="tabular-nums">
                                {formatRupiah(addOnSubtotal)}
                            </Typography>
                        </View>
                        {addOnGroups.map((addOn) => (
                            <View key={addOn.id} className="gap-1.5">
                                <View className="flex-row items-start justify-between gap-3">
                                    <View className="flex-1">
                                        <Typography type="body-sm" weight="medium" numberOfLines={1}>
                                            {addOn.name}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" numberOfLines={1}>
                                            {item.qty} x {formatRupiah(addOn.unitTotal)}
                                        </Typography>
                                    </View>
                                    <Typography type="body-sm" color="muted" className="tabular-nums">
                                        {formatRupiah(addOn.subtotal)}
                                    </Typography>
                                </View>
                                <View className="gap-1 pl-3">
                                    {addOn.options.map((option) => (
                                        <View
                                            key={`${addOn.id}-${option.id}`}
                                            className="flex-row items-start justify-between gap-3"
                                        >
                                            <Typography
                                                type="body-xs"
                                                color="muted"
                                                numberOfLines={1}
                                                className="flex-1"
                                            >
                                                {option.name}
                                            </Typography>
                                            <Typography type="body-xs" color="muted" className="tabular-nums">
                                                {formatRupiah(option.price)}
                                            </Typography>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View className="gap-1.5">
                    {addOnUnitTotal > 0 && (
                        <View className="flex-row justify-between gap-3">
                            <Typography type="body-sm" color="muted">
                                Unit total
                            </Typography>
                            <Typography type="body-sm" color="muted" className="tabular-nums">
                                {formatRupiah(item.price)} + {formatRupiah(addOnUnitTotal)} ={" "}
                                {formatRupiah(unitTotal)}
                            </Typography>
                        </View>
                    )}
                    <View className="flex-row justify-between gap-3">
                        <Typography type="body-sm" weight="semibold">
                            Item subtotal
                        </Typography>
                        <Typography type="body-sm" weight="semibold" className="tabular-nums">
                            {item.qty} x {formatRupiah(unitTotal)} = {formatRupiah(itemSubtotal)}
                        </Typography>
                    </View>
                </View>
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

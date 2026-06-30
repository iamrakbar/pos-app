import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { useCreateOrder } from '@/hooks/db/useCreateOrder';
import { formatRupiah } from '@/utils/format';
import { Button, Dialog, Separator, Surface, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

function formatDateTime(date: Date): string {
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PaymentSuccessModal(): JSX.Element {
    const modal = usePOSStore((s) => s.modal);
    const paymentSession = usePOSStore((s) => s.paymentSession);
    const closeModal = usePOSStore((s) => s.closeModal);
    const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);

    const products = useCartStore((s) => s.products);
    const totalQty = useCartStore((s) => s.totalQty);
    const clearCart = useCartStore((s) => s.clearCart);

    const { height: windowHeight } = useWindowDimensions();
    const createOrder = useCreateOrder();

    const isOpen = modal === 'payment-success';

    React.useEffect(() => {
        if (isOpen) {
            createOrder.mutate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleNewOrder = () => {
        closeModal();
        clearCart();
        resetCheckoutForm();
    };

    const handlePrintReceipt = () => {
        // No-op — will wire to printer later
    };

    if (!paymentSession) return <></>;

    const dialogMaxHeight = windowHeight * 0.88;
    const scrollMaxHeight = dialogMaxHeight - 220;
    const paidAt = new Date();

    return (
        <Dialog isOpen={isOpen} onOpenChange={(open) => !open && handleNewOrder()}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    isSwipeable={false}
                    className="w-full max-w-md self-center bg-background p-0 overflow-hidden"
                    style={{ maxHeight: dialogMaxHeight }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between gap-4 bg-surface p-4">
                        <View className="gap-0.5">
                            <Dialog.Title>Payment Success</Dialog.Title>
                            <Typography className="text-sm text-muted-foreground">
                                Transaction completed
                            </Typography>
                        </View>
                        <Dialog.Close />
                    </View>

                    <Separator />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: scrollMaxHeight }}
                        contentContainerClassName="p-4 gap-4 bg-background"
                    >
                        {/* Success indicator */}
                        <View className="items-center gap-3 py-4">
                            <View className="w-20 h-20 rounded-full bg-green-500/10 items-center justify-center">
                                <View className="w-14 h-14 rounded-full bg-green-500 items-center justify-center">
                                    <Ionicons name="checkmark" size={32} color="white" />
                                </View>
                            </View>
                            <View className="items-center gap-1">
                                <Typography className="text-2xl font-bold text-green-500">
                                    {formatRupiah(paymentSession.amount)}
                                </Typography>
                                <Typography className="text-xs text-muted-foreground font-mono">
                                    {paymentSession.transaction_id}
                                </Typography>
                            </View>
                        </View>

                        {/* Transaction details */}
                        <Surface className="w-full overflow-hidden">
                            <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                <Typography className="text-sm text-muted-foreground">Payment method</Typography>
                                <Typography className="text-sm font-semibold text-foreground">
                                    {paymentSession.payment_type}
                                </Typography>
                            </View>
                            <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                <Typography className="text-sm text-muted-foreground">Date & time</Typography>
                                <Typography className="text-sm font-semibold text-foreground">
                                    {formatDateTime(paidAt)}
                                </Typography>
                            </View>
                            <View className="flex-row justify-between px-4 py-3">
                                <Typography className="text-sm text-muted-foreground">Items</Typography>
                                <Typography className="text-sm font-semibold text-foreground">
                                    {totalQty()} {totalQty() === 1 ? 'item' : 'items'}
                                </Typography>
                            </View>
                        </Surface>

                        {/* Order items */}
                        {products.length > 0 && (
                            <View className="gap-2">
                                <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Order summary
                                </Typography>
                                <Surface className="w-full overflow-hidden">
                                    {products.map((item, index) => (
                                        <View
                                            key={item.id}
                                            className={`flex-row items-start justify-between px-4 py-3 gap-4 ${index < products.length - 1 ? 'border-b border-border' : ''}`}
                                        >
                                            <View className="flex-1 gap-0.5">
                                                <Typography className="text-sm text-foreground" numberOfLines={1}>
                                                    {item.name}
                                                </Typography>
                                                {item.add_ons.length > 0 && (
                                                    <Typography className="text-xs text-muted-foreground" numberOfLines={1}>
                                                        {item.add_ons.flatMap((ao) => ao.options.map((o) => o.name)).join(', ')}
                                                    </Typography>
                                                )}
                                                {item.notes && (
                                                    <Typography className="text-xs text-muted-foreground italic" numberOfLines={1}>
                                                        {item.notes}
                                                    </Typography>
                                                )}
                                            </View>
                                            <View className="items-end gap-0.5">
                                                <Typography className="text-sm font-semibold text-foreground">
                                                    {formatRupiah(item.price * item.qty)}
                                                </Typography>
                                                <Typography className="text-xs text-muted-foreground">
                                                    {item.qty} × {formatRupiah(item.price)}
                                                </Typography>
                                            </View>
                                        </View>
                                    ))}
                                </Surface>
                            </View>
                        )}
                    </ScrollView>

                    <Separator />

                    {/* Actions */}
                    <View className="flex-row gap-3 bg-surface p-4">
                        <Button variant="outline" className="flex-1" onPress={handlePrintReceipt}>
                            <Ionicons name="print-outline" size={16} color="hsl(var(--foreground))" />
                            <Button.Label className="ml-2">Print Receipt</Button.Label>
                        </Button>
                        <Button className="flex-1 bg-green-500 border-green-500" onPress={handleNewOrder}>
                            <Ionicons name="add-circle-outline" size={16} color="white" />
                            <Button.Label className="ml-2">New Order</Button.Label>
                        </Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

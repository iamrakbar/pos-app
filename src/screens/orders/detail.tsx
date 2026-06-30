import { useOrder, useUpdateOrderStatus } from '@/hooks/db/useOrders';
import type { OrderStatus } from '@/data/orders-mock';
import { formatRupiah } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, Separator, Surface, Typography } from 'heroui-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ScrollView, Pressable } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; color: 'success' | 'danger' | 'default' | 'warning' }
> = {
    completed: { label: 'Completed', color: 'success' },
    pending:   { label: 'Pending',   color: 'warning' },
    cancelled: { label: 'Cancelled', color: 'danger'  },
};

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: order } = useOrder(id);
    const updateStatus = useUpdateOrderStatus();

    if (!order) {
        return (
            <View className="flex-1 items-center justify-center bg-background gap-3">
                <Ionicons name="receipt-outline" size={40} color="#9ca3af" />
                <Typography className="text-sm text-muted-foreground">Order not found</Typography>
                <Pressable onPress={() => router.back()} className="active:opacity-70">
                    <Typography className="text-sm text-primary">← Back</Typography>
                </Pressable>
            </View>
        );
    }

    const status = STATUS_CONFIG[order.status];
    const feeAmount = order.total - order.subtotal;
    const feeRate = order.payment_method === 'QRIS' ? '0.7%'
        : order.payment_method === 'GoPay' || order.payment_method === 'OVO' ? '1.5%'
        : null;

    return (
        <View className="flex-1 bg-background">
            <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4 pb-10">
                {/* Back row */}
                <Pressable
                    onPress={() => router.back()}
                    className="flex-row items-center gap-1 self-start active:opacity-70"
                >
                    <Ionicons name="chevron-back" size={18} color="hsl(var(--primary))" />
                    <Typography className="text-sm text-primary">Orders</Typography>
                </Pressable>

                {/* ── Header ── */}
                <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                        <Typography className="text-xl font-bold text-foreground font-mono">
                            #{order.id}
                        </Typography>
                        <Chip color={status.color} size="sm" variant="soft">
                            <Chip.Label>{status.label}</Chip.Label>
                        </Chip>
                    </View>
                    <Typography className="text-xs text-muted-foreground font-mono">
                        {order.transaction_id}
                    </Typography>
                    <Typography className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                    </Typography>
                </View>

                {/* ── Order info ── */}
                <Surface className="w-full overflow-hidden">
                    <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                        <Ionicons
                            name={order.order_type === 'dine-in' ? 'restaurant-outline' : 'bag-outline'}
                            size={16}
                            color="#9ca3af"
                        />
                        <View className="flex-1">
                            <Typography className="text-xs text-muted-foreground">Order type</Typography>
                            <Typography className="text-sm font-semibold text-foreground capitalize">
                                {order.order_type === 'dine-in' ? 'Dine-in' : 'Takeaway'}
                            </Typography>
                        </View>
                    </View>

                    {order.table && (
                        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                            <Ionicons name="grid-outline" size={16} color="#9ca3af" />
                            <View className="flex-1">
                                <Typography className="text-xs text-muted-foreground">Table</Typography>
                                <Typography className="text-sm font-semibold text-foreground">{order.table}</Typography>
                            </View>
                        </View>
                    )}

                    <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                        <Ionicons name="card-outline" size={16} color="#9ca3af" />
                        <View className="flex-1">
                            <Typography className="text-xs text-muted-foreground">Payment</Typography>
                            <Typography className="text-sm font-semibold text-foreground">{order.payment_method}</Typography>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3 px-4 py-3">
                        <Ionicons name="person-outline" size={16} color="#9ca3af" />
                        <View className="flex-1">
                            <Typography className="text-xs text-muted-foreground">Customer</Typography>
                            <Typography className="text-sm font-semibold text-foreground">
                                {order.customer_name ?? 'Walk-in'}
                            </Typography>
                        </View>
                    </View>
                </Surface>

                {/* ── Order items ── */}
                <View className="gap-2">
                    <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Order Items
                    </Typography>
                    <Surface className="w-full overflow-hidden">
                        {order.items.map((item, index) => (
                            <View
                                key={index}
                                className={`flex-row items-center justify-between px-4 py-3 ${index < order.items.length - 1 ? 'border-b border-border' : ''}`}
                            >
                                <View className="flex-1 gap-0.5">
                                    <Typography className="text-sm font-medium text-foreground" numberOfLines={1}>
                                        {item.name}
                                    </Typography>
                                    <Typography className="text-xs text-muted-foreground">
                                        {item.qty} × {formatRupiah(item.price)}
                                    </Typography>
                                </View>
                                <Typography className="text-sm font-semibold text-foreground">
                                    {formatRupiah(item.price * item.qty)}
                                </Typography>
                            </View>
                        ))}
                    </Surface>
                </View>

                {/* ── Pricing summary ── */}
                <View className="gap-2">
                    <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Summary
                    </Typography>
                    <Surface className="w-full overflow-hidden">
                        <View className="flex-row justify-between px-4 py-3 border-b border-border">
                            <Typography className="text-sm text-muted-foreground">Subtotal</Typography>
                            <Typography className="text-sm text-foreground">{formatRupiah(order.subtotal)}</Typography>
                        </View>
                        {feeAmount > 0 && (
                            <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                <Typography className="text-sm text-muted-foreground">
                                    Payment fee{feeRate ? ` (${feeRate})` : ''}
                                </Typography>
                                <Typography className="text-sm text-foreground">{formatRupiah(feeAmount)}</Typography>
                            </View>
                        )}
                        <View className="flex-row justify-between px-4 py-3">
                            <Typography className="text-sm font-bold text-foreground">Total</Typography>
                            <Typography className="text-sm font-bold text-foreground">{formatRupiah(order.total)}</Typography>
                        </View>
                    </Surface>
                </View>

                {/* ── Notes ── */}
                {order.notes && (
                    <View className="gap-2">
                        <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Notes
                        </Typography>
                        <Surface className="w-full px-4 py-3">
                            <Typography className="text-sm text-foreground italic">{order.notes}</Typography>
                        </Surface>
                    </View>
                )}

                {/* ── Status update ── */}
                {order.status === 'pending' && (
                    <View className="gap-2">
                        <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Update Status
                        </Typography>
                        <View className="flex-row gap-3">
                            <Button
                                className="flex-1 bg-green-500 border-green-500"
                                onPress={() => updateStatus.mutate({ id: order.id, status: 'completed' })}
                                isDisabled={updateStatus.isPending}
                            >
                                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                                <Button.Label className="ml-1.5">Mark Completed</Button.Label>
                            </Button>
                            <Button
                                variant="outline"
                                className="border-danger"
                                onPress={() => updateStatus.mutate({ id: order.id, status: 'cancelled' })}
                                isDisabled={updateStatus.isPending}
                            >
                                <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                                <Button.Label className="ml-1.5 text-danger">Cancel</Button.Label>
                            </Button>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ── Footer ── */}
            <View className="flex-row gap-3 bg-surface p-4 border-t border-border">
                <Button variant="outline" className="flex-1" onPress={() => {}}>
                    <Ionicons name="print-outline" size={16} color="hsl(var(--foreground))" />
                    <Button.Label className="ml-1.5">Print Receipt</Button.Label>
                </Button>
                <Button variant="outline" onPress={() => router.back()}>
                    Close
                </Button>
            </View>
        </View>
    );
}

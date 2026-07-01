import { useOrder } from '@/hooks/db/useOrders';
import { usePaymentStatus } from '@/hooks/db/usePaymentStatus';
import {
    extractCustomerName,
    extractNumber,
    extractOrderItems,
    extractPaymentName,
    extractStatusColor,
    extractStatusLabel,
    extractTableName,
} from '@/api/mappers/order';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { formatRupiah } from '@/utils/format';
import { getErrorMessage } from '@/api/ApiError';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, Surface, Typography } from 'heroui-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View, ScrollView, Pressable } from 'react-native';

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

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: order, isLoading, isError, error, refetch } = useOrder(id);
    const paymentStatus = usePaymentStatus(id);

    if (isLoading) return <LoadingState message="Loading order…" />;
    if (isError) return <ErrorState error={error} onRetry={refetch} />;

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

    const statusLabel = extractStatusLabel(order.order_status);
    const statusColor = extractStatusColor(order.order_status);
    const paymentStatusLabel = extractStatusLabel(order.payment_status);
    const paymentStatusColor = extractStatusColor(order.payment_status);
    const customerName = extractCustomerName(order.customer);
    const paymentName = extractPaymentName(order.payment);
    const tableName = extractTableName(order.orderable);
    const items = extractOrderItems(order.products);
    const feeAmount = extractNumber(order.payment_fee);

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
                            {order.code}
                        </Typography>
                        <Chip color={statusColor} size="sm" variant="soft">
                            <Chip.Label>{statusLabel}</Chip.Label>
                        </Chip>
                    </View>
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

                    {tableName && (
                        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                            <Ionicons name="grid-outline" size={16} color="#9ca3af" />
                            <View className="flex-1">
                                <Typography className="text-xs text-muted-foreground">Table</Typography>
                                <Typography className="text-sm font-semibold text-foreground">{tableName}</Typography>
                            </View>
                        </View>
                    )}

                    <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                        <Ionicons name="card-outline" size={16} color="#9ca3af" />
                        <View className="flex-1">
                            <Typography className="text-xs text-muted-foreground">Payment</Typography>
                            <Typography className="text-sm font-semibold text-foreground">{paymentName}</Typography>
                        </View>
                        <Chip color={paymentStatusColor} size="sm" variant="soft">
                            <Chip.Label>{paymentStatusLabel}</Chip.Label>
                        </Chip>
                    </View>

                    <View className="flex-row items-center gap-3 px-4 py-3">
                        <Ionicons name="person-outline" size={16} color="#9ca3af" />
                        <View className="flex-1">
                            <Typography className="text-xs text-muted-foreground">Customer</Typography>
                            <Typography className="text-sm font-semibold text-foreground">
                                {customerName ?? 'Walk-in'}
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
                        {items.map((item, index) => (
                            <View
                                key={index}
                                className={`flex-row items-center justify-between px-4 py-3 ${index < items.length - 1 ? 'border-b border-border' : ''}`}
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
                                <Typography className="text-sm text-muted-foreground">Payment fee</Typography>
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

                {/* ── Payment status refresh ── */}
                {/* No order-status-update endpoint exists in the given API collection —
                    the only write action available is re-checking payment status. */}
                <View className="gap-2">
                    <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Payment status
                    </Typography>
                    <Button
                        variant="outline"
                        onPress={() => paymentStatus.mutate()}
                        isDisabled={paymentStatus.isPending}
                    >
                        {paymentStatus.isPending ? (
                            <ActivityIndicator />
                        ) : (
                            <>
                                <Ionicons name="refresh-outline" size={16} color="hsl(var(--foreground))" />
                                <Button.Label className="ml-1.5">Refresh payment status</Button.Label>
                            </>
                        )}
                    </Button>
                    {paymentStatus.isError && (
                        <Typography className="text-xs text-danger">{getErrorMessage(paymentStatus.error)}</Typography>
                    )}
                </View>
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

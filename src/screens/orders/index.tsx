import { MOCK_ORDERS, type MockOrder, type OrderStatus } from '@/data/orders-mock';
import { formatRupiah } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Separator, Surface, Typography } from 'heroui-native';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; color: 'success' | 'danger' | 'default' | 'warning' }
> = {
    completed: { label: 'Completed', color: 'success' },
    pending:   { label: 'Pending',   color: 'warning'  },
    cancelled: { label: 'Cancelled', color: 'danger'   },
};

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

type StatusFilter = 'all' | OrderStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'all',       label: 'All'       },
    { value: 'completed', label: 'Completed' },
    { value: 'pending',   label: 'Pending'   },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersScreen(): React.JSX.Element {
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const completedOrders = MOCK_ORDERS.filter((o) => o.status === 'completed');
    const todayRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
    const pendingCount = MOCK_ORDERS.filter((o) => o.status === 'pending').length;
    const cancelledCount = MOCK_ORDERS.filter((o) => o.status === 'cancelled').length;

    const filtered =
        statusFilter === 'all'
            ? MOCK_ORDERS
            : MOCK_ORDERS.filter((o) => o.status === statusFilter);

    const toggleExpand = (id: string) =>
        setExpandedId((prev) => (prev === id ? null : id));

    return (
        <View className="flex-1 bg-background">
            {/* Stats */}
            <View className="flex-row gap-3 px-4 pt-4 pb-2">
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-xl font-bold text-foreground">{MOCK_ORDERS.length}</Typography>
                    <Typography className="text-xs text-muted-foreground">Today</Typography>
                </Surface>
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-lg font-bold text-green-500" numberOfLines={1}>
                        {formatRupiah(todayRevenue)}
                    </Typography>
                    <Typography className="text-xs text-muted-foreground">Revenue</Typography>
                </Surface>
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-xl font-bold text-warning">{pendingCount}</Typography>
                    <Typography className="text-xs text-muted-foreground">Pending</Typography>
                </Surface>
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-xl font-bold text-danger">{cancelledCount}</Typography>
                    <Typography className="text-xs text-muted-foreground">Cancelled</Typography>
                </Surface>
            </View>

            {/* Status filter pills */}
            <View className="flex-row items-center gap-2 px-4 py-3">
                {STATUS_FILTERS.map((f) => {
                    const isSelected = statusFilter === f.value;
                    return (
                        <Pressable
                            key={f.value}
                            onPress={() => setStatusFilter(f.value)}
                            className={`px-3 py-1.5 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                        >
                            <Typography className={`text-xs font-medium ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                {f.label}
                            </Typography>
                        </Pressable>
                    );
                })}
                <Typography className="text-xs text-muted-foreground ml-auto">
                    {filtered.length} order{filtered.length !== 1 ? 's' : ''}
                </Typography>
            </View>

            <Separator />

            {/* Order list */}
            <ScrollView className="flex-1" contentContainerClassName="py-2">
                {filtered.length === 0 ? (
                    <View className="items-center justify-center py-20 gap-2">
                        <Ionicons name="receipt-outline" size={40} color="#9ca3af" />
                        <Typography className="text-sm text-muted-foreground">No orders found</Typography>
                    </View>
                ) : (
                    filtered.map((order, index) => (
                        <OrderRow
                            key={order.id}
                            order={order}
                            isExpanded={expandedId === order.id}
                            onToggle={() => toggleExpand(order.id)}
                            isLast={index === filtered.length - 1}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

function OrderRow({
    order,
    isExpanded,
    onToggle,
    isLast,
}: {
    order: MockOrder;
    isExpanded: boolean;
    onToggle: () => void;
    isLast: boolean;
}) {
    const status = STATUS_CONFIG[order.status];
    const totalItems = order.items.reduce((s, i) => s + i.qty, 0);

    return (
        <View>
            <Pressable onPress={onToggle} className="px-4 py-3 active:bg-muted/30">
                {/* Top row */}
                <View className="flex-row items-start justify-between gap-3">
                    <View className="gap-0.5 flex-1">
                        <View className="flex-row items-center gap-2">
                            <Typography className="text-sm font-semibold text-foreground font-mono">
                                #{order.id}
                            </Typography>
                            <Chip color={status.color} size="sm" variant="soft">
                                <Chip.Label>{status.label}</Chip.Label>
                            </Chip>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons
                                name={order.order_type === 'dine-in' ? 'restaurant-outline' : 'bag-outline'}
                                size={12}
                                color="#9ca3af"
                            />
                            <Typography className="text-xs text-muted-foreground">
                                {order.order_type === 'dine-in' ? `Dine-in${order.table ? ` · ${order.table}` : ''}` : 'Takeaway'}
                            </Typography>
                            {order.customer_name && (
                                <>
                                    <Typography className="text-xs text-muted-foreground">·</Typography>
                                    <Typography className="text-xs text-muted-foreground">{order.customer_name}</Typography>
                                </>
                            )}
                        </View>
                    </View>

                    <View className="items-end gap-0.5">
                        <Typography className="text-sm font-bold text-foreground">
                            {formatRupiah(order.total)}
                        </Typography>
                        <Typography className="text-xs text-muted-foreground">
                            {formatTime(order.created_at)}
                        </Typography>
                    </View>
                </View>

                {/* Bottom row */}
                <View className="flex-row items-center justify-between mt-1.5">
                    <View className="flex-row items-center gap-1.5">
                        <Ionicons name="card-outline" size={12} color="#9ca3af" />
                        <Typography className="text-xs text-muted-foreground">{order.payment_method}</Typography>
                        <Typography className="text-xs text-muted-foreground">·</Typography>
                        <Typography className="text-xs text-muted-foreground">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                        </Typography>
                    </View>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#9ca3af"
                    />
                </View>
            </Pressable>

            {/* Expandable order items */}
            {isExpanded && (
                <View className="mx-4 mb-3 overflow-hidden">
                    <Surface className="w-full overflow-hidden">
                        {order.items.map((item, i) => (
                            <View
                                key={i}
                                className={`flex-row justify-between px-4 py-2.5 ${i < order.items.length - 1 ? 'border-b border-border' : ''}`}
                            >
                                <Typography className="text-sm text-foreground flex-1" numberOfLines={1}>
                                    {item.qty}× {item.name}
                                </Typography>
                                <Typography className="text-sm font-semibold text-foreground">
                                    {formatRupiah(item.price * item.qty)}
                                </Typography>
                            </View>
                        ))}
                        <View className="flex-row justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                            <Typography className="text-sm text-muted-foreground">Total</Typography>
                            <Typography className="text-sm font-bold text-foreground">
                                {formatRupiah(order.total)}
                            </Typography>
                        </View>
                    </Surface>
                    {order.notes && (
                        <View className="flex-row items-start gap-1.5 mt-2 px-1">
                            <Ionicons name="chatbubble-outline" size={12} color="#9ca3af" className="mt-0.5" />
                            <Typography className="text-xs text-muted-foreground italic flex-1">
                                {order.notes}
                            </Typography>
                        </View>
                    )}
                </View>
            )}

            {!isLast && <Separator className="mx-4" />}
        </View>
    );
}

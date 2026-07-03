import { useOrders } from '@/hooks/db/useOrders';
import {
    extractCustomerName,
    extractPaymentName,
    extractStatusColor,
    extractStatusLabel,
    extractTableName,
} from '@/api/mappers/order';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { formatRupiah } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Separator, Typography } from 'heroui-native';
import React from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

type StatusFilter = 'all' | 'new' | 'process' | 'completed' | 'cancelled' | 'rejected';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'process', label: 'Process' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rejected', label: 'Rejected' },
];

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function OrdersScreen(): React.JSX.Element {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useOrders(statusFilter === 'all' ? undefined : statusFilter);

    const orders = data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <View className="flex-1 bg-background">
            {/* Status filter pills */}
            <View className="flex-row items-center gap-2 px-4 py-3 flex-wrap">
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
                    {orders.length} order{orders.length !== 1 ? 's' : ''}
                </Typography>
            </View>

            <Separator />

            {isLoading ? (
                <LoadingState message="Loading orders…" />
            ) : isError ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : orders.length === 0 ? (
                <EmptyState icon="receipt-outline" message="No orders found" />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(order) => order.id}
                    contentContainerClassName="py-2"
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    onEndReachedThreshold={0.5}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    ItemSeparatorComponent={() => <Separator className="mx-4" />}
                    renderItem={({ item }) => (
                        <OrderRow order={item} onPress={() => router.push(`/orders/${item.id}` as never)} />
                    )}
                    ListFooterComponent={isFetchingNextPage ? <LoadingState /> : null}
                />
            )}
        </View>
    );
}

function OrderRow({
    order,
    onPress,
}: {
    order: App.Data.Merchant.Order.OrderListData;
    onPress: () => void;
}) {
    const statusLabel = extractStatusLabel(order.order_status);
    const statusColor = extractStatusColor(order.order_status);
    const customerName = extractCustomerName(order.customer);
    const paymentName = extractPaymentName(order.payment);
    const tableName = extractTableName(order.orderable);

    return (
        <Pressable onPress={onPress} className="px-4 py-3 active:bg-muted/30">
            {/* Top row */}
            <View className="flex-row items-start justify-between gap-3">
                <View className="gap-0.5 flex-1">
                    <View className="flex-row items-center gap-2">
                        <Typography className="text-sm font-semibold text-foreground font-mono">
                            {order.code}
                        </Typography>
                        <Chip color={statusColor} size="sm" variant="soft">
                            <Chip.Label>{statusLabel}</Chip.Label>
                        </Chip>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <Ionicons
                            name={order.order_type === 'dine-in' ? 'restaurant-outline' : 'bag-outline'}
                            size={12}
                            color="#9ca3af"
                        />
                        <Typography className="text-xs text-muted-foreground">
                            {order.order_type === 'dine-in' ? `Dine-in${tableName ? ` · ${tableName}` : ''}` : 'Takeaway'}
                        </Typography>
                        {customerName && (
                            <>
                                <Typography className="text-xs text-muted-foreground">·</Typography>
                                <Typography className="text-xs text-muted-foreground">{customerName}</Typography>
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
                    <Typography className="text-xs text-muted-foreground">{paymentName}</Typography>
                    <Typography className="text-xs text-muted-foreground">·</Typography>
                    <Typography className="text-xs text-muted-foreground">
                        {order.products_count} item{order.products_count !== 1 ? 's' : ''}
                    </Typography>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
            </View>
        </Pressable>
    );
}

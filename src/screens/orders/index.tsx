import { useOrders } from "@/hooks/db/useOrders";
import {
  extractAreaName,
  extractCustomerName,
  extractPaymentName,
  extractPickupTime,
  extractTableId,
  extractTableName,
  getOrderStatus,
  getPaymentStatus,
} from "@/api/mappers/order";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Chip, Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useTables } from "@/hooks/db/useTables";

type StatusFilter = "all" | "new" | "process" | "completed" | "cancelled" | "rejected";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "process", label: "Process" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatPickupTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const time = /^(\d{2}):(\d{2})/.exec(value);
  return time ? `${time[1]}:${time[2]}` : value;
}

export default function OrdersScreen(): React.JSX.Element {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const { data: tables } = useTables();

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
  } = useOrders(statusFilter === "all" ? undefined : statusFilter);

  const orders = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <View className="flex-1 bg-background">
      {/* Status filter pills */}
      <View className="flex-row items-center gap-2 px-5 py-4 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const isSelected = statusFilter === f.value;
          const status =
            f.value === "all"
              ? { label: f.label, color: "default" as const }
              : getOrderStatus(f.value);
          return (
            <Chip
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              variant={isSelected ? "primary" : "secondary"}
              color={status.color}
            >
              <Chip.Label>{status.label}</Chip.Label>
            </Chip>
          );
        })}
        <Typography type="body-xs" color="muted" className="ml-auto">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
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
            <OrderRow
              order={item}
              areaName={
                extractAreaName(item.orderable) ??
                tables?.find((table) => table.id === extractTableId(item.orderable))?.area_name ??
                null
              }
              onPress={() => router.push(`/orders/${item.id}` as never)}
            />
          )}
          ListFooterComponent={isFetchingNextPage ? <LoadingState /> : null}
        />
      )}
    </View>
  );
}

function OrderRow({
  order,
  areaName,
  onPress,
}: {
  order: App.Data.Merchant.Order.OrderListData;
  areaName: string | null;
  onPress: () => void;
}) {
  const themeColorMuted = useThemeColor("muted");
  const orderStatus = getOrderStatus(order.order_status);
  const paymentStatus = getPaymentStatus(order.payment_status);
  const customerName = extractCustomerName(order.customer);
  const paymentName = extractPaymentName(order.payment);
  const tableName = extractTableName(order.orderable);
  const pickupTime = formatPickupTime(extractPickupTime(order.orderable));
  const orderContext =
    order.order_type === "dine-in"
      ? ["Dine-in", areaName, tableName].filter(Boolean).join(" · ")
      : pickupTime
        ? `Takeaway · Pickup ${pickupTime}`
        : "Takeaway";

  return (
    <Pressable onPress={onPress} className="px-5 py-3 active:bg-surface-secondary">
      {/* Top row */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="gap-0.5 flex-1">
          <View className="flex-row items-center gap-2">
            <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
              {order.code}
            </Typography>
            <Chip color={orderStatus.color} size="sm" variant="soft">
              <Chip.Label>{orderStatus.label}</Chip.Label>
            </Chip>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name={order.order_type === "dine-in" ? "restaurant-outline" : "bag-outline"}
              size={12}
              color={themeColorMuted}
            />
            <Typography type="body-xs" color="muted">
              {orderContext}
            </Typography>
            {customerName && (
              <>
                <Typography type="body-xs" color="muted">
                  ·
                </Typography>
                <Typography type="body-xs" color="muted">
                  {customerName}
                </Typography>
              </>
            )}
          </View>
        </View>

        <View className="items-end gap-0.5">
          <Typography type="body-sm" weight="bold" className="tabular-nums">
            {formatRupiah(order.total)}
          </Typography>
          <Typography type="body-xs" color="muted">
            {formatTime(order.created_at)}
          </Typography>
        </View>
      </View>

      {/* Bottom row */}
      <View className="flex-row items-center justify-between mt-1.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="card-outline" size={12} color={themeColorMuted} />
          <Typography type="body-xs" color="muted">
            {paymentName}
          </Typography>
          <Chip color={paymentStatus.color} size="sm" variant="soft">
            <Chip.Label>{paymentStatus.label}</Chip.Label>
          </Chip>
          <Typography type="body-xs" color="muted">
            ·
          </Typography>
          <Typography type="body-xs" color="muted">
            {order.products_count} item{order.products_count !== 1 ? "s" : ""}
          </Typography>
        </View>
        <Ionicons name="chevron-forward" size={14} color={themeColorMuted} />
      </View>
    </Pressable>
  );
}

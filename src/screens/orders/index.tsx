import { useOrders } from "@/hooks/db/use-orders";
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
import LoadingState from "@/components/common/loading-state";
import ErrorState from "@/components/common/error-state";
import { formatDateTime, formatRupiah, formatTime } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { Chip, Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTables } from "@/hooks/db/use-tables";
import { EmptyState } from "heroui-native-pro";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

type StatusFilter = "all" | "open" | "completed" | "cancelled";

const STATUS_FILTERS: StatusFilter[] = ["all", "open", "completed", "cancelled"];

function formatPickupTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return formatDateTime(date, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  const time = /^(\d{2}):(\d{2})/.exec(value);
  return time ? `${time[1]}:${time[2]}` : value;
}

export default function OrdersScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const themeColorMuted = useThemeColor("muted");
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
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={themeColorMuted}
          accessibilityLabel={t("orders.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {STATUS_FILTERS.map((filter) => (
            <Stack.Toolbar.MenuAction
              key={filter}
              onPress={() => setStatusFilter(filter)}
              isOn={statusFilter === filter}
            >
              {t(`orders.filters.${filter}`)}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        {isLoading ? (
          <LoadingState message={t("orders.loading")} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : orders.length === 0 ? (
          <EmptyState className="py-20">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <AppIcon name="receipt-outline" size={20} color={themeColorMuted} />
              </EmptyState.Media>
              <EmptyState.Title>{t("orders.empty")}</EmptyState.Title>
              <EmptyState.Description>{t("orders.emptyDescription")}</EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
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
    </>
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
  const { t } = useTranslation();
  const themeColorMuted = useThemeColor("muted");
  const orderStatus = getOrderStatus(order.order_status);
  const paymentStatus = getPaymentStatus(order.payment_status);
  const customerName = extractCustomerName(order.customer);
  const paymentName = extractPaymentName(order.payment);
  const tableName = extractTableName(order.orderable);
  const pickupTime = formatPickupTime(extractPickupTime(order.orderable));
  const orderStatusLabel = t(`orders.status.${orderStatus.value}` as TranslationKey);
  const paymentStatusLabel = t(`orders.paymentStatus.${paymentStatus.value}` as TranslationKey);
  const orderContext =
    order.order_type === "dine-in"
      ? [t("orders.dineIn"), areaName, tableName].filter(Boolean).join(" · ")
      : pickupTime
        ? t("orders.takeawayPickup", { time: pickupTime })
        : t("orders.takeaway");

  return (
    <Pressable onPress={onPress} className="px-4 py-3 active:bg-surface-secondary md:px-6">
      {/* Top row */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="gap-0.5 flex-1">
          <View className="flex-row items-center gap-2">
            <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
              {order.code}
            </Typography>
            <Chip color={orderStatus.color} size="sm" variant="soft">
              <Chip.Label>{orderStatusLabel}</Chip.Label>
            </Chip>
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppIcon
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
          <Typography type="body-xs" color="muted" className="tabular-nums">
            {formatTime(order.created_at)}
          </Typography>
        </View>
      </View>

      {/* Bottom row */}
      <View className="flex-row items-center justify-between mt-1.5">
        <View className="flex-row items-center gap-1.5">
          <AppIcon name="card-outline" size={12} color={themeColorMuted} />
          <Typography type="body-xs" color="muted">
            {paymentName}
          </Typography>
          <Chip color={paymentStatus.color} size="sm" variant="soft">
            <Chip.Label>{paymentStatusLabel}</Chip.Label>
          </Chip>
          <Typography type="body-xs" color="muted">
            ·
          </Typography>
          <Typography type="body-xs" color="muted">
            {t(order.products_count === 1 ? "orders.itemOne" : "orders.itemOther", {
              count: order.products_count,
            })}
          </Typography>
        </View>
        <AppIcon name="chevron-forward" size={14} color={themeColorMuted} />
      </View>
    </Pressable>
  );
}

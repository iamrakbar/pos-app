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
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Chip, ScrollShadow, Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { useTables } from "@/hooks/db/use-tables";
import { EmptyState } from "heroui-native-pro";
import { getLocaleTag, type TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

// type StatusFilter = "all" | "new" | "process" | "completed" | "cancelled" | "rejected";
type StatusFilter = "all" | "new" | "process" | "completed";

const STATUS_FILTERS: StatusFilter[] = ["all", "new", "process", "completed"];

function formatTime(iso: string, localeTag: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" });
}

function formatPickupTime(value: string | null, localeTag: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return date.toLocaleString(localeTag, {
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
  const { locale, t } = useTranslation();
  const localeTag = getLocaleTag(locale);
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
    <View className="flex-1 bg-background">
      <View className="py-3">
        <ScrollShadow orientation="horizontal" size={32} LinearGradientComponent={LinearGradient}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-4 md:px-6"
          >
            {STATUS_FILTERS.map((filter) => {
              return (
                <Chip
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  variant={statusFilter === filter ? "primary" : "secondary"}
                >
                  <Chip.Label>{t(`orders.filters.${filter}`)}</Chip.Label>
                </Chip>
              );
            })}
          </ScrollView>
        </ScrollShadow>
      </View>

      {isLoading ? (
        <LoadingState message={t("orders.loading")} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState className="py-20">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Ionicons name="receipt-outline" size={20} color={themeColorMuted} />
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
              localeTag={localeTag}
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
  localeTag,
  onPress,
}: {
  order: App.Data.Merchant.Order.OrderListData;
  areaName: string | null;
  localeTag: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const themeColorMuted = useThemeColor("muted");
  const orderStatus = getOrderStatus(order.order_status);
  const paymentStatus = getPaymentStatus(order.payment_status);
  const customerName = extractCustomerName(order.customer);
  const paymentName = extractPaymentName(order.payment);
  const tableName = extractTableName(order.orderable);
  const pickupTime = formatPickupTime(extractPickupTime(order.orderable), localeTag);
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
            {formatTime(order.created_at, localeTag)}
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
        <Ionicons name="chevron-forward" size={14} color={themeColorMuted} />
      </View>
    </Pressable>
  );
}

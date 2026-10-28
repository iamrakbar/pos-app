import { statusChipVariant } from "@/utils/status-chip-variant";
import { Typography , Separator ,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Skeleton as PanelListSkeleton,
 EmptyState, Chip as PanelChip } from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { useCSSVariable } from "uniwind";
import { useOrders } from "@/hooks/db/use-orders";
import { extractPaymentExpiry } from "@/api/mappers/checkout";
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
import { formatDateTime, formatRupiah, formatTime } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { getToolbarIcon } from "@/utils/toolbar-icons";

import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTables } from "@/hooks/db/use-tables";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

type StatusFilter = "all" | "open" | "completed" | "cancelled";

const STATUS_FILTERS: StatusFilter[] = ["all", "open", "completed", "cancelled"];

function formatPickupTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) {
    return formatDateTime(date, {
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
  const { t } = useTranslation();
  const router = useRouter();
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
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

  const seenOrderIds = new Set<string>();
  const orders = (data?.pages.flatMap((page) => page.data) ?? []).filter((order) => {
    if (seenOrderIds.has(order.id)) return false;
    seenOrderIds.add(order.id);
    return true;
  });

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
          <View className="flex-1 gap-px py-2" accessibilityRole="progressbar">
            {Array.from({ length: 6 }, (_, index) => (
              <View
                key={`loading-row-${index}`}
                className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6"
              >
                <PanelListSkeleton className="size-11 shrink-0 rounded-xl" />
                <View className="flex-1 gap-2">
                  <PanelListSkeleton className="h-4 w-3/5 rounded-md" />
                  <PanelListSkeleton className="h-3 w-2/5 rounded-md" />
                  <PanelListSkeleton className="h-3 w-1/3 rounded-md" />
                </View>
                <PanelListSkeleton className="size-4 rounded-full" />
              </View>
            ))}
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
            <PanelErrorAlert variant="destructive">
              <PanelErrorAlert.Indicator />
              <PanelErrorAlert.Content>
                <PanelErrorAlert.Description>{getErrorMessage(error)}</PanelErrorAlert.Description>
              </PanelErrorAlert.Content>
            </PanelErrorAlert>
            <PanelErrorButton variant="outline" onPress={() => void refetch()}>
              {t("common.retry")}
            </PanelErrorButton>
          </View>
        ) : orders.length === 0 ? (
          <EmptyState className="py-20">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <AppIcon icon={AppIcons.receipt} size={20} color={themeColorMuted} />
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
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="gap-px py-2" accessibilityRole="progressbar">
                  {Array.from({ length: 1 }, (_, index) => (
                    <View
                      key={`loading-row-${index}`}
                      className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6"
                    >
                      <PanelListSkeleton className="size-11 shrink-0 rounded-xl" />
                      <View className="flex-1 gap-2">
                        <PanelListSkeleton className="h-4 w-3/5 rounded-md" />
                        <PanelListSkeleton className="h-3 w-2/5 rounded-md" />
                        <PanelListSkeleton className="h-3 w-1/3 rounded-md" />
                      </View>
                      <PanelListSkeleton className="size-4 rounded-full" />
                    </View>
                  ))}
                </View>
              ) : null
            }
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
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
  const orderStatus = getOrderStatus(order.order_status);
  const paymentStatus = getPaymentStatus(order.payment_status, {
    expiresAt: extractPaymentExpiry(order.payment),
  });
  const customerName = extractCustomerName(order.customer);
  const paymentName = extractPaymentName(order.payment);
  const tableName = extractTableName(order.orderable);
  const pickupTime = formatPickupTime(extractPickupTime(order.orderable));
  const orderStatusLabel = t(`orders.status.${orderStatus.value}` as TranslationKey);
  const paymentStatusLabel = t(`orders.paymentStatus.${paymentStatus.value}` as TranslationKey);
  const cancellationReasonLabel = order.cancellation_reason_code
    ? t(`orders.cancellationReasons.${order.cancellation_reason_code}` as TranslationKey)
    : null;
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
            <PanelChip variant={statusChipVariant(orderStatus.color)} size="sm">
              <PanelChip.Label>{orderStatusLabel}</PanelChip.Label>
            </PanelChip>
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppIcon
              icon={order.order_type === "dine-in" ? AppIcons.restaurant : AppIcons.bag}
              size={12}
              color={themeColorMuted}
            />
            <Typography type="body-xs" muted>
              {customerName ? `${orderContext} · ${customerName}` : orderContext}
            </Typography>
          </View>
          {cancellationReasonLabel ? (
            <Typography type="body-xs" muted>
              {cancellationReasonLabel}
            </Typography>
          ) : null}
        </View>

        <View className="items-end gap-0.5">
          <Typography type="body-sm" weight="bold" className="tabular-nums">
            {formatRupiah(order.total)}
          </Typography>
          <Typography type="body-xs" muted className="tabular-nums">
            {formatTime(order.created_at)}
          </Typography>
        </View>
      </View>

      {/* Bottom row */}
      <View className="flex-row items-center justify-between mt-1.5">
        <View className="flex-row items-center gap-1.5">
          <Typography type="body-xs" muted>
            {paymentName}
          </Typography>
          <PanelChip variant={statusChipVariant(paymentStatus.color)} size="sm">
            <PanelChip.Label>{paymentStatusLabel}</PanelChip.Label>
          </PanelChip>
          <Typography type="body-xs" muted>
            ·
          </Typography>
          <Typography type="body-xs" muted>
            {t(order.products_count === 1 ? "orders.itemOne" : "orders.itemOther", {
              count: order.products_count,
            })}
          </Typography>
        </View>
        <AppIcon icon={AppIcons.chevronForward} size={14} color={themeColorMuted} />
      </View>
    </Pressable>
  );
}

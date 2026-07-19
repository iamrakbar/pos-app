import { extractPaymentName, getOrderStatus, getPaymentStatus } from "@/api/mappers/order";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { useEarningsOrders } from "@/hooks/db/useEarnings";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { EmptyState } from "heroui-native-pro";
import { RefreshControl, ScrollView, View } from "react-native";

type Period = "today" | "7-days" | "30-days";

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "today", label: "Today", days: 1 },
  { value: "7-days", label: "7 Days", days: 7 },
  { value: "30-days", label: "30 Days", days: 30 },
];

function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPeriodRange(period: Period) {
  const definition = PERIODS.find((item) => item.value === period) ?? PERIODS[0];
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (definition.days - 1));
  return { dateFrom: toDateParam(from), dateTo: toDateParam(to) };
}

function formatPeriodLabel(dateFrom: string, dateTo: string): string {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (dateFrom === dateTo) {
    return to.toLocaleDateString("id-ID", { ...options, year: "numeric" });
  }
  return `${from.toLocaleDateString("id-ID", options)} – ${to.toLocaleDateString("id-ID", {
    ...options,
    year: "numeric",
  })}`;
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const themeColorAccentSoftForeground = useThemeColor("accent-soft-foreground");
  return (
    <Card className="min-w-[150px] flex-1">
      <Card.Body className="gap-3">
        <View className="size-9 items-center justify-center rounded-panel-inner bg-accent-soft">
          <Ionicons name={icon} size={18} color={themeColorAccentSoftForeground} />
        </View>
        <View className="gap-0.5">
          <Typography type="body-xs" color="muted">
            {label}
          </Typography>
          <Typography type="body" weight="bold" className="tabular-nums" numberOfLines={1}>
            {value}
          </Typography>
        </View>
      </Card.Body>
    </Card>
  );
}

export default function EarningsScreen(): React.JSX.Element {
  const [period, setPeriod] = React.useState<Period>("today");
  const { dateFrom, dateTo } = getPeriodRange(period);
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEarningsOrders(dateFrom, dateTo);
  const themeColorMuted = useThemeColor("muted");

  const paidOrders = data.filter(
    (order) => getPaymentStatus(order.payment_status).color === "success"
  );
  const grossEarnings = paidOrders.reduce((total, order) => total + order.total, 0);
  const itemCount = paidOrders.reduce((total, order) => total + order.products_count, 0);
  const averageOrder = paidOrders.length > 0 ? grossEarnings / paidOrders.length : 0;

  const payments = Array.from(
    paidOrders.reduce((groups, order) => {
      const name = extractPaymentName(order.payment);
      const current = groups.get(name) ?? { name, amount: 0, count: 0 };
      current.amount += order.total;
      current.count += 1;
      groups.set(name, current);
      return groups;
    }, new Map<string, { name: string; amount: number; count: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.amount - a.amount);

  const dineInOrders = paidOrders.filter((order) => order.order_type === "dine-in");
  const takeawayOrders = paidOrders.filter((order) => order.order_type !== "dine-in");
  const recentOrders = paidOrders.slice(0, 5);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-5 pb-8"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="w-full gap-4">
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            {PERIODS.map((item) => (
              <Chip
                key={item.value}
                variant={period === item.value ? "primary" : "secondary"}
                onPress={() => setPeriod(item.value)}
              >
                <Chip.Label>{item.label}</Chip.Label>
              </Chip>
            ))}
          </View>
          <Typography type="body-xs" color="muted">
            Paid and completed sales · {formatPeriodLabel(dateFrom, dateTo)}
          </Typography>
        </View>

        {isLoading ? (
          <LoadingState message="Loading earnings…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <View className="flex-row flex-wrap gap-3">
              <MetricCard
                label="Gross earnings"
                value={formatRupiah(grossEarnings)}
                icon="wallet-outline"
              />
              <MetricCard
                label="Paid orders"
                value={String(paidOrders.length)}
                icon="receipt-outline"
              />
              <MetricCard
                label="Average order"
                value={formatRupiah(averageOrder)}
                icon="analytics-outline"
              />
              <MetricCard label="Items sold" value={String(itemCount)} icon="bag-handle-outline" />
            </View>

            {paidOrders.length === 0 ? (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Ionicons name="wallet-outline" size={20} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>No paid earnings</EmptyState.Title>
                  <EmptyState.Description>
                    No completed, paid orders were found for this period.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              <>
                <Card className="p-0 overflow-hidden">
                  <Card.Header className="p-4">
                    <Card.Title>Payment Methods</Card.Title>
                  </Card.Header>
                  <Separator />
                  {payments.map((payment, index) => (
                    <View key={payment.name}>
                      <View className="flex-row items-center gap-3 px-4 py-3.5">
                        <View className="size-9 items-center justify-center rounded-panel-inner bg-surface-secondary">
                          <Ionicons name="card-outline" size={17} color={themeColorMuted} />
                        </View>
                        <View className="flex-1 gap-0.5">
                          <Typography type="body-sm" weight="semibold">
                            {payment.name}
                          </Typography>
                          <Typography type="body-xs" color="muted">
                            {payment.count} order{payment.count !== 1 ? "s" : ""}
                          </Typography>
                        </View>
                        <Typography type="body-sm" weight="bold" className="tabular-nums">
                          {formatRupiah(payment.amount)}
                        </Typography>
                      </View>
                      {index < payments.length - 1 ? <Separator className="mx-4" /> : null}
                    </View>
                  ))}
                </Card>

                <Card>
                  <Card.Header>
                    <Card.Title>Order Types</Card.Title>
                  </Card.Header>
                  <Card.Body className="gap-4">
                    <View className="flex-row gap-3">
                      <View className="flex-1 rounded-panel-inner bg-surface-secondary p-3 gap-1">
                        <Typography type="body-xs" color="muted">
                          Dine-in
                        </Typography>
                        <Typography type="body" weight="bold" className="tabular-nums">
                          {dineInOrders.length}
                        </Typography>
                      </View>
                      <View className="flex-1 rounded-panel-inner bg-surface-secondary p-3 gap-1">
                        <Typography type="body-xs" color="muted">
                          Takeaway
                        </Typography>
                        <Typography type="body" weight="bold" className="tabular-nums">
                          {takeawayOrders.length}
                        </Typography>
                      </View>
                    </View>
                  </Card.Body>
                </Card>

                <Card className="p-0 overflow-hidden">
                  <Card.Header className="p-4">
                    <Card.Title>Recent Paid Orders</Card.Title>
                  </Card.Header>
                  <Separator />
                  {recentOrders.map((order, index) => {
                    const orderStatus = getOrderStatus(order.order_status);
                    const paymentStatus = getPaymentStatus(order.payment_status);
                    const isDineIn = order.order_type === "dine-in";

                    return (
                      <View key={order.id}>
                        <View className="gap-2 px-4 py-3.5">
                          <View className="flex-row items-start gap-3">
                            <View className="flex-1 gap-0.5">
                              <Typography
                                type="body-sm"
                                weight="semibold"
                                className="font-mono tabular-nums"
                              >
                                {order.code}
                              </Typography>
                              <Typography type="body-xs" color="muted">
                                {new Date(order.created_at).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </View>
                            <Typography type="body-sm" weight="bold" className="tabular-nums">
                              {formatRupiah(order.total)}
                            </Typography>
                          </View>

                          <View className="flex-row flex-wrap items-center gap-2">
                            <View className="flex-row items-center gap-1.5 pr-1">
                              <Ionicons
                                name={isDineIn ? "restaurant-outline" : "bag-outline"}
                                size={13}
                                color={themeColorMuted}
                              />
                              <Typography type="body-xs" color="muted">
                                {isDineIn ? "Dine-in" : "Takeaway"}
                              </Typography>
                            </View>
                            <Chip color={orderStatus.color} size="sm" variant="soft">
                              <Chip.Label>{orderStatus.label}</Chip.Label>
                            </Chip>
                            <Chip color={paymentStatus.color} size="sm" variant="soft">
                              <Chip.Label>{paymentStatus.label}</Chip.Label>
                            </Chip>
                          </View>
                        </View>
                        {index < recentOrders.length - 1 ? <Separator className="mx-4" /> : null}
                      </View>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { useDashboard } from "@/hooks/db/useDashboard";
import { useAuth } from "@/stores/useAuth";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Separator, Typography, useThemeColor } from "heroui-native";
import { AreaChart, EmptyState } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

const SUMMARY_ICON_BACKGROUNDS = {
  accent: "bg-accent-soft",
  warning: "bg-warning-soft",
  success: "bg-success-soft",
} as const;

function SummaryCard({
  label,
  value,
  icon,
  color = "accent",
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color?: "accent" | "warning" | "success";
}) {
  const iconColor = useThemeColor(`${color}-soft-foreground`);

  return (
    <Card className="min-w-[150px] flex-1">
      <Card.Body className="gap-3">
        <View
          className={`size-9 items-center justify-center rounded-panel-inner ${SUMMARY_ICON_BACKGROUNDS[color]}`}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
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

function formatChartDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type ChartPoint = { date: string; count: number };

function OrdersChart({ data }: { data: ChartPoint[] }) {
  const [width, setWidth] = React.useState(0);
  const height = 224;
  const max = Math.max(1, ...data.map((point) => point.count));
  const domainMax = Math.max(5, Math.ceil(max / 5) * 5);

  return (
    <View className="gap-2" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={{ height }}>
        {width > 0 ? (
          <AreaChart
            data={data}
            xKey="date"
            yKeys={["count"]}
            orientation="vertical"
            domain={{ y: [0, domainMax] }}
            domainPadding={{ top: 8, bottom: 0, left: 8, right: 8 }}
            xAxis={{
              tickCount: data.length,
              labelOffset: 8,
              formatXLabel: (value) => formatChartDate(String(value)),
            }}
            yAxis={[
              {
                tickCount: 5,
                labelOffset: 8,
                formatYLabel: (value) => String(Math.round(Number(value))),
              },
            ]}
            explicitSize={{ width, height }}
            wrapperClassName="h-56"
          >
            {({ points, chartBounds }) => (
              <AreaChart.Area points={points.count} y0={chartBounds.bottom} curveType="monotoneX" />
            )}
          </AreaChart>
        ) : null}
      </View>
    </View>
  );
}

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const dashboard = useDashboard();
  const [themeColorMuted, themeColorForeground] = useThemeColor(["muted", "foreground"]);
  const chart = (dashboard.data?.orders_chart ?? []).map((point) => ({
    date: point.date,
    count: Number(point.count) || 0,
  }));
  const bestSellers = dashboard.data?.best_sellers ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-8 gap-5"
      refreshControl={
        <RefreshControl
          refreshing={dashboard.isRefetching}
          onRefresh={() => void dashboard.refetch()}
        />
      }
    >
      <View className="flex-row items-stretch gap-3">
        <Card className="flex-1">
          <Card.Body className="flex-1 justify-between gap-3">
            <View className="size-9 items-center justify-center rounded-panel-inner bg-surface-secondary">
              <Ionicons name="storefront-outline" size={18} color={themeColorMuted} />
            </View>
            <View className="gap-0.5">
              <Typography type="body-xs" color="muted">
                Merchant
              </Typography>
              <Typography type="body" weight="bold" numberOfLines={2}>
                {activeMerchant?.name ?? "Dashboard"}
              </Typography>
              <Typography type="body-xs" color="muted" numberOfLines={1}>
                Today&apos;s activity
              </Typography>
            </View>
          </Card.Body>
        </Card>

        <Card className="flex-1">
          <Card.Body className="flex-1 justify-between gap-3">
            <View className="gap-0.5">
              <Typography type="body-xs" color="muted">
                Point of Sale
              </Typography>
              <Typography type="body-sm" weight="semibold">
                Ready to take an order?
              </Typography>
            </View>
            <Button size="sm" variant="outline" onPress={() => router.push("/pos" as never)}>
              <Ionicons name="calculator-outline" size={16} color={themeColorForeground} />
              <Button.Label>Open POS</Button.Label>
            </Button>
          </Card.Body>
        </Card>
      </View>

      {dashboard.isLoading ? (
        <LoadingState message="Loading dashboard…" />
      ) : dashboard.isError ? (
        <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
      ) : (
        <>
          <View className="gap-3">
            <Typography type="body-sm" weight="semibold">
              Today
            </Typography>
            <View className="flex-row flex-wrap gap-3">
              <SummaryCard
                label="Revenue"
                value={formatRupiah(dashboard.data?.revenue_today ?? 0)}
                icon="wallet-outline"
                color="success"
              />
              <SummaryCard
                label="Orders"
                value={String(dashboard.data?.orders_today ?? 0)}
                icon="receipt-outline"
              />
              <SummaryCard
                label="Pending"
                value={String(dashboard.data?.pending_orders ?? 0)}
                icon="time-outline"
                color="warning"
              />
              <SummaryCard
                label="Completed"
                value={String(dashboard.data?.completed_orders ?? 0)}
                icon="checkmark-circle-outline"
                color="success"
              />
            </View>
          </View>

          <Card>
            <Card.Body className="gap-4">
              <View className="gap-0.5">
                <Card.Title>Orders</Card.Title>
                <Card.Description>Order activity from the dashboard period</Card.Description>
              </View>
              {chart.length === 0 ? (
                <EmptyState className="py-12">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <Ionicons name="stats-chart-outline" size={20} color={themeColorMuted} />
                    </EmptyState.Media>
                    <EmptyState.Title>No order activity</EmptyState.Title>
                    <EmptyState.Description>
                      Order activity for the dashboard period will appear here.
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              ) : (
                <OrdersChart data={chart} />
              )}
            </Card.Body>
          </Card>

          <Card className="p-0 overflow-hidden">
            <View className="gap-0.5 p-4">
              <Card.Title>Best Sellers</Card.Title>
              <Card.Description>Top products by quantity sold</Card.Description>
            </View>
            <Separator />
            {bestSellers.length === 0 ? (
              <EmptyState className="py-12">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Ionicons name="cube-outline" size={20} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>No products sold</EmptyState.Title>
                  <EmptyState.Description>
                    Best-selling products will appear after completed sales.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              bestSellers.map((product, index) => (
                <View key={product.product_id}>
                  <View className="flex-row items-center gap-3 px-4 py-3.5">
                    <View className="size-8 items-center justify-center rounded-full bg-surface-secondary">
                      <Typography type="body-xs" weight="bold" className="tabular-nums">
                        {index + 1}
                      </Typography>
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                        {product.name}
                      </Typography>
                      <Typography type="body-xs" color="muted" className="tabular-nums">
                        {product.qty_sold} sold
                      </Typography>
                    </View>
                    <Typography type="body-sm" weight="bold" className="tabular-nums">
                      {formatRupiah(product.revenue)}
                    </Typography>
                  </View>
                  {index < bestSellers.length - 1 ? <Separator className="mx-4" /> : null}
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

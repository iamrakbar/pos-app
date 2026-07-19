import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import { useDashboard } from "@/hooks/db/useDashboard";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Select, Separator, Typography, useThemeColor } from "heroui-native";
import { AreaChart, EmptyState } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

const SUMMARY_ICON_BACKGROUNDS = {
  accent: "bg-accent-soft",
  warning: "bg-warning-soft",
  success: "bg-success-soft",
} as const;

const DATE_RANGE_OPTIONS = [
  { value: "last-7-days", label: "7 Hari Terakhir" },
  { value: "last-30-days", label: "30 Hari Terakhir" },
  { value: "this-week", label: "Minggu Ini" },
  { value: "this-month", label: "Bulan Ini" },
  { value: "custom", label: "Kustom" },
] as const;

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

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeChartRange(points: ChartPoint[]): ChartPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minimumStart = new Date(today);
  minimumStart.setDate(minimumStart.getDate() - 6);
  const todayKey = toDateKey(today);
  const countsByDate = new Map<string, number>();

  for (const point of points) {
    const date = point.date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayKey) continue;
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + point.count);
  }

  const earliestApiDate = [...countsByDate.keys()].sort()[0];
  const earliestApiDateValue = earliestApiDate ? new Date(`${earliestApiDate}T00:00:00`) : null;
  const start =
    earliestApiDateValue && earliestApiDateValue < minimumStart
      ? earliestApiDateValue
      : minimumStart;
  const normalized: ChartPoint[] = [];

  for (const date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
    const dateKey = toDateKey(date);
    normalized.push({ date: dateKey, count: countsByDate.get(dateKey) ?? 0 });
  }

  return normalized;
}

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
  const [dateRange, setDateRange] = React.useState<(typeof DATE_RANGE_OPTIONS)[number]>(
    DATE_RANGE_OPTIONS[0]
  );
  const dashboard = useDashboard();
  const [themeColorMuted, themeColorForeground] = useThemeColor(["muted", "foreground"]);
  const chart = normalizeChartRange(
    (dashboard.data?.orders_chart ?? []).map((point) => ({
      date: point.date,
      count: Number(point.count) || 0,
    }))
  );
  const bestSellers = dashboard.data?.best_sellers ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background pt-safe"
      contentContainerClassName="px-4 py-6 pb-8 gap-5"
      refreshControl={
        <RefreshControl
          refreshing={dashboard.isRefetching}
          onRefresh={() => void dashboard.refetch()}
        />
      }
    >
      <View className="flex-row items-center gap-3">
        <DrawerMenuButton />
        <Typography type="body" weight="semibold" className="flex-1">
          Dashboard
        </Typography>
        <Select
          value={dateRange}
          onValueChange={(option) => {
            if (option) setDateRange(option as (typeof DATE_RANGE_OPTIONS)[number]);
          }}
        >
          <Select.Trigger asChild variant="unstyled">
            <Button size="sm" variant="outline">
              <Button.Label>{dateRange.label}</Button.Label>
              <Ionicons name="chevron-down" size={14} color={themeColorMuted} />
            </Button>
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" width={200}>
              <Select.ListLabel>Rentang Tanggal</Select.ListLabel>
              {DATE_RANGE_OPTIONS.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  disabled={option.value !== "last-7-days"}
                />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
        <Button size="sm" variant="outline" onPress={() => router.push("/pos" as never)}>
          <Ionicons name="calculator-outline" size={16} color={themeColorForeground} />
          <Button.Label>POS</Button.Label>
        </Button>
      </View>

      {dashboard.isLoading ? (
        <LoadingState message="Loading dashboard…" />
      ) : dashboard.isError ? (
        <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
      ) : (
        <>
          <View className="gap-3">
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

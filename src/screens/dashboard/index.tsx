import ErrorState from "@/components/common/error-state";
import LoadingAnimation from "@/components/common/loading-animation";
import { useDashboard } from "@/hooks/db/use-dashboard";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDate, formatRupiah } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { Chip, Separator, Typography, useThemeColor } from "heroui-native";
import { AreaChart, EmptyState, Widget } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";
import {
  useOrderRealtimeStatus,
  type OrderRealtimeStatus,
} from "@/stores/use-order-realtime-status";

const SUMMARY_ICON_BACKGROUNDS = {
  accent: "bg-accent-soft",
  warning: "bg-warning-soft",
  success: "bg-success-soft",
} as const;

type Period = "today" | "7-days" | "30-days";

const PERIODS: { value: Period; days: number }[] = [
  { value: "today", days: 1 },
  { value: "7-days", days: 7 },
  { value: "30-days", days: 30 },
];

type AppliedDateRange = { startDate: string; endDate: string };

function SummaryWidget({
  label,
  value,
  icon,
  color = "accent",
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof AppIcon>["name"];
  color?: "accent" | "warning" | "success";
}) {
  const iconColor = useThemeColor(`${color}-soft-foreground`);

  return (
    <Widget className="grow shrink basis-2/5 landscape:basis-1/5">
      <Widget.Header>
        <Widget.Title>{label}</Widget.Title>
        <View
          className={`size-9 items-center justify-center rounded-panel-inner ${SUMMARY_ICON_BACKGROUNDS[color]}`}
        >
          <AppIcon name={icon} size={18} color={iconColor} />
        </View>
      </Widget.Header>
      <Widget.Content className="p-4">
        <Typography
          type="h4"
          weight="bold"
          className="tabular-nums"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Typography>
      </Widget.Content>
    </Widget>
  );
}

function formatChartDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

type ChartPoint = { date: string; count: number };

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getPeriodRange(period: Period): AppliedDateRange {
  const definition = PERIODS.find((item) => item.value === period) ?? PERIODS[0];
  const end = startOfToday();
  const start = new Date(end);
  start.setDate(start.getDate() - (definition.days - 1));

  return { startDate: toDateKey(start), endDate: toDateKey(end) };
}

function RealtimeStatusChip({ status }: { status: OrderRealtimeStatus }) {
  const { t } = useTranslation();
  const statusConfig = {
    connected: { color: "success" as const, label: t("dashboard.liveOrders.connected") },
    connecting: { color: "warning" as const, label: t("dashboard.liveOrders.connecting") },
    reconnecting: { color: "warning" as const, label: t("dashboard.liveOrders.reconnecting") },
    disconnected: { color: "default" as const, label: t("dashboard.liveOrders.disconnected") },
    failed: { color: "danger" as const, label: t("dashboard.liveOrders.failed") },
  }[status];

  return (
    <Chip
      size="sm"
      color={statusConfig.color}
      variant="soft"
      accessibilityLabel={t("dashboard.liveOrders.accessibilityLabel")}
    >
      <Chip.Label>{statusConfig.label}</Chip.Label>
    </Chip>
  );
}

function normalizeChartRange(
  points: ChartPoint[],
  startDate: string,
  endDate: string
): ChartPoint[] {
  const countsByDate = new Map<string, number>();

  for (const point of points) {
    const date = point.date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < startDate || date > endDate) continue;
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + point.count);
  }

  const normalized: ChartPoint[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateKey = toDateKey(date);
    normalized.push({ date: dateKey, count: countsByDate.get(dateKey) ?? 0 });
  }

  return normalized;
}

function OrdersChart({ data, isCompact }: { data: ChartPoint[]; isCompact: boolean }) {
  const [width, setWidth] = React.useState(0);
  const height = isCompact ? 192 : 224;
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
              tickCount: Math.min(data.length, isCompact ? 4 : 8),
              labelOffset: 8,
              formatXLabel: (value: unknown) => formatChartDate(String(value)),
            }}
            yAxis={[
              {
                tickCount: 5,
                labelOffset: 8,
                formatYLabel: (value: unknown) => String(Math.round(Number(value))),
              },
            ]}
            explicitSize={{ width, height }}
            wrapperClassName={isCompact ? "h-48" : "h-56"}
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
  const { t } = useTranslation();
  const { isCompact, horizontalPagePadding } = useResponsiveLayout();
  const [period, setPeriod] = React.useState<Period>("today");
  const appliedRange = getPeriodRange(period);
  const dashboard = useDashboard(appliedRange.startDate, appliedRange.endDate);
  const realtimeStatus = useOrderRealtimeStatus((state) => state.status);
  const themeColorMuted = useThemeColor("muted");

  const chart = normalizeChartRange(
    (dashboard.data?.orders_chart ?? []).map((point) => ({
      date: point.date,
      count: Number(point.count) || 0,
    })),
    appliedRange.startDate,
    appliedRange.endDate
  );
  const bestSellers = dashboard.data?.best_sellers ?? [];
  const dateRangeLabel = t(`dashboard.periods.${period}`);

  if (dashboard.isLoading) {
    return <LoadingAnimation fullScreen />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center py-6 pb-10"
      contentContainerStyle={{ paddingHorizontal: horizontalPagePadding }}
      refreshControl={
        <RefreshControl
          refreshing={dashboard.isRefetching}
          onRefresh={() => void dashboard.refetch()}
        />
      }
    >
      <View className="w-full max-w-7xl gap-6">
        <View className="flex-col landscape:flex-row items-start landscape:items-center justify-between gap-3">
          <Typography type="body-sm">
            {t("dashboard.performance", { period: dateRangeLabel })}
          </Typography>
          <View className="flex-row flex-wrap justify-center gap-2">
            <RealtimeStatusChip status={realtimeStatus} />
            {PERIODS.map((item) => (
              <Chip
                key={item.value}
                variant={period === item.value ? "primary" : "secondary"}
                onPress={() => setPeriod(item.value)}
              >
                <Chip.Label>{t(`dashboard.periods.${item.value}`)}</Chip.Label>
              </Chip>
            ))}
          </View>
        </View>

        {dashboard.isError ? (
          <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
        ) : (
          <>
            <View className="w-full flex-row flex-wrap gap-4">
              <SummaryWidget
                label={t("dashboard.revenue")}
                value={formatRupiah(dashboard.data?.revenue_today ?? 0)}
                icon="wallet-outline"
                color="success"
              />
              <SummaryWidget
                label={t("dashboard.orders")}
                value={String(dashboard.data?.orders_today ?? 0)}
                icon="receipt-outline"
              />
              <SummaryWidget
                label={t("dashboard.pending")}
                value={String(dashboard.data?.pending_orders ?? 0)}
                icon="time-outline"
                color="warning"
              />
              <SummaryWidget
                label={t("dashboard.completed")}
                value={String(dashboard.data?.completed_orders ?? 0)}
                icon="checkmark-circle-outline"
                color="success"
              />
            </View>

            <Widget>
              <Widget.Header>
                <View className="gap-0.5">
                  <Widget.Title>{t("dashboard.orderActivity")}</Widget.Title>
                  <Widget.Description>{t("dashboard.orderActivityDescription")}</Widget.Description>
                </View>
                <Widget.Legend>
                  <Widget.LegendItem colorClassName="bg-chart-3">
                    {t("dashboard.orders")}
                  </Widget.LegendItem>
                </Widget.Legend>
              </Widget.Header>
              <Widget.Content className="p-4">
                {chart.length === 0 ? (
                  <EmptyState className="py-12">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon name="stats-chart-outline" size={20} color={themeColorMuted} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("dashboard.noOrderActivity")}</EmptyState.Title>
                      <EmptyState.Description>
                        {t("dashboard.noOrderActivityDescription")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  <OrdersChart data={chart} isCompact={isCompact} />
                )}
              </Widget.Content>
              <Widget.Footer>
                <Widget.Description>{dateRangeLabel}</Widget.Description>
              </Widget.Footer>
            </Widget>

            <Widget>
              <Widget.Header>
                <View className="gap-0.5">
                  <Widget.Title>{t("dashboard.bestSellers")}</Widget.Title>
                  <Widget.Description>{t("dashboard.bestSellersDescription")}</Widget.Description>
                </View>
              </Widget.Header>
              <Widget.Content className="overflow-hidden p-0">
                {bestSellers.length === 0 ? (
                  <EmptyState className="py-12">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon name="cube-outline" size={20} color={themeColorMuted} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("dashboard.noProductsSold")}</EmptyState.Title>
                      <EmptyState.Description>
                        {t("dashboard.noProductsSoldDescription")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  bestSellers.map((product, index) => (
                    <View key={product.product_id}>
                      <View className={`flex-1 gap-3 px-4 py-3.5 flex-row items-center`}>
                        <View className="flex-1 gap-3 flex-row items-center">
                          <View className="size-8 items-center justify-center rounded-full bg-surface-secondary">
                            <Typography type="body-xs" weight="bold" className="tabular-nums">
                              {index + 1}
                            </Typography>
                          </View>
                          <View className="min-w-0 flex-1 gap-0.5">
                            <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                              {product.name}
                            </Typography>
                            <Typography type="body-xs" color="muted" className="tabular-nums">
                              {t("dashboard.sold", { count: product.qty_sold })}
                            </Typography>
                          </View>
                        </View>
                        <View>
                          <Typography type="body-sm" weight="bold" className="tabular-nums">
                            {formatRupiah(product.revenue)}
                          </Typography>
                        </View>
                      </View>
                      {index < bestSellers.length - 1 ? <Separator className="mx-4" /> : null}
                    </View>
                  ))
                )}
              </Widget.Content>
            </Widget>
          </>
        )}
      </View>
    </ScrollView>
  );
}

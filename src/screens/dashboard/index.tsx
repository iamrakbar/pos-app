import {
  Typography,
  Separator,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  AreaChart,
  Frame,
  Chip as PanelChip,
  EmptyState,
  GridItem,
  Spinner,
} from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { normalizeChartRange } from "@/utils/dashboard-chart";
import { formatLocalDate } from "@/utils/local-date";
import { useCSSVariable } from "uniwind";
import { useDashboard } from "@/hooks/db/use-dashboard";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDate, formatRupiah } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type Period = "today" | "7-days" | "30-days";

const PERIODS: { value: Period; days: number }[] = [
  { value: "today", days: 1 },
  { value: "7-days", days: 7 },
  { value: "30-days", days: 30 },
];

type AppliedDateRange = { startDate: string; endDate: string };

function formatChartDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
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

  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
}

export default function DashboardScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { width, isCompact, isWide, horizontalPagePadding } = useResponsiveLayout();
  const [period, setPeriod] = React.useState<Period>("today");
  const appliedRange = getPeriodRange(period);
  const dashboard = useDashboard(appliedRange.startDate, appliedRange.endDate);
  const themeColorMuted = useCSSVariable("--color-muted-foreground") as string;
  const [metricAccent, metricSuccess, metricWarning] = useCSSVariable([
    "--color-secondary-foreground",
    "--color-success-foreground",
    "--color-warning-foreground",
  ]) as [string, string, string];

  const chart = normalizeChartRange(
    (dashboard.data?.orders_chart ?? []).map((point) => ({
      date: point.date,
      count: Number(point.count) || 0,
    })),
    appliedRange.startDate,
    appliedRange.endDate
  );
  const chartHeight = isCompact ? 192 : 224;
  const chartContentWidth = Math.max(1, Math.min(width - horizontalPagePadding * 2, 1280) - 32);
  const chartMax = Math.max(1, ...chart.map((point) => point.count));
  const chartDomainMax = Math.max(5, Math.ceil(chartMax / 5) * 5);
  const hasOrderActivity = chart.some((point) => point.count > 0);
  // A one-point SVG path has no length or area; repeat the value only for drawing.
  const chartDisplayData = chart.length === 1 ? [chart[0], chart[0]] : chart;
  const bestSellers = dashboard.data?.best_sellers ?? [];
  const dateRangeLabel = t(`dashboard.periods.${period}`);

  if (dashboard.isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        accessibilityRole="progressbar"
        accessibilityLabel={t("common.loadingApplication")}
      >
        <Spinner size="lg" />
      </View>
    );
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
            {PERIODS.map((item) => (
              <PanelChip
                key={item.value}
                variant={period === item.value ? "primary" : "default"}
                selected={period === item.value}
                onPress={() => setPeriod(item.value)}
              >
                <PanelChip.Label>{t(`dashboard.periods.${item.value}`)}</PanelChip.Label>
              </PanelChip>
            ))}
          </View>
        </View>

        {dashboard.isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
            <PanelErrorAlert variant="destructive">
              <PanelErrorAlert.Indicator />
              <PanelErrorAlert.Content>
                <PanelErrorAlert.Description>
                  {getErrorMessage(dashboard.error)}
                </PanelErrorAlert.Description>
              </PanelErrorAlert.Content>
            </PanelErrorAlert>
            <PanelErrorButton variant="outline" onPress={() => void dashboard.refetch()}>
              {t("common.retry")}
            </PanelErrorButton>
          </View>
        ) : (
          <>
            <GridItem.Group
              className="w-full"
              columns={isWide ? 4 : 2}
              gap={16}
              rowHeight={isCompact ? 120 : 136}
              size={isCompact ? "sm" : "default"}
            >
              <GridItem variant="outline">
                <View className="flex-row items-center justify-between gap-2">
                  <GridItem.Title numberOfLines={1}>{t("dashboard.revenue")}</GridItem.Title>
                  <GridItem.Media variant="icon">
                    <AppIcon icon={AppIcons.wallet} size={18} color={metricSuccess} />
                  </GridItem.Media>
                </View>
                <GridItem.Value
                  className="tabular-nums"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {formatRupiah(dashboard.data?.revenue_today ?? 0)}
                </GridItem.Value>
              </GridItem>
              <GridItem variant="outline">
                <View className="flex-row items-center justify-between gap-2">
                  <GridItem.Title numberOfLines={1}>{t("dashboard.orders")}</GridItem.Title>
                  <GridItem.Media variant="icon">
                    <AppIcon icon={AppIcons.receipt} size={18} color={metricAccent} />
                  </GridItem.Media>
                </View>
                <GridItem.Value
                  className="tabular-nums"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {String(dashboard.data?.orders_today ?? 0)}
                </GridItem.Value>
              </GridItem>
              <GridItem variant="outline">
                <View className="flex-row items-center justify-between gap-2">
                  <GridItem.Title numberOfLines={1}>{t("dashboard.pending")}</GridItem.Title>
                  <GridItem.Media variant="icon">
                    <AppIcon icon={AppIcons.time} size={18} color={metricWarning} />
                  </GridItem.Media>
                </View>
                <GridItem.Value
                  className="tabular-nums"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {String(dashboard.data?.pending_orders ?? 0)}
                </GridItem.Value>
              </GridItem>
              <GridItem variant="outline">
                <View className="flex-row items-center justify-between gap-2">
                  <GridItem.Title numberOfLines={1}>{t("dashboard.completed")}</GridItem.Title>
                  <GridItem.Media variant="icon">
                    <AppIcon icon={AppIcons.checkmarkCircle} size={18} color={metricSuccess} />
                  </GridItem.Media>
                </View>
                <GridItem.Value
                  className="tabular-nums"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {String(dashboard.data?.completed_orders ?? 0)}
                </GridItem.Value>
              </GridItem>
            </GridItem.Group>

            <Frame className="w-full">
              <Frame.Header>
                <View className="gap-0.5">
                  <Frame.Title>{t("dashboard.orderActivity")}</Frame.Title>
                  <Frame.Description>{t("dashboard.orderActivityDescription")}</Frame.Description>
                </View>
              </Frame.Header>
              <Frame.Panel className="p-4">
                {!hasOrderActivity ? (
                  <EmptyState className="py-12">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.analytics} size={20} color={themeColorMuted} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("dashboard.noOrderActivity")}</EmptyState.Title>
                      <EmptyState.Description>
                        {t("dashboard.noOrderActivityDescription")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  <AreaChart
                    data={chartDisplayData}
                    accessible={chart.length > 1}
                    xDataKey="date"
                    yDomain={[0, chartDomainMax]}
                    aspectRatio={chartContentWidth / chartHeight}
                    accessibilityLabel={t("dashboard.orderActivity")}
                    accessibilityLabelForDatum={(point) =>
                      `${formatChartDate(String(point.date))}, ${t("dashboard.orders")}: ${Number(point.count)}`
                    }
                  >
                    <AreaChart.Grid rows={5} />
                    <AreaChart.Area dataKey="count" colorIndex={1} />
                    <AreaChart.XAxis
                      ticks={chart.length === 1 ? 0 : Math.min(chart.length, isCompact ? 4 : 8)}
                      format={(point) => formatChartDate(String(point.date))}
                    />
                    <AreaChart.YAxis ticks={5} format={(value) => String(Math.round(value))} />
                    <AreaChart.Legend labels={{ count: t("dashboard.orders") }} />
                    <AreaChart.Tooltip
                      formatX={(point) => formatChartDate(String(point.date))}
                      formatValue={(value) => String(Math.round(value))}
                    />
                  </AreaChart>
                )}
              </Frame.Panel>
              <Frame.Footer>
                <Frame.Description>
                  {chart.length === 1 && hasOrderActivity
                    ? `${dateRangeLabel} · ${t("dashboard.orders")}: ${chart[0]?.count ?? 0}`
                    : dateRangeLabel}
                </Frame.Description>
              </Frame.Footer>
            </Frame>

            <Frame className="w-full">
              <Frame.Header>
                <View className="gap-0.5">
                  <Frame.Title>{t("dashboard.bestSellers")}</Frame.Title>
                  <Frame.Description>{t("dashboard.bestSellersDescription")}</Frame.Description>
                </View>
              </Frame.Header>
              <Frame.Panel dividers={false}>
                {bestSellers.length === 0 ? (
                  <EmptyState className="py-12">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.cube} size={20} color={themeColorMuted} />
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
                            <Typography type="body-xs" muted className="tabular-nums">
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
              </Frame.Panel>
            </Frame>
          </>
        )}
      </View>
    </ScrollView>
  );
}

import ErrorState from "@/components/common/ErrorState";
import LoadingAnimation from "@/components/common/LoadingAnimation";
import DialogCloseButton from "@/components/common/DialogCloseButton";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import { useDashboard } from "@/hooks/db/useDashboard";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Button,
  Description,
  Dialog,
  Label,
  Select,
  Separator,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import {
  AreaChart,
  Calendar,
  DatePicker,
  EmptyState,
  Widget,
  type DatePickerOption,
} from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

const SUMMARY_ICON_BACKGROUNDS = {
  accent: "bg-accent-soft",
  warning: "bg-warning-soft",
  success: "bg-success-soft",
} as const;

const DATE_RANGE_OPTIONS = [
  { value: "last-7-days", label: "Last 7 Days" },
  { value: "last-30-days", label: "Last 30 Days" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "custom", label: "Custom" },
] as const;

type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]["value"];
type AppliedDateRange = { startDate: string; endDate: string };

function SummaryWidget({
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
    <Widget className="min-w-[220px] flex-1">
      <Widget.Header>
        <Widget.Title>{label}</Widget.Title>
        <View
          className={`size-9 items-center justify-center rounded-panel-inner ${SUMMARY_ICON_BACKGROUNDS[color]}`}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
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

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getPresetRange(value: Exclude<DateRangeValue, "custom">): AppliedDateRange {
  const end = startOfToday();
  const start = new Date(end);

  if (value === "last-7-days") start.setDate(start.getDate() - 6);
  if (value === "last-30-days") start.setDate(start.getDate() - 29);
  if (value === "this-week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  }
  if (value === "this-month") start.setDate(1);

  return { startDate: toDateKey(start), endDate: toDateKey(end) };
}

function toDateOption(value: string): NonNullable<DatePickerOption> {
  return {
    value,
    label: new Date(value + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function DashboardDatePicker({
  label,
  value,
  onValueChange,
  description,
  isInvalid,
}: {
  label: string;
  value: NonNullable<DatePickerOption>;
  onValueChange: (value: DatePickerOption | undefined) => void;
  description?: string;
  isInvalid?: boolean;
}) {
  return (
    <DatePicker
      className="min-w-[220px] flex-1"
      value={value}
      onValueChange={onValueChange}
      isRequired
      isInvalid={isInvalid}
      locale="en-US"
      dateDisplayFormat="medium"
    >
      <Label>{label}</Label>
      <DatePicker.Select>
        <DatePicker.Trigger>
          <DatePicker.Value />
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
        <DatePicker.Portal>
          <DatePicker.Overlay />
          <DatePicker.Content presentation="popover" width="trigger">
            <DatePicker.Calendar>
              <Calendar.Header>
                <Calendar.Heading />
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell day={day} />}
                </Calendar.GridHeader>
                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
              </Calendar.Grid>
            </DatePicker.Calendar>
          </DatePicker.Content>
        </DatePicker.Portal>
      </DatePicker.Select>
      {description ? <Description>{description}</Description> : null}
    </DatePicker>
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
              tickCount: Math.min(data.length, 8),
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
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<(typeof DATE_RANGE_OPTIONS)[number]>(
    DATE_RANGE_OPTIONS[0]
  );
  const [appliedRange, setAppliedRange] = React.useState<AppliedDateRange>(() =>
    getPresetRange("last-7-days")
  );
  const [customStart, setCustomStart] = React.useState<NonNullable<DatePickerOption>>(() =>
    toDateOption(getPresetRange("last-7-days").startDate)
  );
  const [customEnd, setCustomEnd] = React.useState<NonNullable<DatePickerOption>>(() =>
    toDateOption(getPresetRange("last-7-days").endDate)
  );
  const [customRangeError, setCustomRangeError] = React.useState<string | null>(null);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = React.useState(false);
  const dashboard = useDashboard(appliedRange.startDate, appliedRange.endDate);
  const [themeColorMuted, themeColorForeground] = useThemeColor(["muted", "foreground"]);
  const chart = normalizeChartRange(
    (dashboard.data?.orders_chart ?? []).map((point) => ({
      date: point.date,
      count: Number(point.count) || 0,
    })),
    appliedRange.startDate,
    appliedRange.endDate
  );
  const bestSellers = dashboard.data?.best_sellers ?? [];
  const dateRangeLabel =
    dateRange.value === "custom"
      ? toDateOption(appliedRange.startDate).label +
        " – " +
        toDateOption(appliedRange.endDate).label
      : dateRange.label;

  const handleRangeChange = (option: { value: string; label: string } | undefined) => {
    if (!option) return;
    const nextOption = DATE_RANGE_OPTIONS.find((item) => item.value === option.value);
    if (!nextOption) return;

    setCustomRangeError(null);
    if (nextOption.value === "custom") {
      setIsCustomRangeOpen(true);
      return;
    }

    setDateRange(nextOption);
    setAppliedRange(getPresetRange(nextOption.value));
  };

  const handleApplyCustomRange = () => {
    const start = new Date(customStart.value + "T00:00:00");
    const end = new Date(customEnd.value + "T00:00:00");
    const today = startOfToday();
    let error: string | null = null;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      error = "Select both a start and end date.";
    } else if (start > end) {
      error = "The start date must be on or before the end date.";
    } else if (end > today) {
      error = "The end date cannot be in the future.";
    } else {
      const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
      if (inclusiveDays > 366) error = "Choose a range of 366 days or less.";
    }

    setCustomRangeError(error);
    if (error) {
      toast.show({ variant: "warning", label: "Invalid date range", description: error });
      return;
    }

    const customOption = DATE_RANGE_OPTIONS.find((option) => option.value === "custom");
    if (customOption) setDateRange(customOption);
    setAppliedRange({ startDate: customStart.value, endDate: customEnd.value });
    setIsCustomRangeOpen(false);
  };

  if (dashboard.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingAnimation />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background pt-safe"
        contentContainerClassName="items-center px-4 py-8 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => void dashboard.refetch()}
          />
        }
      >
        <View className="w-full max-w-7xl gap-6">
          <View className="flex-row flex-wrap items-center gap-3">
            <DrawerMenuButton />
            <View className="min-w-[180px] flex-1 gap-0.5">
              <Typography type="h4" weight="bold">
                Dashboard
              </Typography>
              <Typography type="body-xs" color="muted">
                Sales and order performance at a glance
              </Typography>
            </View>
            <Select value={dateRange} onValueChange={handleRangeChange}>
              <Select.Trigger asChild variant="unstyled">
                <Button size="sm" variant="outline">
                  <Button.Label>{dateRangeLabel}</Button.Label>
                  <Ionicons name="chevron-down" size={14} color={themeColorMuted} />
                </Button>
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width={200}>
                  <Select.ListLabel>Date Range</Select.ListLabel>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value} label={option.label} />
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>
            <Button size="sm" variant="outline" onPress={() => router.push("/pos" as never)}>
              <Ionicons name="calculator-outline" size={16} color={themeColorForeground} />
              <Button.Label>POS</Button.Label>
            </Button>
          </View>

          {dashboard.isError ? (
            <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />
          ) : (
            <>
              <View className="flex-row flex-wrap gap-4">
                <SummaryWidget
                  label="Revenue"
                  value={formatRupiah(dashboard.data?.revenue_today ?? 0)}
                  icon="wallet-outline"
                  color="success"
                />
                <SummaryWidget
                  label="Orders"
                  value={String(dashboard.data?.orders_today ?? 0)}
                  icon="receipt-outline"
                />
                <SummaryWidget
                  label="Pending"
                  value={String(dashboard.data?.pending_orders ?? 0)}
                  icon="time-outline"
                  color="warning"
                />
                <SummaryWidget
                  label="Completed"
                  value={String(dashboard.data?.completed_orders ?? 0)}
                  icon="checkmark-circle-outline"
                  color="success"
                />
              </View>

              <Widget>
                <Widget.Header>
                  <View className="gap-0.5">
                    <Widget.Title>Order Activity</Widget.Title>
                    <Widget.Description>
                      Orders created during the selected period
                    </Widget.Description>
                  </View>
                  <Widget.Legend>
                    <Widget.LegendItem colorClassName="bg-chart-3">Orders</Widget.LegendItem>
                  </Widget.Legend>
                </Widget.Header>
                <Widget.Content className="p-4">
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
                </Widget.Content>
                <Widget.Footer>
                  <Widget.Description>{dateRangeLabel}</Widget.Description>
                </Widget.Footer>
              </Widget>

              <Widget>
                <Widget.Header>
                  <View className="gap-0.5">
                    <Widget.Title>Best Sellers</Widget.Title>
                    <Widget.Description>Top products by quantity sold</Widget.Description>
                  </View>
                </Widget.Header>
                <Widget.Content className="overflow-hidden p-0">
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
                </Widget.Content>
              </Widget>
            </>
          )}
        </View>
      </ScrollView>

      <Dialog
        isOpen={isCustomRangeOpen}
        onOpenChange={(isOpen) => {
          setIsCustomRangeOpen(isOpen);
          if (!isOpen) setCustomRangeError(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-lg self-center">
            <DialogCloseButton />
            <View className="mb-5 gap-1.5 pr-10">
              <Dialog.Title>Custom Date Range</Dialog.Title>
              <Dialog.Description>Select the reporting period to display.</Dialog.Description>
            </View>

            <View className="gap-4">
              <View className="flex-row flex-wrap items-start gap-4">
                <DashboardDatePicker
                  label="From"
                  value={customStart}
                  onValueChange={(value) => {
                    if (value) setCustomStart(value);
                    setCustomRangeError(null);
                  }}
                  isInvalid={customRangeError !== null}
                />
                <DashboardDatePicker
                  label="To"
                  value={customEnd}
                  onValueChange={(value) => {
                    if (value) setCustomEnd(value);
                    setCustomRangeError(null);
                  }}
                  isInvalid={customRangeError !== null}
                />
              </View>

              {customRangeError ? (
                <Typography type="body-xs" className="text-danger">
                  {customRangeError}
                </Typography>
              ) : (
                <Typography type="body-xs" color="muted">
                  Maximum range: 366 days. Future dates are not included.
                </Typography>
              )}

              <View className="flex-row justify-end gap-3">
                <Button variant="ghost" size="sm" onPress={() => setIsCustomRangeOpen(false)}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button
                  size="sm"
                  onPress={handleApplyCustomRange}
                  isDisabled={dashboard.isFetching}
                >
                  <Button.Label>{dashboard.isFetching ? "Applying…" : "Apply"}</Button.Label>
                </Button>
              </View>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

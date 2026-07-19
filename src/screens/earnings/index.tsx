import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { useEarnings } from "@/hooks/db/useEarnings";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Chip, Separator, Typography, useThemeColor } from "heroui-native";
import { EmptyState, Widget } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

type Period = "today" | "7-days" | "30-days";

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "today", label: "Today", days: 1 },
  { value: "7-days", label: "7 Days", days: 7 },
  { value: "30-days", label: "30 Days", days: 30 },
];

const SUMMARY_STYLES = {
  accent: { background: "bg-accent-soft", token: "accent-soft-foreground" },
  success: { background: "bg-success-soft", token: "success-soft-foreground" },
  warning: { background: "bg-warning-soft", token: "warning-soft-foreground" },
  default: { background: "bg-default", token: "foreground" },
} as const;

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

function formatOrderType(value: string): string {
  const normalized = value.toLowerCase().replaceAll("_", "-");
  if (normalized === "dine-in" || normalized === "dinein") return "Dine-in";
  if (normalized === "takeaway" || normalized === "take-away") return "Takeaway";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SummaryWidget({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: keyof typeof SUMMARY_STYLES;
}) {
  const style = SUMMARY_STYLES[color];
  const iconColor = useThemeColor(style.token);

  return (
    <Widget className="min-w-[220px] flex-1">
      <Widget.Header>
        <Widget.Title>{label}</Widget.Title>
        <View
          className={`size-9 items-center justify-center rounded-panel-inner ${style.background}`}
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

export default function EarningsScreen(): React.JSX.Element {
  const [period, setPeriod] = React.useState<Period>("today");
  const { dateFrom, dateTo } = getPeriodRange(period);
  const { data = [], isLoading, isError, error, refetch, isRefetching } = useEarnings(
    dateFrom,
    dateTo
  );
  const mutedColor = useThemeColor("muted");
  const successColor = useThemeColor("success");
  const accentSoftForeground = useThemeColor("accent-soft-foreground");

  const totalEarnings = data.reduce((total, entry) => total + entry.total_price, 0);
  const itemCount = data.reduce((total, entry) => total + entry.items_count, 0);
  const averageOrder = data.length > 0 ? totalEarnings / data.length : 0;

  const orderTypes = Array.from(
    data.reduce((groups, entry) => {
      const name = formatOrderType(entry.order_type);
      const current = groups.get(name) ?? { name, amount: 0, count: 0 };
      current.amount += entry.total_price;
      current.count += 1;
      groups.set(name, current);
      return groups;
    }, new Map<string, { name: string; amount: number; count: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.amount - a.amount);

  const recentEntries = data.slice(0, 8);
  const periodLabel = formatPeriodLabel(dateFrom, dateTo);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-10"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="w-full gap-6">
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View className="gap-1">
              <Typography type="h3" weight="bold">
                Earnings overview
              </Typography>
              <Typography type="body-sm" color="muted">
                Settled sales for {periodLabel}
              </Typography>
            </View>
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
          </View>
        </View>

        {isLoading ? (
          <LoadingState message="Loading earnings…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <View className="flex-row flex-wrap gap-4">
              <SummaryWidget
                label="Settled earnings"
                value={formatRupiah(totalEarnings)}
                icon="wallet-outline"
                color="success"
              />
              <SummaryWidget
                label="Settled orders"
                value={String(data.length)}
                icon="receipt-outline"
                color="accent"
              />
              <SummaryWidget
                label="Average order"
                value={formatRupiah(averageOrder)}
                icon="analytics-outline"
                color="warning"
              />
              <SummaryWidget
                label="Items sold"
                value={String(itemCount)}
                icon="bag-handle-outline"
                color="default"
              />
            </View>

            {data.length === 0 ? (
              <EmptyState className="py-16">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Ionicons name="wallet-outline" size={20} color={mutedColor} />
                  </EmptyState.Media>
                  <EmptyState.Title>No settled earnings</EmptyState.Title>
                  <EmptyState.Description>
                    There are no settled order earnings in this period.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              <>
                <Widget>
                  <Widget.Header>
                    <View>
                      <Widget.Title>Sales by order type</Widget.Title>
                      <Widget.Description>Revenue contribution and settled orders</Widget.Description>
                    </View>
                  </Widget.Header>
                  <Widget.Content className="overflow-hidden p-0">
                    {orderTypes.map((orderType, index) => {
                      const share = totalEarnings > 0 ? orderType.amount / totalEarnings : 0;
                      return (
                        <View key={orderType.name}>
                          <View className="gap-3 p-4">
                            <View className="flex-row items-center gap-3">
                              <View className="size-10 items-center justify-center rounded-panel-inner bg-accent-soft">
                                <Ionicons
                                  name={
                                    orderType.name === "Dine-in"
                                      ? "restaurant-outline"
                                      : "bag-handle-outline"
                                  }
                                  size={18}
                                  color={accentSoftForeground}
                                />
                              </View>
                              <View className="flex-1 gap-0.5">
                                <Typography type="body-sm" weight="semibold">
                                  {orderType.name}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                  {orderType.count} order{orderType.count === 1 ? "" : "s"} ·{" "}
                                  {Math.round(share * 100)}% of earnings
                                </Typography>
                              </View>
                              <Typography type="body-sm" weight="bold" className="tabular-nums">
                                {formatRupiah(orderType.amount)}
                              </Typography>
                            </View>
                            <View className="h-1.5 overflow-hidden rounded-full bg-default">
                              <View
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${Math.max(share * 100, 2)}%` }}
                              />
                            </View>
                          </View>
                          {index < orderTypes.length - 1 ? <Separator /> : null}
                        </View>
                      );
                    })}
                  </Widget.Content>
                  <Widget.Footer>
                    <Widget.Description>{periodLabel}</Widget.Description>
                  </Widget.Footer>
                </Widget>

                <Widget>
                  <Widget.Header>
                    <View>
                      <Widget.Title>Recent earnings</Widget.Title>
                      <Widget.Description>Latest settled order entries</Widget.Description>
                    </View>
                    <Widget.Legend>
                      <Widget.LegendItem colorClassName="bg-success">Settled</Widget.LegendItem>
                    </Widget.Legend>
                  </Widget.Header>
                  <Widget.Content className="overflow-hidden p-0">
                    {recentEntries.map((entry, index) => (
                      <View key={entry.id}>
                        <View className="flex-row items-center gap-3 px-4 py-3.5">
                          <View className="size-10 items-center justify-center rounded-panel-inner bg-success-soft">
                            <Ionicons name="checkmark" size={18} color={successColor} />
                          </View>
                          <View className="min-w-0 flex-1 gap-0.5">
                            <View className="flex-row flex-wrap items-center gap-2">
                              <Typography
                                type="body-sm"
                                weight="semibold"
                                className="font-mono tabular-nums"
                              >
                                {entry.code}
                              </Typography>
                              <Chip color="success" size="sm" variant="soft">
                                <Chip.Label>Settled</Chip.Label>
                              </Chip>
                            </View>
                            <Typography type="body-xs" color="muted">
                              {formatOrderType(entry.order_type)} · {entry.items_count} item
                              {entry.items_count === 1 ? "" : "s"} ·{" "}
                              {new Date(entry.created_at).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </View>
                          <Typography type="body-sm" weight="bold" className="tabular-nums">
                            {formatRupiah(entry.total_price)}
                          </Typography>
                        </View>
                        {index < recentEntries.length - 1 ? <Separator /> : null}
                      </View>
                    ))}
                  </Widget.Content>
                </Widget>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

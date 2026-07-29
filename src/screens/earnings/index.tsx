import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useEarnings } from "@/hooks/db/use-earnings";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatRupiah } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Chip,
  Description,
  Label,
  Select,
  Separator,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { Calendar, DatePicker, EmptyState, Widget, type DatePickerOption } from "heroui-native-pro";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

const DATE_RANGE_OPTIONS = [
  { value: "last-7-days", label: "Last 7 Days" },
  { value: "last-30-days", label: "Last 30 Days" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "custom", label: "Custom" },
] as const;

type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]["value"];
type AppliedDateRange = { dateFrom: string; dateTo: string };

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

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getPresetRange(value: Exclude<DateRangeValue, "custom">): AppliedDateRange {
  const to = startOfToday();
  const from = new Date(to);

  if (value === "last-7-days") from.setDate(from.getDate() - 6);
  if (value === "last-30-days") from.setDate(from.getDate() - 29);
  if (value === "this-week") {
    const day = from.getDay();
    from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
  }
  if (value === "this-month") from.setDate(1);

  return { dateFrom: toDateParam(from), dateTo: toDateParam(to) };
}

function toDateOption(value: string): NonNullable<DatePickerOption> {
  return {
    value,
    label: new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
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
    <Widget className="grow shrink basis-2/5 landscape:basis-1/5">
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

function EarningsDatePicker({
  label,
  value,
  onValueChange,
  isInvalid,
  presentation,
}: {
  label: string;
  value: NonNullable<DatePickerOption>;
  onValueChange: (value: DatePickerOption | undefined) => void;
  isInvalid?: boolean;
  presentation: "dialog" | "popover";
}) {
  return (
    <DatePicker
      className="min-w-55 flex-1"
      value={value}
      onValueChange={onValueChange}
      isRequired
      isInvalid={isInvalid}
      locale="en-US"
      dateDisplayFormat="medium"
    >
      <Label>{label}</Label>
      <DatePicker.Select presentation={presentation}>
        <DatePicker.Trigger>
          <DatePicker.Value />
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
        <DatePicker.Portal>
          <DatePicker.Overlay />
          <DatePicker.Content
            presentation={presentation}
            width={presentation === "popover" ? "trigger" : undefined}
          >
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
    </DatePicker>
  );
}

function CustomDateRangeDialog({
  isOpen,
  onOpenChange,
  start,
  end,
  onStartChange,
  onEndChange,
  error,
  onApply,
  onCancel,
  isApplying,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  start: NonNullable<DatePickerOption>;
  end: NonNullable<DatePickerOption>;
  onStartChange: (value: DatePickerOption | undefined) => void;
  onEndChange: (value: DatePickerOption | undefined) => void;
  error: string | null;
  onApply: () => void;
  onCancel: () => void;
  isApplying: boolean;
}) {
  const { isPhonePortrait } = useOverlayPresentation();
  const pickerPresentation = isPhonePortrait ? "dialog" : "popover";

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Custom Date Range"
      description="Select the earnings period to display."
      maxWidthClassName="max-w-lg"
      footer={
        <View
          className={`gap-3 px-5 pb-5 pt-4 ${
            isPhonePortrait ? "items-stretch" : "flex-row justify-end"
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            className={isPhonePortrait ? "w-full" : undefined}
            onPress={onCancel}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            size="sm"
            className={isPhonePortrait ? "w-full" : undefined}
            onPress={onApply}
            isDisabled={isApplying}
          >
            <Button.Label>{isApplying ? "Applying…" : "Apply"}</Button.Label>
          </Button>
        </View>
      }
    >
      <View className="gap-4 px-5">
        <View className={isPhonePortrait ? "gap-4" : "flex-row flex-wrap items-start gap-4"}>
          <EarningsDatePicker
            label="From"
            value={start}
            onValueChange={onStartChange}
            isInvalid={error !== null}
            presentation={pickerPresentation}
          />
          <EarningsDatePicker
            label="To"
            value={end}
            onValueChange={onEndChange}
            isInvalid={error !== null}
            presentation={pickerPresentation}
          />
        </View>
        {error ? (
          <Typography type="body-xs" className="text-danger">
            {error}
          </Typography>
        ) : (
          <Description>Maximum range: 366 days. Future dates are not included.</Description>
        )}
      </View>
    </AdaptiveFormOverlay>
  );
}

export default function EarningsScreen(): React.JSX.Element {
  const { isCompact, horizontalPagePadding } = useResponsiveLayout();
  const { choicePresentation } = useOverlayPresentation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<(typeof DATE_RANGE_OPTIONS)[number]>(
    DATE_RANGE_OPTIONS[0]
  );
  const [appliedRange, setAppliedRange] = React.useState<AppliedDateRange>(() =>
    getPresetRange("last-7-days")
  );
  const [customStart, setCustomStart] = React.useState<NonNullable<DatePickerOption>>(() =>
    toDateOption(getPresetRange("last-7-days").dateFrom)
  );
  const [customEnd, setCustomEnd] = React.useState<NonNullable<DatePickerOption>>(() =>
    toDateOption(getPresetRange("last-7-days").dateTo)
  );
  const [customRangeError, setCustomRangeError] = React.useState<string | null>(null);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = React.useState(false);
  const { dateFrom, dateTo } = appliedRange;
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEarnings(dateFrom, dateTo);
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
  const dateRangeLabel =
    dateRange.value === "custom"
      ? `${toDateOption(dateFrom).label} – ${toDateOption(dateTo).label}`
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
    const start = new Date(`${customStart.value}T00:00:00`);
    const end = new Date(`${customEnd.value}T00:00:00`);
    const today = startOfToday();
    let rangeError: string | null = null;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      rangeError = "Select both a start and end date.";
    } else if (start > end) {
      rangeError = "The start date must be on or before the end date.";
    } else if (end > today) {
      rangeError = "The end date cannot be in the future.";
    } else {
      const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
      if (inclusiveDays > 366) rangeError = "Choose a range of 366 days or less.";
    }

    setCustomRangeError(rangeError);
    if (rangeError) {
      toast.show({ variant: "warning", label: "Invalid date range", description: rangeError });
      return;
    }

    const customOption = DATE_RANGE_OPTIONS.find((option) => option.value === "custom");
    if (customOption) setDateRange(customOption);
    setAppliedRange({ dateFrom: customStart.value, dateTo: customEnd.value });
    setIsCustomRangeOpen(false);
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="py-6 pb-10"
        contentContainerStyle={{ paddingHorizontal: horizontalPagePadding }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="w-full gap-6">
          <View className="flex-col landscape:flex-row justify-between gap-3">
            <Typography type="body-sm">Settled sales for {periodLabel}</Typography>
            <Select
              presentation={choicePresentation}
              value={dateRange}
              onValueChange={handleRangeChange}
            >
              <Select.Trigger asChild variant="unstyled">
                <Button size="sm" variant="outline" className={isCompact ? "min-w-40" : undefined}>
                  <Button.Label numberOfLines={1}>{dateRangeLabel}</Button.Label>
                  <Ionicons name="chevron-down" size={14} color={mutedColor} />
                </Button>
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content
                  presentation={choicePresentation}
                  width={choicePresentation === "popover" ? 200 : undefined}
                >
                  <Select.ListLabel>Date Range</Select.ListLabel>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value} label={option.label} />
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>
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
                        <Widget.Description>
                          Revenue contribution and settled orders
                        </Widget.Description>
                      </View>
                    </Widget.Header>
                    <Widget.Content className="overflow-hidden p-0">
                      {orderTypes.map((orderType, index) => {
                        const share = totalEarnings > 0 ? orderType.amount / totalEarnings : 0;
                        return (
                          <View key={orderType.name}>
                            <View className="gap-3 p-4">
                              <View
                                className={`gap-3 ${isCompact ? "items-start" : "flex-row items-center"}`}
                              >
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
                          <View
                            className={`gap-3 px-4 py-3.5 ${isCompact ? "items-start" : "flex-row items-center"}`}
                          >
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
      <CustomDateRangeDialog
        isOpen={isCustomRangeOpen}
        onOpenChange={(isOpen) => {
          setIsCustomRangeOpen(isOpen);
          if (!isOpen) setCustomRangeError(null);
        }}
        start={customStart}
        end={customEnd}
        onStartChange={(value) => {
          if (value) setCustomStart(value);
          setCustomRangeError(null);
        }}
        onEndChange={(value) => {
          if (value) setCustomEnd(value);
          setCustomRangeError(null);
        }}
        error={customRangeError}
        onApply={handleApplyCustomRange}
        onCancel={() => setIsCustomRangeOpen(false)}
        isApplying={isRefetching}
      />
    </>
  );
}

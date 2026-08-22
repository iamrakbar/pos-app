import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useEarnings } from "@/hooks/db/use-earnings";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { COMPACT_LAYOUT_MAX_WIDTH, useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDate, formatDateTime, formatRupiah } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
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
import type { Translate } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

const DATE_RANGE_VALUES = [
  "last-7-days",
  "last-30-days",
  "this-week",
  "this-month",
  "custom",
] as const;

type DateRangeValue = (typeof DATE_RANGE_VALUES)[number];
type DateRangeOption = { value: DateRangeValue; label: string };
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
    label: formatDate(new Date(`${value}T00:00:00`), {
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
    return formatDate(to, { ...options, year: "numeric" });
  }
  return `${formatDate(from, options)} – ${formatDate(to, { ...options, year: "numeric" })}`;
}

function formatOrderType(value: string, t: Translate): string {
  const normalized = value.toLowerCase().replaceAll("_", "-");
  if (normalized === "dine-in" || normalized === "dinein") return t("orders.dineIn");
  if (normalized === "takeaway" || normalized === "take-away") return t("orders.takeaway");
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
  isSingleColumn,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof AppIcon>["name"];
  color: keyof typeof SUMMARY_STYLES;
  isSingleColumn: boolean;
}) {
  const style = SUMMARY_STYLES[color];
  const iconColor = useThemeColor(style.token);

  return (
    <Widget className={isSingleColumn ? "w-full" : "grow shrink basis-2/5 landscape:basis-1/5"}>
      <Widget.Header>
        <Widget.Title>{label}</Widget.Title>
        <View
          className={`size-9 items-center justify-center rounded-panel-inner ${style.background}`}
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
      locale="id-ID"
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
  const { t } = useTranslation();
  const { isPhonePortrait } = useOverlayPresentation();
  const pickerPresentation = isPhonePortrait ? "dialog" : "popover";

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("earnings.customDateRange")}
      description={t("earnings.customDateRangeDescription")}
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
            <Button.Label>{t("common.cancel")}</Button.Label>
          </Button>
          <Button
            size="sm"
            className={isPhonePortrait ? "w-full" : undefined}
            onPress={onApply}
            isDisabled={isApplying}
          >
            <Button.Label>{isApplying ? t("earnings.applying") : t("common.apply")}</Button.Label>
          </Button>
        </View>
      }
    >
      <View className="gap-4 px-5">
        <View className={isPhonePortrait ? "gap-4" : "flex-row flex-wrap items-start gap-4"}>
          <EarningsDatePicker
            label={t("earnings.from")}
            value={start}
            onValueChange={onStartChange}
            isInvalid={error !== null}
            presentation={pickerPresentation}
          />
          <EarningsDatePicker
            label={t("earnings.to")}
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
          <Description>{t("earnings.rangeGuidance")}</Description>
        )}
      </View>
    </AdaptiveFormOverlay>
  );
}

type OrderTypeSummary = {
  name: string;
  amount: number;
  count: number;
};

function OrderTypesWidget({
  orderTypes,
  totalEarnings,
  periodLabel,
  isCompact,
  accentColor,
}: {
  orderTypes: OrderTypeSummary[];
  totalEarnings: number;
  periodLabel: string;
  isCompact: boolean;
  accentColor: string;
}) {
  const { t } = useTranslation();
  return (
    <Widget>
      <Widget.Header>
        <View>
          <Widget.Title>{t("earnings.salesByOrderType")}</Widget.Title>
          <Widget.Description>{t("earnings.salesByOrderTypeDescription")}</Widget.Description>
        </View>
      </Widget.Header>
      <Widget.Content className="overflow-hidden p-0">
        {orderTypes.map((orderType, index) => {
          const share = totalEarnings > 0 ? orderType.amount / totalEarnings : 0;
          return (
            <View key={orderType.name}>
              <View className="gap-3 p-4">
                <View className={`gap-3 ${isCompact ? "items-start" : "flex-row items-center"}`}>
                  <View className="size-10 items-center justify-center rounded-panel-inner bg-accent-soft">
                    <AppIcon
                      name={
                        orderType.name === "Dine-in" ? "restaurant-outline" : "bag-handle-outline"
                      }
                      size={18}
                      color={accentColor}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Typography type="body-sm" weight="semibold">
                      {orderType.name}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {t(
                        orderType.count === 1
                          ? "earnings.orderShareOne"
                          : "earnings.orderShareOther",
                        { count: orderType.count, percent: Math.round(share * 100) }
                      )}
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
  );
}

function RecentEarningsWidget({
  entries,
  isCompact,
  successColor,
}: {
  entries: App.Data.Merchant.Earnings.EarningData[];
  isCompact: boolean;
  successColor: string;
}) {
  const { t } = useTranslation();
  return (
    <Widget>
      <Widget.Header>
        <View>
          <Widget.Title>{t("earnings.recent")}</Widget.Title>
          <Widget.Description>{t("earnings.recentDescription")}</Widget.Description>
        </View>
        <Widget.Legend>
          <Widget.LegendItem colorClassName="bg-success">{t("earnings.settled")}</Widget.LegendItem>
        </Widget.Legend>
      </Widget.Header>
      <Widget.Content className="overflow-hidden p-0">
        {entries.map((entry, index) => (
          <View key={entry.id}>
            <View className="flex-row gap-3 px-4 py-3.5">
              <View className="size-10 mt-1 items-center justify-center rounded-panel-inner bg-success-soft">
                <AppIcon name="checkmark" size={18} color={successColor} />
              </View>
              <View className={`flex-1 gap-3 ${isCompact ? "flex-col" : "flex-row"}`}>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
                      {entry.code}
                    </Typography>
                    <Chip color="success" size="sm" variant="soft">
                      <Chip.Label>{t("earnings.settled")}</Chip.Label>
                    </Chip>
                  </View>
                  <Typography type="body-xs" color="muted">
                    {formatOrderType(entry.order_type, t)} ·{" "}
                    {t(entry.items_count === 1 ? "orders.itemOne" : "orders.itemOther", {
                      count: entry.items_count,
                    })}{" "}
                    ·{" "}
                    {formatDateTime(entry.created_at, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </View>
                <View className="justify-center">
                  <Typography type="body-sm" weight="bold" className="tabular-nums">
                    {formatRupiah(entry.total_price)}
                  </Typography>
                </View>
              </View>
              {index < entries.length - 1 ? <Separator /> : null}
            </View>
          </View>
        ))}
      </Widget.Content>
    </Widget>
  );
}

export default function EarningsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const dateRangeOptions: DateRangeOption[] = DATE_RANGE_VALUES.map((value) => ({
    value,
    label: t(`earnings.ranges.${value}`),
  }));
  const { width, height, isCompact, horizontalPagePadding } = useResponsiveLayout();
  const isPhone = Math.min(width, height) <= COMPACT_LAYOUT_MAX_WIDTH;
  const { choicePresentation } = useOverlayPresentation();
  const { toast } = useToast();
  const [dateRangeValue, setDateRangeValue] = React.useState<DateRangeValue>("last-7-days");
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
      const name = formatOrderType(entry.order_type, t);
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
  const dateRange = dateRangeOptions.find((option) => option.value === dateRangeValue)!;
  const dateRangeLabel =
    dateRangeValue === "custom"
      ? `${toDateOption(dateFrom).label} – ${toDateOption(dateTo).label}`
      : dateRange.label;

  const handleRangeChange = (option: { value: string; label: string } | undefined) => {
    if (!option) return;
    const nextOption = dateRangeOptions.find((item) => item.value === option.value);
    if (!nextOption) return;

    setCustomRangeError(null);
    if (nextOption.value === "custom") {
      setIsCustomRangeOpen(true);
      return;
    }

    setDateRangeValue(nextOption.value);
    setAppliedRange(getPresetRange(nextOption.value));
  };

  const handleApplyCustomRange = () => {
    const start = new Date(`${customStart.value}T00:00:00`);
    const end = new Date(`${customEnd.value}T00:00:00`);
    const today = startOfToday();
    let rangeError: string | null = null;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      rangeError = t("earnings.errors.selectDates");
    } else if (start > end) {
      rangeError = t("earnings.errors.startAfterEnd");
    } else if (end > today) {
      rangeError = t("earnings.errors.future");
    } else {
      const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
      if (inclusiveDays > 366) rangeError = t("earnings.errors.tooLong");
    }

    setCustomRangeError(rangeError);
    if (rangeError) {
      toast.show({
        variant: "warning",
        label: t("earnings.errors.invalid"),
        description: rangeError,
      });
      return;
    }

    setDateRangeValue("custom");
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
          <View className="flex-col landscape:flex-row items-start landscape:items-center justify-between gap-3">
            <Typography type="body-sm">
              {t("earnings.settledSalesFor", { period: periodLabel })}
            </Typography>
            <Select
              presentation={choicePresentation}
              value={dateRange}
              onValueChange={handleRangeChange}
            >
              <Select.Trigger asChild variant="unstyled">
                <Button
                  size="sm"
                  variant="outline"
                  className={isCompact ? "min-w-40 bg-surface" : undefined}
                >
                  <Button.Label numberOfLines={1}>{dateRangeLabel}</Button.Label>
                  <Select.TriggerIndicator />
                </Button>
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content
                  presentation={choicePresentation}
                  width={choicePresentation === "popover" ? 200 : undefined}
                >
                  <Select.ListLabel>{t("earnings.dateRange")}</Select.ListLabel>
                  {dateRangeOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value} label={option.label} />
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>
          </View>

          {isLoading ? (
            <LoadingState message={t("earnings.loading")} />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <>
              <View className={isPhone ? "gap-4" : "flex-row flex-wrap gap-4"}>
                <SummaryWidget
                  label={t("earnings.settledEarnings")}
                  value={formatRupiah(totalEarnings)}
                  icon="wallet-outline"
                  color="success"
                  isSingleColumn={isPhone}
                />
                <SummaryWidget
                  label={t("earnings.settledOrders")}
                  value={String(data.length)}
                  icon="receipt-outline"
                  color="accent"
                  isSingleColumn={isPhone}
                />
                <SummaryWidget
                  label={t("earnings.averageOrder")}
                  value={formatRupiah(averageOrder)}
                  icon="analytics-outline"
                  color="warning"
                  isSingleColumn={isPhone}
                />
                <SummaryWidget
                  label={t("earnings.itemsSold")}
                  value={String(itemCount)}
                  icon="bag-handle-outline"
                  color="default"
                  isSingleColumn={isPhone}
                />
              </View>

              {data.length === 0 ? (
                <EmptyState className="py-16">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <AppIcon name="wallet-outline" size={20} color={mutedColor} />
                    </EmptyState.Media>
                    <EmptyState.Title>{t("earnings.empty")}</EmptyState.Title>
                    <EmptyState.Description>
                      {t("earnings.emptyDescription")}
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              ) : (
                <>
                  <OrderTypesWidget
                    orderTypes={orderTypes}
                    totalEarnings={totalEarnings}
                    periodLabel={periodLabel}
                    isCompact={isCompact}
                    accentColor={accentSoftForeground}
                  />
                  <RecentEarningsWidget
                    entries={recentEntries}
                    isCompact={isCompact}
                    successColor={successColor}
                  />
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

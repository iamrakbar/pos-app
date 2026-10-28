import {
  Typography,
  Separator,
  Card as PanelCard,
  Chip as PanelChip,
  EmptyState,
  Kpi,
  Typography as PanelTypography,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Skeleton as PanelListSkeleton,
  cn,
  DatePicker as PanelDatePicker,
  Label as PanelLabel,
  Button as PanelButton,
  Dialog as PanelDialog,
  Select as PanelSelect,
} from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
import { formatLocalDate, inclusiveLocalCalendarDays, parseLocalDate } from "@/utils/local-date";
import { useCSSVariable } from "uniwind";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useEarnings } from "@/hooks/db/use-earnings";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { COMPACT_LAYOUT_MAX_WIDTH, useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDate, formatDateTime, formatRupiah } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { getLocaleTag, type Translate } from "@/locales";
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

  return { dateFrom: formatLocalDate(from), dateTo: formatLocalDate(to) };
}

function toDateOption(value: string): { value: string; label: string } {
  return {
    value,
    label: formatDate(parseLocalDate(value), {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function formatPeriodLabel(dateFrom: string, dateTo: string): string {
  const from = parseLocalDate(dateFrom);
  const to = parseLocalDate(dateTo);
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
  start: string;
  end: string;
  onStartChange: (value: string | undefined) => void;
  onEndChange: (value: string | undefined) => void;
  error: string | null;
  onApply: () => void;
  onCancel: () => void;
  isApplying: boolean;
}) {
  const { locale, t } = useTranslation();
  const localeTag = getLocaleTag(locale);
  const { isPhonePortrait, sheetRef, handleDidDismiss } = useAdaptiveOverlayPresentation(
    isOpen,
    onOpenChange
  );
  const pickerPresentation = isPhonePortrait ? "bottom-sheet" : "popover";

  const footer = (
    <View
      className={cn(
        "gap-3 px-5 pb-5 pt-4",
        isPhonePortrait ? "items-stretch" : "flex-row justify-end"
      )}
    >
      <PanelButton
        variant="ghost"
        size="sm"
        className={isPhonePortrait ? "w-full" : undefined}
        onPress={onCancel}
      >
        {t("common.cancel")}
      </PanelButton>
      <PanelButton
        size="sm"
        className={isPhonePortrait ? "w-full" : undefined}
        onPress={onApply}
        disabled={isApplying}
      >
        {isApplying ? t("earnings.applying") : t("common.apply")}
      </PanelButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      <View className={isPhonePortrait ? "gap-4" : "flex-row flex-wrap items-start gap-4"}>
        {[
          { key: "start", label: t("earnings.from"), value: start, onChange: onStartChange },
          { key: "end", label: t("earnings.to"), value: end, onChange: onEndChange },
        ].map((field) => (
          <View key={field.key} className="min-w-55 flex-1 gap-1.5">
            <PanelLabel isRequired isInvalid={error !== null}>
              {field.label}
            </PanelLabel>
            <PanelDatePicker
              className="w-full"
              selected={field.value ? parseLocalDate(field.value) : undefined}
              onSelect={(date) => field.onChange(date ? formatLocalDate(date) : undefined)}
              format={(date) => (date ? toDateOption(formatLocalDate(date)).label : "")}
              presentation={pickerPresentation}
              maxDate={startOfToday()}
              weekStartsOn={1}
              locale={localeTag}
            />
          </View>
        ))}
      </View>
      {error ? (
        <Typography type="body-xs" className="text-destructive">
          {error}
        </Typography>
      ) : (
        <PanelTypography type="body-xs" muted>
          {t("earnings.rangeGuidance")}
        </PanelTypography>
      )}
    </View>
  );
  const title = t("earnings.customDateRange");
  const description = t("earnings.customDateRangeDescription");

  if (isPhonePortrait) {
    return (
      <TrueSheet
        ref={sheetRef}
        detents={[0.9]}
        scrollable
        cornerRadius={24}
        grabber
        dimmed
        onDidDismiss={handleDidDismiss}
        header={
          <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
            <Typography type="h4" weight="semibold">
              {title}
            </Typography>
            <Typography type="body-sm" muted>
              {description}
            </Typography>
            <PanelButton
              variant="ghost"
              size="sm"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3"
              onPress={() => onOpenChange(false)}
            >
              {t("common.close")}
            </PanelButton>
          </View>
        }
        footer={<View className="bg-surface">{footer}</View>}
      >
        {content}
      </TrueSheet>
    );
  }

  return (
    <PanelDialog open={isOpen} onOpenChange={onOpenChange}>
      <PanelDialog.Content
        dismissible={false}
        className="w-full max-w-lg self-center overflow-hidden p-0"
      >
        <PanelButton
          variant="ghost"
          size="sm"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => onOpenChange(false)}
        >
          {t("common.close")}
        </PanelButton>
        <View className="gap-1.5 px-5 pb-4 pr-14 pt-5">
          <PanelDialog.Title>{title}</PanelDialog.Title>
          <PanelDialog.Description>{description}</PanelDialog.Description>
        </View>
        {content}
        {footer}
      </PanelDialog.Content>
    </PanelDialog>
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
    <PanelCard>
      <PanelCard.Header>
        <View>
          <PanelCard.Title>{t("earnings.salesByOrderType")}</PanelCard.Title>
          <PanelCard.Description>{t("earnings.salesByOrderTypeDescription")}</PanelCard.Description>
        </View>
      </PanelCard.Header>
      <PanelCard.Content className="overflow-hidden p-0">
        {orderTypes.map((orderType, index) => {
          const share = totalEarnings > 0 ? orderType.amount / totalEarnings : 0;
          return (
            <View key={orderType.name}>
              <View className="gap-3 p-4">
                <View className={cn("gap-3", isCompact ? "items-start" : "flex-row items-center")}>
                  <View className="size-10 items-center justify-center rounded-xl bg-accent">
                    <AppIcon
                      icon={orderType.name === "Dine-in" ? AppIcons.restaurant : AppIcons.bag}
                      size={18}
                      color={accentColor}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Typography type="body-sm" weight="semibold">
                      {orderType.name}
                    </Typography>
                    <Typography type="body-xs" muted>
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
                <View className="h-1.5 overflow-hidden rounded-full bg-secondary">
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
      </PanelCard.Content>
      <PanelCard.Footer>
        <PanelCard.Description>{periodLabel}</PanelCard.Description>
      </PanelCard.Footer>
    </PanelCard>
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
    <PanelCard>
      <PanelCard.Header>
        <View>
          <PanelCard.Title>{t("earnings.recent")}</PanelCard.Title>
          <PanelCard.Description>{t("earnings.recentDescription")}</PanelCard.Description>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="size-2 rounded-full bg-success" />
          <PanelTypography type="body-xs" muted>
            {t("earnings.settled")}
          </PanelTypography>
        </View>
      </PanelCard.Header>
      <PanelCard.Content className="overflow-hidden p-0">
        {entries.map((entry, index) => (
          <View key={entry.id}>
            <View className="flex-row gap-3 px-4 py-3.5">
              <View className="size-10 mt-1 items-center justify-center rounded-xl bg-success-soft">
                <AppIcon icon={AppIcons.checkmark} size={18} color={successColor} />
              </View>
              <View className={cn("flex-1 gap-3", isCompact ? "flex-col" : "flex-row")}>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
                      {entry.code}
                    </Typography>
                    <PanelChip variant="success" size="sm">
                      <PanelChip.Label>{t("earnings.settled")}</PanelChip.Label>
                    </PanelChip>
                  </View>
                  <Typography type="body-xs" muted>
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
      </PanelCard.Content>
    </PanelCard>
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
  const [customStart, setCustomStart] = React.useState<string>(
    () => getPresetRange("last-7-days").dateFrom
  );
  const [customEnd, setCustomEnd] = React.useState<string>(
    () => getPresetRange("last-7-days").dateTo
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
  const mutedColor = useCSSVariable("--color-muted-foreground") as string;
  const [metricAccent, metricSuccess, metricWarning, metricDefault] = useCSSVariable([
    "--color-secondary-foreground",
    "--color-success-foreground",
    "--color-warning-foreground",
    "--color-foreground",
  ]) as [string, string, string, string];
  const successColor = useCSSVariable("--color-success") as string;
  const accentSoftForeground = useCSSVariable("--color-secondary-foreground") as string;

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

  const handleRangeChange = (value: string) => {
    const nextOption = dateRangeOptions.find((item) => item.value === value);
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
    const start = parseLocalDate(customStart);
    const end = parseLocalDate(customEnd);
    const today = startOfToday();
    let rangeError: string | null = null;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      rangeError = t("earnings.errors.selectDates");
    } else if (start > end) {
      rangeError = t("earnings.errors.startAfterEnd");
    } else if (end > today) {
      rangeError = t("earnings.errors.future");
    } else {
      const inclusiveDays = inclusiveLocalCalendarDays(start, end);
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
    setAppliedRange({ dateFrom: customStart, dateTo: customEnd });
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
            <PanelSelect
              presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
              value={dateRangeValue}
              valueLabel={dateRangeLabel}
              onValueChange={handleRangeChange}
              title={t("earnings.dateRange")}
              placeholder={t("earnings.dateRange")}
              size="sm"
              className={isCompact ? "min-w-40" : undefined}
            >
              {dateRangeOptions.map((option) => (
                <PanelSelect.Item key={option.value} value={option.value} label={option.label} />
              ))}
            </PanelSelect>
          </View>

          {isLoading ? (
            <View className="gap-px py-2" accessibilityRole="progressbar">
              {Array.from({ length: 5 }, (_, index) => (
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
                  <PanelErrorAlert.Description>
                    {getErrorMessage(error)}
                  </PanelErrorAlert.Description>
                </PanelErrorAlert.Content>
              </PanelErrorAlert>
              <PanelErrorButton variant="outline" onPress={() => void refetch()}>
                {t("common.retry")}
              </PanelErrorButton>
            </View>
          ) : (
            <>
              <View className={isPhone ? "gap-4" : "flex-row flex-wrap gap-4"}>
                <Kpi className={isPhone ? "w-full" : "grow shrink basis-2/5 landscape:basis-1/5"}>
                  <Kpi.Header>
                    <Kpi.Title>{t("earnings.settledEarnings")}</Kpi.Title>
                    <Kpi.Icon tone="good">
                      <AppIcon icon={AppIcons.wallet} size={18} color={metricSuccess} />
                    </Kpi.Icon>
                  </Kpi.Header>
                  <Kpi.Content>
                    <PanelTypography
                      type="h4"
                      weight="bold"
                      className="tabular-nums"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                    >
                      {formatRupiah(totalEarnings)}
                    </PanelTypography>
                  </Kpi.Content>
                </Kpi>
                <Kpi className={isPhone ? "w-full" : "grow shrink basis-2/5 landscape:basis-1/5"}>
                  <Kpi.Header>
                    <Kpi.Title>{t("earnings.settledOrders")}</Kpi.Title>
                    <Kpi.Icon tone="neutral">
                      <AppIcon icon={AppIcons.receipt} size={18} color={metricAccent} />
                    </Kpi.Icon>
                  </Kpi.Header>
                  <Kpi.Content>
                    <PanelTypography
                      type="h4"
                      weight="bold"
                      className="tabular-nums"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                    >
                      {String(data.length)}
                    </PanelTypography>
                  </Kpi.Content>
                </Kpi>
                <Kpi className={isPhone ? "w-full" : "grow shrink basis-2/5 landscape:basis-1/5"}>
                  <Kpi.Header>
                    <Kpi.Title>{t("earnings.averageOrder")}</Kpi.Title>
                    <Kpi.Icon tone="flat">
                      <AppIcon icon={AppIcons.analytics} size={18} color={metricWarning} />
                    </Kpi.Icon>
                  </Kpi.Header>
                  <Kpi.Content>
                    <PanelTypography
                      type="h4"
                      weight="bold"
                      className="tabular-nums"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                    >
                      {formatRupiah(averageOrder)}
                    </PanelTypography>
                  </Kpi.Content>
                </Kpi>
                <Kpi className={isPhone ? "w-full" : "grow shrink basis-2/5 landscape:basis-1/5"}>
                  <Kpi.Header>
                    <Kpi.Title>{t("earnings.itemsSold")}</Kpi.Title>
                    <Kpi.Icon tone="neutral">
                      <AppIcon icon={AppIcons.bag} size={18} color={metricDefault} />
                    </Kpi.Icon>
                  </Kpi.Header>
                  <Kpi.Content>
                    <PanelTypography
                      type="h4"
                      weight="bold"
                      className="tabular-nums"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                    >
                      {String(itemCount)}
                    </PanelTypography>
                  </Kpi.Content>
                </Kpi>
              </View>

              {data.length === 0 ? (
                <EmptyState className="py-16">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <AppIcon icon={AppIcons.wallet} size={20} color={mutedColor} />
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

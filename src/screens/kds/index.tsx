import {
  Surface,
  Typography,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Button as PanelButton,
  Chip as PanelChip,
  Skeleton as PanelListSkeleton,
  ScrollFade,
  EmptyState,
  cn,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { useKitchenTickets, useUpdateKitchenTicketStatus } from "@/hooks/db/use-kitchen-tickets";
import type { KitchenTicketData, KitchenTicketOrderType } from "@/api/endpoints/kitchen-tickets";
import { extractStatusValue, normalizeStatusColor } from "@/api/mappers/order";
import { statusChipVariant } from "@/utils/status-chip-variant";
import { getErrorMessage } from "@/api/api-error";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { formatTime } from "@/utils/format";
import React from "react";
import { FlatList, RefreshControl, useWindowDimensions, View } from "react-native";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { Stack } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";

type Lane = "all" | "queued" | "preparing" | "ready";
type ActionLane = Exclude<Lane, "all">;
const LANES: Lane[] = ["all", "queued", "preparing", "ready"];
const LANE_ACTION: Partial<Record<ActionLane, "start" | "ready">> = {
  queued: "start",
  preparing: "ready",
};
const ORDER_TYPE_FILTERS: readonly KitchenTicketOrderType[] = [
  "all",
  "dine-in",
  "takeaway",
  "delivery",
];
const KDS_STATUS_HEADER_BACKGROUNDS: Record<string, string> = {
  queued: "bg-warning-soft",
  preparing: "bg-accent",
  ready: "bg-surface",
  cancelled: "bg-destructive-soft",
};

function ticketStatus(ticket: KitchenTicketData): string {
  return extractStatusValue(ticket.status);
}

function orderTypeIcon(orderType: string) {
  if (orderType === "dine-in") return AppIcons.restaurant;
  if (orderType === "delivery") return AppIcons.bicycle;
  return AppIcons.bag;
}

function TicketCard({
  ticket,
  lane,
  onAction,
  isPending,
  error,
}: {
  ticket: KitchenTicketData;
  lane: Lane;
  onAction: () => void;
  isPending: boolean;
  error: unknown;
}) {
  const { t } = useTranslation();
  const [mutedColor] = useCSSVariable(["--color-muted-foreground"]) as [string];
  const primaryForegroundColor = useCSSVariable("--color-primary-foreground") as string;
  const order = ticket.order;
  const statusColor = normalizeStatusColor(ticket.status);
  const statusBackground = KDS_STATUS_HEADER_BACKGROUNDS[ticketStatus(ticket)] ?? "bg-secondary";
  const actionLane = lane === "all" ? ticketStatus(ticket) : lane;
  const action = LANE_ACTION[actionLane as ActionLane];

  return (
    <Surface className="w-full h-full gap-0 p-0">
      <View className={cn("flex-row items-start justify-between gap-3 p-4", statusBackground)}>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between">
            <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
              {order.code}
            </Typography>
            <PanelChip variant={statusChipVariant(statusColor)} size="sm">
              {t(`kds.status.${ticketStatus(ticket)}` as TranslationKey)}
            </PanelChip>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <AppIcon icon={orderTypeIcon(order.order_type)} size={12} color={mutedColor} />
              <Typography type="body-xs" muted>
                {t(order.products_count === 1 ? "orders.itemOne" : "orders.itemOther", {
                  count: order.products_count,
                })}
              </Typography>
            </View>
            <Typography type="body-xs" muted className="tabular-nums">
              {formatTime(ticket.created_at)}
            </Typography>
          </View>
        </View>
      </View>

      <ScrollFade className="flex-1">
        <ScrollView className="border-t border-border" showsVerticalScrollIndicator={false}>
          <View className="flex-1 p-4">
            {order.products.map((product) => (
              <View key={`${product.product_id}-${product.name}`} className="gap-1">
                <View className="flex-row items-start gap-2">
                  <Typography type="body-sm" weight="semibold" className="tabular-nums">
                    {product.qty}x
                  </Typography>
                  <Typography type="body-sm" weight="semibold" className="flex-1">
                    {product.name}
                  </Typography>
                </View>
                {product.add_ons.flatMap((addOn) =>
                  addOn.options.map((option) => (
                    <Typography
                      key={`${addOn.name}-${option.id}`}
                      type="body-xs"
                      muted
                      className="pl-6"
                    >
                      + {addOn.name}: {option.name}
                    </Typography>
                  ))
                )}
                {product.notes ? (
                  <Typography type="body-xs" muted className="pl-6 italic">
                    {t("orders.detail.note", { note: product.notes })}
                  </Typography>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollFade>

      {error ? (
        <Typography type="body-xs" className="text-destructive-foreground">
          {getErrorMessage(error)}
        </Typography>
      ) : null}

      {action ? (
        <View className="p-4">
          <PanelButton
            size="sm"
            onPress={onAction}
            disabled={isPending}
            startContent={
              <AppIcon
                icon={action === "start" ? AppIcons.play : AppIcons.checkmarkCircle}
                size={16}
                color={primaryForegroundColor}
              />
            }
          >
            {t(action === "start" ? "kds.start" : "kds.markReady")}
          </PanelButton>
        </View>
      ) : null}
    </Surface>
  );
}

export default function KdsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { isCompact, isMedium, horizontalPagePadding } = useResponsiveLayout();
  const { width } = useWindowDimensions();
  const mutedColor = useCSSVariable("--color-muted-foreground") as string;
  const gridColumns = isCompact ? 1 : isMedium ? 2 : 4;
  const gridGap = 12;
  const availableWidth = Math.max(width - horizontalPagePadding * 2, 0);
  const cardWidth = Math.max((availableWidth - gridGap * (gridColumns - 1)) / gridColumns, 0);
  const cardHeight = cardWidth * (4 / 3);
  const [activeLane, setActiveLane] = React.useState<Lane>(LANES[0]);
  const [orderTypeFilter, setOrderTypeFilter] = React.useState<KitchenTicketOrderType>("all");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isMountedRef = React.useRef(false);
  const isFetchingNextPageRef = React.useRef(false);
  const ticketsQuery = useKitchenTickets(orderTypeFilter);
  const updateStatus = useUpdateKitchenTicketStatus(orderTypeFilter);
  const tickets = ticketsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const ticketsByLane: Record<Lane, KitchenTicketData[]> = {
    all: [...tickets].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    queued: tickets
      .filter((ticket) => ticketStatus(ticket) === "queued")
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    preparing: tickets
      .filter((ticket) => ticketStatus(ticket) === "preparing")
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    ready: tickets
      .filter((ticket) => ticketStatus(ticket) === "ready")
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
  const activeTickets = ticketsByLane[activeLane];
  const handleAction = (ticketId: string, lane: Lane) => {
    const action = lane === "all" ? undefined : LANE_ACTION[lane];
    if (action) updateStatus.mutate({ id: ticketId, action });
  };
  const handleRefresh = () => {
    setIsRefreshing(true);
    void ticketsQuery.refetch().then(
      () => setIsRefreshing(false),
      () => setIsRefreshing(false)
    );
  };
  const handleEndReached = () => {
    if (
      !isMountedRef.current ||
      !ticketsQuery.hasNextPage ||
      ticketsQuery.isFetchingNextPage ||
      isFetchingNextPageRef.current
    ) {
      return;
    }

    isFetchingNextPageRef.current = true;
    void ticketsQuery.fetchNextPage().finally(() => {
      isFetchingNextPageRef.current = false;
    });
  };

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (ticketsQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="flex-1 flex-row flex-wrap content-start gap-y-4 py-6"
          style={{ paddingHorizontal: horizontalPagePadding, columnGap: gridGap }}
          accessibilityRole="progressbar"
        >
          {Array.from({ length: gridColumns * 2 }, (_, index) => (
            <View
              key={`loading-grid-${index}`}
              style={{
                width: Math.max(
                  0,
                  (width - horizontalPagePadding * 2 - gridGap * (gridColumns - 1)) / gridColumns
                ),
                aspectRatio: 3 / 4,
              }}
              className="overflow-hidden rounded-2xl"
            >
              <PanelListSkeleton className="h-full w-full rounded-2xl" />
            </View>
          ))}
        </View>
      </View>
    );
  }
  if (ticketsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(ticketsQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void ticketsQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={mutedColor}
          accessibilityLabel={t("kds.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {ORDER_TYPE_FILTERS.map((filter) => (
            <Stack.Toolbar.MenuAction
              key={filter}
              onPress={() => setOrderTypeFilter(filter)}
              isOn={orderTypeFilter === filter}
            >
              {filter === "all"
                ? t("kds.filters.all")
                : filter === "dine-in"
                  ? t("kds.filters.dineIn")
                  : filter === "takeaway"
                    ? t("kds.filters.takeaway")
                    : t("kds.filters.delivery")}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        <View className="w-full flex-1">
          <View className="w-full px-4 md:px-6">
            <View className="flex-row flex-wrap gap-2">
              {LANES.map((lane) => {
                const isActive = activeLane === lane;
                return (
                  <PanelChip
                    key={lane}
                    variant={isActive ? "primary" : "default"}
                    selected={isActive}
                    onPress={() => setActiveLane(lane)}
                    accessibilityLabel={t(`kds.${lane}` as TranslationKey)}
                  >
                    {lane === "all" ? t("common.all") : t(`kds.${lane}` as TranslationKey)}
                  </PanelChip>
                );
              })}
            </View>
          </View>
          <FlatList
            key={`kds-grid-${gridColumns}`}
            className="mt-3 flex-1"
            data={activeTickets}
            numColumns={gridColumns}
            keyExtractor={(ticket) => ticket.id}
            renderItem={({ item: ticket }) => (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={{ width: cardWidth, height: cardHeight }}
              >
                <TicketCard
                  ticket={ticket}
                  lane={activeLane}
                  onAction={() =>
                    handleAction(
                      ticket.id,
                      activeLane === "all" ? (ticketStatus(ticket) as Lane) : activeLane
                    )
                  }
                  isPending={updateStatus.isPending && updateStatus.variables?.id === ticket.id}
                  error={
                    updateStatus.isError && updateStatus.variables?.id === ticket.id
                      ? updateStatus.error
                      : null
                  }
                />
              </Animated.View>
            )}
            contentContainerClassName={cn(
              "gap-3 pb-10 pt-4 px-4 md:px-6",
              activeTickets.length === 0 && "flex-grow"
            )}
            columnWrapperStyle={gridColumns > 1 ? { gap: gridGap } : undefined}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            onEndReachedThreshold={0.5}
            onEndReached={handleEndReached}
            ListFooterComponent={
              ticketsQuery.isFetchingNextPage ? (
                <View className="gap-px py-2" accessibilityRole="progressbar">
                  {Array.from({ length: 1 }, (_, index) => (
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
              ) : null
            }
            ListEmptyComponent={
              <View className="w-full">
                {tickets.length === 0 || activeLane === "all" ? (
                  <EmptyState className="self-center w-full max-w-sm py-20">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.flame} size={20} color={mutedColor} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("kds.empty")}</EmptyState.Title>
                      <EmptyState.Description>{t("kds.emptyDescription")}</EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  <EmptyState className="self-center w-full max-w-sm py-20">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.flame} size={20} color={mutedColor} />
                      </EmptyState.Media>
                      <EmptyState.Title>
                        {t(`kds.laneEmpty.${activeLane}.title` as TranslationKey)}
                      </EmptyState.Title>
                      <EmptyState.Description>
                        {t(`kds.laneEmpty.${activeLane}.description` as TranslationKey)}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </>
  );
}

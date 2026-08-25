import { useKitchenTickets, useUpdateKitchenTicketStatus } from "@/hooks/db/use-kitchen-tickets";
import type { KitchenTicketData, KitchenTicketOrderType } from "@/api/endpoints/kitchen-tickets";
import { extractStatusValue, normalizeStatusColor } from "@/api/mappers/order";
import { getErrorMessage } from "@/api/api-error";
import AppIcon from "@/components/common/app-icon";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { formatTime } from "@/utils/format";
import { EmptyState } from "heroui-native-pro";
import { Button, Chip, ScrollShadow, Surface, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, RefreshControl, useWindowDimensions, View } from "react-native";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { Stack } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";

type Lane = "queued" | "preparing" | "ready";
const LANES: Lane[] = ["queued", "preparing", "ready"];
const LANE_ACTION: Partial<Record<Lane, "start" | "ready">> = {
  queued: "start",
  preparing: "ready",
};
const ORDER_TYPE_FILTERS: readonly KitchenTicketOrderType[] = [
  "all",
  "dine-in",
  "takeaway",
  "delivery",
];

function ticketStatus(ticket: KitchenTicketData): string {
  return extractStatusValue(ticket.status);
}

function orderTypeIcon(orderType: string) {
  if (orderType === "dine-in") return "restaurant-outline" as const;
  if (orderType === "delivery") return "bicycle-outline" as const;
  return "bag-handle-outline" as const;
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
  const mutedColor = useThemeColor("muted");
  const order = ticket.order;

  return (
    <Surface className="w-full h-full gap-3 p-0">
      <View className="flex-row items-start justify-between gap-3 px-4 pt-4">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
              {order.code}
            </Typography>
            <Chip color={normalizeStatusColor(ticket.status)} size="sm" variant="soft">
              <Chip.Label>{t(`kds.status.${ticketStatus(ticket)}` as TranslationKey)}</Chip.Label>
            </Chip>
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppIcon name={orderTypeIcon(order.order_type)} size={12} color={mutedColor} />
            <Typography type="body-xs" color="muted">
              {t(order.products_count === 1 ? "orders.itemOne" : "orders.itemOther", {
                count: order.products_count,
              })}
            </Typography>
          </View>
        </View>
        <Typography type="body-xs" color="muted" className="tabular-nums">
          {formatTime(ticket.created_at)}
        </Typography>
      </View>

      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
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
                      color="muted"
                      className="pl-6"
                    >
                      + {addOn.name}: {option.name}
                    </Typography>
                  ))
                )}
                {product.notes ? (
                  <Typography type="body-xs" color="muted" className="pl-6 italic">
                    {t("orders.detail.note", { note: product.notes })}
                  </Typography>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollShadow>

      {error ? (
        <Typography type="body-xs" className="text-danger">
          {getErrorMessage(error)}
        </Typography>
      ) : null}

      {lane !== "ready" ? (
        <View className="p-4">
          <Button onPress={onAction} isDisabled={isPending}>
            <AppIcon
              name={lane === "queued" ? "play-outline" : "checkmark-circle-outline"}
              size={16}
              color="white"
            />
            <Button.Label className="ml-1.5">
              {t(lane === "queued" ? "kds.start" : "kds.markReady")}
            </Button.Label>
          </Button>
        </View>
      ) : null}
    </Surface>
  );
}

export default function KdsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { isCompact, isMedium, horizontalPagePadding } = useResponsiveLayout();
  const { width } = useWindowDimensions();
  const mutedColor = useThemeColor("muted");
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
    const action = LANE_ACTION[lane];
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

  if (ticketsQuery.isLoading) return <LoadingState message={t("kds.loading")} />;
  if (ticketsQuery.isError) {
    return <ErrorState error={ticketsQuery.error} onRetry={ticketsQuery.refetch} />;
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
                  <Chip
                    key={lane}
                    variant={isActive ? "primary" : "soft"}
                    color={isActive ? "accent" : "default"}
                    onPress={() => setActiveLane(lane)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={t(`kds.${lane}` as TranslationKey)}
                  >
                    <Chip.Label>{t(`kds.${lane}` as TranslationKey)}</Chip.Label>
                  </Chip>
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
                  onAction={() => handleAction(ticket.id, activeLane)}
                  isPending={updateStatus.isPending && updateStatus.variables?.id === ticket.id}
                  error={
                    updateStatus.isError && updateStatus.variables?.id === ticket.id
                      ? updateStatus.error
                      : null
                  }
                />
              </Animated.View>
            )}
            contentContainerClassName={`gap-3 pb-10 pt-4 px-4 md:px-6 ${
              activeTickets.length === 0 ? "flex-grow" : ""
            }`}
            columnWrapperStyle={gridColumns > 1 ? { gap: gridGap } : undefined}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            onEndReachedThreshold={0.5}
            onEndReached={handleEndReached}
            ListFooterComponent={ticketsQuery.isFetchingNextPage ? <LoadingState /> : null}
            ListEmptyComponent={
              <View className="w-full">
                {tickets.length === 0 ? (
                  <EmptyState className="self-center w-full max-w-sm py-20">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon name="flame-outline" size={20} color={mutedColor} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("kds.empty")}</EmptyState.Title>
                      <EmptyState.Description>{t("kds.emptyDescription")}</EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  <EmptyState className="self-center w-full max-w-sm py-20">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon name="flame-outline" size={20} color={mutedColor} />
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

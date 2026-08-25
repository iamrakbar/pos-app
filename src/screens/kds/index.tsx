import { useKitchenTickets, useUpdateKitchenTicketStatus } from "@/hooks/db/use-kitchen-tickets";
import { normalizeStatusColor } from "@/api/mappers/order";
import LoadingState from "@/components/common/loading-state";
import ErrorState from "@/components/common/error-state";
import AppIcon from "@/components/common/app-icon";
import { getErrorMessage } from "@/api/api-error";
import { formatTime } from "@/utils/format";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { EmptyState } from "heroui-native-pro";
import { Button, Chip, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import { RefreshControl, ScrollView, View } from "react-native";
import type { TranslationKey } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import type { KitchenTicketData } from "@/api/endpoints/kitchen-tickets";

type Lane = "queued" | "preparing";

const LANES: Lane[] = ["queued", "preparing"];

const LANE_ACTION: Record<Lane, "start" | "ready"> = {
  queued: "start",
  preparing: "ready",
};

function orderTypeIcon(orderType: string) {
  if (orderType === "dine-in") return "restaurant-outline" as const;
  if (orderType === "delivery") return "bicycle-outline" as const;
  return "bag-handle-outline" as const;
}

function KitchenTicketCard({
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
  const themeColorMuted = useThemeColor("muted");
  const order = ticket.order;

  return (
    <Surface className="w-full gap-3 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="gap-0.5">
          <View className="flex-row items-center gap-2">
            <Typography type="body-sm" weight="semibold" className="font-mono tabular-nums">
              {order.code}
            </Typography>
            <Chip color={normalizeStatusColor(ticket.status)} size="sm" variant="soft">
              <Chip.Label>{t(`kds.status.${ticket.status.value}` as TranslationKey)}</Chip.Label>
            </Chip>
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppIcon name={orderTypeIcon(order.order_type)} size={12} color={themeColorMuted} />
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

      <Separator />

      <View className="gap-2.5">
        {order.products.map((product, index) => (
          <View key={`${product.product_id}-${index}`} className="gap-1">
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
                  key={`${addOn.id}-${option.id}`}
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

      {error ? (
        <Typography type="body-xs" className="text-danger">
          {getErrorMessage(error)}
        </Typography>
      ) : null}

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
    </Surface>
  );
}

function KitchenLane({
  lane,
  tickets,
  onAction,
  pendingId,
  pendingAction,
  error,
}: {
  lane: Lane;
  tickets: KitchenTicketData[];
  onAction: (ticketId: string) => void;
  pendingId?: string;
  pendingAction?: "start" | "ready";
  error: unknown;
}) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 gap-3">
      <View className="flex-row items-center gap-2">
        <Typography type="body-sm" weight="semibold">
          {t(`kds.${lane}` as TranslationKey)}
        </Typography>
        <Chip size="sm" variant="soft">
          <Chip.Label>{tickets.length}</Chip.Label>
        </Chip>
      </View>
      {tickets.length === 0 ? (
        <Surface className="w-full p-4">
          <Typography type="body-xs" color="muted">
            {t("kds.laneEmpty")}
          </Typography>
        </Surface>
      ) : (
        <View className="gap-3">
          {tickets.map((ticket) => (
            <KitchenTicketCard
              key={ticket.id}
              ticket={ticket}
              lane={lane}
              onAction={() => onAction(ticket.id)}
              isPending={pendingId === ticket.id && pendingAction === LANE_ACTION[lane]}
              error={pendingId === ticket.id ? error : null}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function KdsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const themeColorMuted = useThemeColor("muted");
  const { data: tickets, isLoading, isError, error, refetch, isRefetching } = useKitchenTickets();
  const updateStatus = useUpdateKitchenTicketStatus();

  const ticketsByLane: Record<Lane, KitchenTicketData[]> = {
    queued: tickets?.filter((ticket) => ticket.status.value === "queued") ?? [],
    preparing: tickets?.filter((ticket) => ticket.status.value === "preparing") ?? [],
  };
  const hasTickets = ticketsByLane.queued.length + ticketsByLane.preparing.length > 0;

  const handleAction = (ticketId: string, lane: Lane) => {
    updateStatus.mutate({ id: ticketId, action: LANE_ACTION[lane] });
  };

  if (isLoading) return <LoadingState message={t("kds.loading")} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 pb-10 md:px-6"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="w-full max-w-5xl self-center">
          {!hasTickets ? (
            <EmptyState className="py-20">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <AppIcon name="flame-outline" size={20} color={themeColorMuted} />
                </EmptyState.Media>
                <EmptyState.Title>{t("kds.empty")}</EmptyState.Title>
                <EmptyState.Description>{t("kds.emptyDescription")}</EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            <View className={isCompact ? "gap-6" : "flex-row items-start gap-6"}>
              {LANES.map((lane) => (
                <KitchenLane
                  key={lane}
                  lane={lane}
                  tickets={ticketsByLane[lane]}
                  onAction={(ticketId) => handleAction(ticketId, lane)}
                  pendingId={updateStatus.variables?.id}
                  pendingAction={updateStatus.variables?.action}
                  error={updateStatus.isError ? updateStatus.error : null}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

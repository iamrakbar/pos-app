import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  getKitchenTickets,
  updateKitchenTicketStatus,
  type KitchenTicketsPage,
  type KitchenTicketOrderType,
} from "@/api/endpoints/kitchen-tickets";
import { useAuth } from "@/stores/use-auth";

const KDS_POLL_INTERVAL_MS = 10_000;
const KDS_PAGE_SIZE = 8;
const kitchenTicketKeys = {
  all: (merchantId: string | null) => ["kitchen-tickets", merchantId] as const,
  list: (merchantId: string | null, orderType: KitchenTicketOrderType) =>
    ["kitchen-tickets", merchantId, orderType] as const,
};

type KitchenAction = "start" | "ready";
const NEXT_STATUS: Record<KitchenAction, string> = {
  start: "preparing",
  ready: "ready",
};

export function useKitchenTickets(orderType: KitchenTicketOrderType = "all") {
  const merchantId = useAuth((state) => state.merchantId);
  return useInfiniteQuery({
    queryKey: kitchenTicketKeys.list(merchantId, orderType),
    queryFn: ({ pageParam }) =>
      getKitchenTickets(merchantId!, {
        orderType: orderType === "all" ? undefined : orderType,
        perPage: KDS_PAGE_SIZE,
        page: pageParam,
      }),
    enabled: !!merchantId,
    refetchInterval: KDS_POLL_INTERVAL_MS,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta || lastPage.meta.current_page >= lastPage.meta.last_page) {
        return undefined;
      }
      return lastPage.meta.current_page + 1;
    },
  });
}

export function useUpdateKitchenTicketStatus(orderType: KitchenTicketOrderType = "all") {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["kitchen-ticket-status", merchantId],
    mutationFn: ({ id, action }: { id: string; action: KitchenAction }) =>
      updateKitchenTicketStatus(merchantId!, id, { status: action }),
    onMutate: async ({ id, action }) => {
      const queryKey = kitchenTicketKeys.list(merchantId, orderType);
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<InfiniteData<KitchenTicketsPage>>(queryKey);
      const previousTicket = previousData?.pages
        .flatMap((page) => page.data)
        .find((ticket) => ticket.id === id);

      queryClient.setQueryData<InfiniteData<KitchenTicketsPage>>(queryKey, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                data: page.data.map((ticket) =>
                  ticket.id === id
                    ? { ...ticket, status: { ...ticket.status, value: NEXT_STATUS[action] } }
                    : ticket
                ),
              })),
            }
          : data
      );

      return { previousTicket, orderId: previousTicket?.order.id };
    },
    onError: (_error, { id }, context) => {
      if (!context?.previousTicket) return;

      queryClient.setQueryData<InfiniteData<KitchenTicketsPage>>(
        kitchenTicketKeys.list(merchantId, orderType),
        (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  data: page.data.map((ticket) =>
                    ticket.id === id ? context.previousTicket! : ticket
                  ),
                })),
              }
            : data
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      // Wait for the last concurrent status update before refetching. Otherwise
      // an earlier settlement could replace another ticket's optimistic state.
      if (queryClient.isMutating({ mutationKey: ["kitchen-ticket-status", merchantId] }) !== 1) {
        return;
      }

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: kitchenTicketKeys.all(merchantId) }),
        queryClient.invalidateQueries({ queryKey: ["orders", merchantId] }),
        context?.orderId
          ? queryClient.invalidateQueries({ queryKey: ["order", merchantId, context.orderId] })
          : Promise.resolve(),
      ]);
    },
  });
}

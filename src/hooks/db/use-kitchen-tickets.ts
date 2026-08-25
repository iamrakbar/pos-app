import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getKitchenTickets,
  updateKitchenTicketStatus,
  type KitchenTicketData,
} from "@/api/endpoints/kitchen-tickets";
import { useAuth } from "@/stores/use-auth";

const KDS_POLL_INTERVAL_MS = 10_000;

const kitchenTicketKeys = {
  all: (merchantId: string | null) => ["kitchen-tickets", merchantId] as const,
};

const NEXT_STATUS_VALUE: Record<"start" | "ready", string> = {
  start: "preparing",
  ready: "ready",
};

export function useKitchenTickets() {
  const merchantId = useAuth((s) => s.merchantId);
  return useQuery({
    queryKey: kitchenTicketKeys.all(merchantId),
    queryFn: async () => (await getKitchenTickets(merchantId!)).data,
    enabled: !!merchantId,
    refetchInterval: KDS_POLL_INTERVAL_MS,
  });
}

export function useUpdateKitchenTicketStatus() {
  const merchantId = useAuth((s) => s.merchantId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "start" | "ready" }) =>
      updateKitchenTicketStatus(merchantId!, id, { status: action }),
    onMutate: async ({ id, action }) => {
      const queryKey = kitchenTicketKeys.all(merchantId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<KitchenTicketData[]>(queryKey);
      queryClient.setQueryData<KitchenTicketData[]>(queryKey, (tickets) =>
        tickets?.map((ticket) =>
          ticket.id === id
            ? { ...ticket, status: { ...ticket.status, value: NEXT_STATUS_VALUE[action] } }
            : ticket
        )
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(kitchenTicketKeys.all(merchantId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: kitchenTicketKeys.all(merchantId) });
    },
  });
}

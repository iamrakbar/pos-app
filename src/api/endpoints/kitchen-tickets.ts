import { apiRequest } from "../client";

export type KitchenTicketData = App.Data.Merchant.Order.KitchenTicketData;
export type KitchenTicketOrderType = "all" | "dine-in" | "takeaway" | "delivery";

type KitchenTicketResponse = { data: KitchenTicketData };
export type KitchenTicketsPage = {
  data: KitchenTicketData[];
  meta?: {
    current_page: number;
    last_page: number;
  };
};
type KitchenTicketsPayload =
  KitchenTicketData[] | { data?: KitchenTicketData[]; meta?: KitchenTicketsPage["meta"] };

export type UpdateKitchenTicketStatusRequest = {
  status: "start" | "ready";
};

function normalizeKitchenTickets(payload: KitchenTicketsPayload): KitchenTicketData[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function getKitchenTickets(
  merchantId: string,
  filters?: {
    orderType?: Exclude<KitchenTicketOrderType, "all">;
    perPage?: number;
    page?: number;
  }
): Promise<KitchenTicketsPage> {
  const response = await apiRequest<{
    data?: KitchenTicketsPayload;
    meta?: KitchenTicketsPage["meta"];
  }>(`/${merchantId}/kitchen-tickets`, {
    query: {
      "filter[order_type]": filters?.orderType,
      per_page: filters?.perPage ?? 8,
      page: filters?.page,
    },
  });
  const payload = response.data ?? [];
  return {
    data: normalizeKitchenTickets(payload),
    meta: response.meta ?? (Array.isArray(payload) ? undefined : payload.meta),
  };
}

export function updateKitchenTicketStatus(
  merchantId: string,
  ticketId: string,
  body: UpdateKitchenTicketStatusRequest
): Promise<KitchenTicketResponse> {
  return apiRequest<KitchenTicketResponse>(`/${merchantId}/kitchen-tickets/${ticketId}/status`, {
    method: "PATCH",
    body,
  });
}

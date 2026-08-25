import { apiRequest } from "../client";

export type KitchenTicketData = App.Data.Merchant.Order.KitchenTicketData;

type KitchenTicketResponse = { data: KitchenTicketData };
type KitchenTicketsResponse = { data: KitchenTicketData[] };

export type UpdateKitchenTicketStatusRequest = {
  status: "start" | "ready";
};

export function getKitchenTickets(merchantId: string): Promise<KitchenTicketsResponse> {
  return apiRequest<KitchenTicketsResponse>(`/${merchantId}/kitchen-tickets`);
}

export function getKitchenTicket(
  merchantId: string,
  ticketId: string
): Promise<KitchenTicketResponse> {
  return apiRequest<KitchenTicketResponse>(`/${merchantId}/kitchen-tickets/${ticketId}`);
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

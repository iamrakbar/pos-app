import { apiRequest } from '../client';

type OrderResponse = { data: App.Data.Merchant.Order.OrderData };
type OrdersResponse = {
    data: App.Data.Merchant.Order.OrderListData[];
    meta?: { current_page: number; last_page: number; per_page: number; total: number };
    links?: unknown;
};
type PaymentStatusResponse = { data: App.Data.Merchant.Order.PaymentStatusData };

export function getOrder(orderId: string): Promise<OrderResponse> {
    return apiRequest<OrderResponse>(`/orders/${orderId}`);
}

export function getOrders(params?: {
    status?: string;
    per_page?: number;
    page?: number;
}): Promise<OrdersResponse> {
    return apiRequest<OrdersResponse>('/orders', {
        query: { status: params?.status, per_page: params?.per_page, page: params?.page },
    });
}

export function getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    return apiRequest<PaymentStatusResponse>(`/orders/${orderId}/payment-status`);
}

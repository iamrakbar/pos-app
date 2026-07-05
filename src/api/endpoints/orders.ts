import { apiRequest } from '../client';

export type MerchantOrderData = App.Data.Merchant.Order.OrderData;

type OrderResponse = { data: MerchantOrderData };
type OrdersResponse = {
    data: App.Data.Merchant.Order.OrderListData[];
    meta?: { current_page: number; last_page: number; per_page: number; total: number };
    links?: unknown;
};
type PaymentStatusResponse = { data: App.Data.Merchant.Order.PaymentStatusData };
type UpdateOrderStatusResponse = { data: App.Data.Merchant.Order.OrderStatusData };

export function getOrder(orderId: string): Promise<OrderResponse> {
    return apiRequest<OrderResponse>(`/orders/${orderId}`);
}

export function getOrders(params?: {
    order_status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort?: string;
    per_page?: number;
    page?: number;
}): Promise<OrdersResponse> {
    return apiRequest<OrdersResponse>('/orders', {
        query: {
            'filter[order_status]': params?.order_status,
            'filter[search]': params?.search,
            'filter[date_from]': params?.date_from,
            'filter[date_to]': params?.date_to,
            sort: params?.sort ?? '-created_at',
            per_page: params?.per_page,
            page: params?.page,
        },
    });
}

export function getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    return apiRequest<PaymentStatusResponse>(`/orders/${orderId}/payment-status`);
}

export function updateOrderStatus(
    orderId: string,
    body: App.Requests.Merchant.Order.UpdateOrderStatusRequest
): Promise<UpdateOrderStatusResponse> {
    return apiRequest<UpdateOrderStatusResponse>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body,
    });
}

import { apiRequest } from '../client';

type PaymentGroupsResponse = {
    data: App.Data.Customer.Payment.PaymentGroupData[];
};

export function getPaymentGroups(): Promise<PaymentGroupsResponse> {
    return apiRequest<PaymentGroupsResponse>('/customer/payments', { root: true });
}

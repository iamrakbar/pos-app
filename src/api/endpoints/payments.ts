import { apiRequest } from '../client';

type PaymentGroupsResponse = {
    success: boolean;
    data: App.Data.Customer.Payment.PaymentGroupData[];
};

export function getPaymentGroups(groupType?: string): Promise<PaymentGroupsResponse> {
    return apiRequest<PaymentGroupsResponse>('/payments', { query: { group_type: groupType } });
}

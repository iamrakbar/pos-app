import { apiRequest } from "../client";

export type MerchantPayment = App.Data.Merchant.Payment.MerchantPaymentData;
export type PaymentGroup = App.Requests.Merchant.PaymentGroupEnum;

type MerchantPaymentsResponse = {
  success: boolean;
  data: MerchantPayment[];
};

export function getPOSPayments(
  merchantId: string,
  groupType?: PaymentGroup
): Promise<MerchantPaymentsResponse> {
  return apiRequest<MerchantPaymentsResponse>(`/${merchantId}/pos/payments`, {
    query: { group_type: groupType },
  });
}

export function getMerchantPayments(merchantId: string): Promise<MerchantPaymentsResponse> {
  return apiRequest<MerchantPaymentsResponse>(`/${merchantId}/payments`);
}

export function updateMerchantPayment(
  merchantId: string,
  paymentId: string,
  body: App.Requests.Merchant.Payment.UpdateMerchantPaymentRequest
): Promise<{ success: boolean; data: MerchantPayment }> {
  return apiRequest(`/${merchantId}/payments/${paymentId}`, { method: "PUT", body });
}

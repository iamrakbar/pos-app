import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMerchantPayments,
  getPOSPayments,
  updateMerchantPayment,
  type MerchantPayment,
} from "@/api/endpoints/payments";
import { useAuth } from "@/stores/use-auth";
import type { POSPaymentGroup } from "@/types/pos";

const PAYMENTS_STALE_TIME_MS = 30 * 60 * 1000;
const PAYMENTS_GC_TIME_MS = 24 * 60 * 60 * 1000;

export const paymentQueryKeys = {
  all: (merchantId: string) => ["merchants", merchantId, "payments"] as const,
  pos: (merchantId: string) => [...paymentQueryKeys.all(merchantId), "pos"] as const,
  settings: (merchantId: string) => [...paymentQueryKeys.all(merchantId), "settings"] as const,
};

function groupPOSPayments(payments: MerchantPayment[]): POSPaymentGroup[] {
  const groups = new Map<string, POSPaymentGroup>();
  for (const payment of [...payments].sort((a, b) => a.sort - b.sort)) {
    const { group: paymentGroup } = payment;
    const group = groups.get(paymentGroup.value) ?? {
      group_type: paymentGroup.value,
      group_label: paymentGroup.label,
      payments: [],
    };
    group.payments.push({
      id: payment.id,
      merchant_payment_id: payment.merchant_payment_id,
      code: payment.code,
      name: payment.name,
      image: payment.image,
      fee_unit: payment.fees.unit,
      fee_value: payment.fees.total_fee,
      provider: payment.provider,
      tender_input: payment.tender_input,
      processing_mode: payment.processing_mode,
      sort: payment.sort,
      is_active: payment.is_active,
    });
    groups.set(paymentGroup.value, group);
  }
  return [...groups.values()];
}

export function paymentGroupsQueryOptions(merchantId: string) {
  return queryOptions({
    queryKey: paymentQueryKeys.pos(merchantId),
    queryFn: async () => groupPOSPayments((await getPOSPayments(merchantId)).data),
    enabled: Boolean(merchantId),
    staleTime: PAYMENTS_STALE_TIME_MS,
    gcTime: PAYMENTS_GC_TIME_MS,
  });
}

export function merchantPaymentsQueryOptions(merchantId: string) {
  return queryOptions({
    queryKey: paymentQueryKeys.settings(merchantId),
    queryFn: async () => (await getMerchantPayments(merchantId)).data,
    enabled: Boolean(merchantId),
  });
}

export function usePaymentGroups() {
  const merchantId = useAuth((state) => state.merchantId) ?? "";
  return useQuery(paymentGroupsQueryOptions(merchantId));
}

export function useMerchantPayments() {
  const merchantId = useAuth((state) => state.merchantId) ?? "";
  return useQuery(merchantPaymentsQueryOptions(merchantId));
}

export function useReorderMerchantPayments() {
  const merchantId = useAuth((state) => state.merchantId) ?? "";
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payments: MerchantPayment[]) => {
      const saved = payments.map((payment, index) => ({ ...payment, sort: index }));
      await Promise.all(
        saved.map((payment) =>
          updateMerchantPayment(merchantId, payment.id, {
            active: payment.is_active,
            sort: payment.sort,
          }),
        ),
      );
      return saved;
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(paymentQueryKeys.settings(merchantId), saved);
      await queryClient.invalidateQueries({ queryKey: paymentQueryKeys.pos(merchantId) });
    },
  });
}

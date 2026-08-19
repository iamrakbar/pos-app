import {
  getMerchantProfile,
  updateMerchantProfile,
  uploadMerchantCover,
  uploadMerchantLogo,
  type MerchantImageAsset,
} from "@/api/endpoints/merchant";
import { useAuth } from "@/stores/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const MERCHANT_PROFILE_STALE_TIME_MS = 5 * 60 * 1000;

function merchantProfileKey(merchantId: string | null | undefined) {
  return ["merchant-profile", merchantId] as const;
}

export function useMerchantProfile() {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: merchantProfileKey(merchantId),
    queryFn: async () => {
      const response = await getMerchantProfile(merchantId!);
      return response.data;
    },
    enabled: !!merchantId,
    staleTime: MERCHANT_PROFILE_STALE_TIME_MS,
  });
}

export function useUpdateMerchantProfile() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  const updateActiveMerchant = useAuth((state) => state.updateActiveMerchant);

  return useMutation({
    mutationFn: async (body: App.Requests.Merchant.Profile.UpdateMerchantProfileRequest) =>
      (await updateMerchantProfile(merchantId!, body)).data,
    onSuccess: (profile) => {
      queryClient.setQueryData(merchantProfileKey(merchantId), profile);
      updateActiveMerchant({
        tax_is_enable: profile.tax_is_enable,
        tax_name: profile.tax_name,
        tax_value: profile.tax_value,
        charge_app_payment_fee_to_customer: profile.charge_app_payment_fee_to_customer,
      });
    },
  });
}

export function useUploadMerchantLogo() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: MerchantImageAsset) =>
      (await uploadMerchantLogo(merchantId!, image)).data,
    onSuccess: (profile) => {
      queryClient.setQueryData(merchantProfileKey(merchantId), profile);
    },
  });
}

export function useUploadMerchantCover() {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: MerchantImageAsset) =>
      (await uploadMerchantCover(merchantId!, image)).data,
    onSuccess: (profile) => {
      queryClient.setQueryData(merchantProfileKey(merchantId), profile);
    },
  });
}

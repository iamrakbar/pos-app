import { getMerchantProfile } from "@/api/endpoints/merchant";
import { useAuth } from "@/stores/useAuth";
import { useQuery } from "@tanstack/react-query";

const MERCHANT_PROFILE_STALE_TIME_MS = 5 * 60 * 1000;

export function useMerchantProfile() {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: ["merchant-profile", merchantId],
    queryFn: async () => {
      const response = await getMerchantProfile(merchantId!);
      return response.data;
    },
    enabled: !!merchantId,
    staleTime: MERCHANT_PROFILE_STALE_TIME_MS,
  });
}

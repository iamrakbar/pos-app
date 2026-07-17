import { apiRequest } from "../client";

type MerchantProfileResponse = {
  success: boolean;
  data: App.Data.Merchant.Profile.MerchantProfileData;
};

export function getMerchantProfile(merchantId: string): Promise<MerchantProfileResponse> {
  return apiRequest<MerchantProfileResponse>(`/${merchantId}`);
}

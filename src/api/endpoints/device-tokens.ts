import { apiRequest } from "../client";

export type DeviceTokenResponse = {
  success: boolean;
  data: {
    id: string;
  };
};

export function registerDeviceToken(
  body: App.Requests.Merchant.StoreDeviceTokenRequest
): Promise<DeviceTokenResponse> {
  return apiRequest<DeviceTokenResponse>("/device-tokens", {
    method: "POST",
    body,
  });
}

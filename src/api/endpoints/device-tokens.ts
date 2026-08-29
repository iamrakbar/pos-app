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

export function unregisterDeviceToken(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/device-tokens/${id}`, {
    method: "DELETE",
  });
}

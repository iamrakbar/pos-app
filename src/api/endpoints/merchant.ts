import { File } from "expo-file-system";
import { Platform } from "react-native";
import { apiRequest } from "../client";

type MerchantProfileResponse = {
  success: boolean;
  data: App.Data.Merchant.Profile.MerchantProfileData;
};

export type MerchantImageAsset = { uri: string; name: string; type: string };

export function getMerchantProfile(merchantId: string): Promise<MerchantProfileResponse> {
  return apiRequest<MerchantProfileResponse>(`/${merchantId}`);
}

export function updateMerchantProfile(
  merchantId: string,
  body: App.Requests.Merchant.Profile.UpdateMerchantProfileRequest
): Promise<MerchantProfileResponse> {
  return apiRequest<MerchantProfileResponse>(`/${merchantId}`, {
    method: "PUT",
    body,
  });
}

async function appendMerchantImage(formData: FormData, image: MerchantImageAsset): Promise<void> {
  if (Platform.OS === "web") {
    try {
      const response = await fetch(image.uri);
      if (!response.ok) {
        throw new Error(`Image request failed with status ${response.status}.`);
      }
      const blob = await response.blob();
      formData.append("image", blob, image.name);
      return;
    } catch (error) {
      throw new Error("The selected image could not be read. Choose it again.", {
        cause: error,
      });
    }
  }

  formData.append("image", new File(image.uri), image.name);
}

export async function uploadMerchantLogo(
  merchantId: string,
  image: MerchantImageAsset
): Promise<MerchantProfileResponse> {
  const formData = new FormData();
  await appendMerchantImage(formData, image);
  return apiRequest<MerchantProfileResponse>(`/${merchantId}/logo`, {
    method: "POST",
    body: formData,
  });
}

export async function uploadMerchantCover(
  merchantId: string,
  image: MerchantImageAsset
): Promise<MerchantProfileResponse> {
  const formData = new FormData();
  await appendMerchantImage(formData, image);
  return apiRequest<MerchantProfileResponse>(`/${merchantId}/cover`, {
    method: "POST",
    body: formData,
  });
}

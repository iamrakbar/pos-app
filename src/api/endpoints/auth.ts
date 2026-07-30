import { apiRequest } from "../client";

type LoginResponse = {
  data: App.Data.Merchant.Auth.AuthTokenData;
};

type ProfileResponse = {
  data: App.Data.Merchant.Auth.MerchantUserProfileData;
};

export function login(body: App.Requests.Merchant.Auth.LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export function getCurrentUser(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/me");
}

export function updateCurrentUser(
  body: App.Requests.Merchant.Auth.UpdateProfileRequest
): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/me", {
    method: "PUT",
    body,
  });
}

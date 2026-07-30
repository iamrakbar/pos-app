import { apiRequest } from "../client";

type LoginResponse = {
  data: App.Data.Merchant.Auth.AuthTokenData;
};

type AuthProfileResponse = {
  data: App.Data.Merchant.Auth.AuthTokenData;
};

export function login(body: App.Requests.Merchant.Auth.LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export function getCurrentUser(): Promise<AuthProfileResponse> {
  return apiRequest<AuthProfileResponse>("/me");
}

export function updateCurrentUser(
  body: App.Requests.Merchant.Auth.UpdateProfileRequest
): Promise<AuthProfileResponse> {
  return apiRequest<AuthProfileResponse>("/me", {
    method: "PUT",
    body,
  });
}

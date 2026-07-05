import { apiRequest } from "../client";

type LoginResponse = {
  data: App.Data.Merchant.Auth.AuthTokenData;
};

export function login(body: App.Requests.Merchant.Auth.LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/login", {
    method: "POST",
    body,
    auth: false,
  });
}

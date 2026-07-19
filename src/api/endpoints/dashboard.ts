import { apiRequest } from "../client";

type DashboardResponse = {
  success: boolean;
  data: App.Data.Merchant.Dashboard.DashboardData;
};

export function getDashboard(merchantId: string): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>(`/${merchantId}/dashboard`);
}

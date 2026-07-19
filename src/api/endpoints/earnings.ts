import { apiRequest } from "../client";

type EarningsResponse = {
  data: App.Data.Merchant.Earnings.EarningData[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: unknown;
};

export function getEarnings(
  merchantId: string,
  params?: {
    dateFrom?: string;
    dateTo?: string;
    orderableType?: string;
    sort?: "created_at" | "-created_at" | "total_price" | "-total_price";
    perPage?: number;
    page?: number;
  }
): Promise<EarningsResponse> {
  return apiRequest<EarningsResponse>(`/${merchantId}/earnings`, {
    query: {
      "filter[date_from]": params?.dateFrom,
      "filter[date_to]": params?.dateTo,
      "filter[orderable_type]": params?.orderableType,
      sort: params?.sort ?? "-created_at",
      per_page: params?.perPage,
      page: params?.page,
    },
  });
}

import { apiRequest } from "../client";

type CategoriesResponse = {
  success: boolean;
  data: App.Data.Merchant.Category.CategoryData[];
  meta?: unknown;
};

export function getCategories(merchantId: string): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>(`/${merchantId}/categories`, {
    query: {
      "filter[active]": 1,
      sort: "position",
      per_page: 50,
    },
  });
}

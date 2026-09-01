import { apiRequest } from "@/api/client";

type IngredientListResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.IngredientData[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type IngredientSort =
  | "name"
  | "-name"
  | "current_stock"
  | "-current_stock"
  | "reorder_point"
  | "-reorder_point"
  | "created_at"
  | "-created_at";

export type IngredientListParams = {
  search?: string;
  active?: boolean;
  baseUnit?: App.Requests.Merchant.InventoryUnitEnum;
  lowStock?: boolean;
  sort?: IngredientSort;
  page?: number;
  perPage?: number;
};

export function getIngredients(
  merchantId: string,
  params: IngredientListParams = {}
): Promise<IngredientListResponse> {
  return apiRequest<IngredientListResponse>(`/${merchantId}/ingredients`, {
    query: {
      "filter[search]": params.search,
      "filter[active]": params.active === undefined ? undefined : params.active ? 1 : 0,
      "filter[base_unit]": params.baseUnit,
      "filter[low_stock]": params.lowStock === undefined ? undefined : params.lowStock ? 1 : 0,
      sort: params.sort ?? "name",
      page: params.page,
      per_page: params.perPage ?? 50,
    },
  });
}

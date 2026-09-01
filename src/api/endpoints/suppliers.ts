import { apiRequest } from "@/api/client";

type SupplierListResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.SupplierData[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type SupplierSort = "name" | "-name" | "created_at" | "-created_at";

export type SupplierListParams = {
  search?: string;
  active?: boolean;
  sort?: SupplierSort;
  page?: number;
  perPage?: number;
};

export function getSuppliers(
  merchantId: string,
  params: SupplierListParams = {}
): Promise<SupplierListResponse> {
  return apiRequest<SupplierListResponse>(`/${merchantId}/suppliers`, {
    query: {
      "filter[search]": params.search,
      "filter[active]": params.active === undefined ? undefined : params.active ? 1 : 0,
      sort: params.sort ?? "name",
      page: params.page,
      per_page: params.perPage ?? 25,
    },
  });
}

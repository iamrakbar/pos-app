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

type SupplierResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.SupplierData;
};

type DeleteSupplierResponse = {
  success: boolean;
  message?: string;
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

export function getSupplier(merchantId: string, supplierId: string): Promise<SupplierResponse> {
  return apiRequest<SupplierResponse>(`/${merchantId}/suppliers/${supplierId}`);
}

export function createSupplier(
  merchantId: string,
  body: App.Requests.Merchant.Supplier.StoreSupplierRequest
): Promise<SupplierResponse> {
  return apiRequest<SupplierResponse>(`/${merchantId}/suppliers`, {
    method: "POST",
    body,
  });
}

export function updateSupplier(
  merchantId: string,
  supplierId: string,
  body: App.Requests.Merchant.Supplier.UpdateSupplierRequest
): Promise<SupplierResponse> {
  return apiRequest<SupplierResponse>(`/${merchantId}/suppliers/${supplierId}`, {
    method: "PUT",
    body,
  });
}

export function deleteSupplier(
  merchantId: string,
  supplierId: string
): Promise<DeleteSupplierResponse> {
  return apiRequest<DeleteSupplierResponse>(`/${merchantId}/suppliers/${supplierId}`, {
    method: "DELETE",
  });
}

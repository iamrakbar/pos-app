import { apiRequest } from "@/api/client";

type InventoryPageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type InventoryMovementResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.InventoryMovementData[];
  meta?: InventoryPageMeta;
};

type InventoryOperationResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.InventoryOperationData[];
  meta?: InventoryPageMeta;
};

export type InventoryMovementType = App.Data.Merchant.Inventory.InventoryMovementData["type"];
export type InventoryMovementSort = "moved_at" | "-moved_at";

export type InventoryMovementListParams = {
  ingredientId?: string;
  productId?: string;
  type?: InventoryMovementType;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: InventoryMovementSort;
  page?: number;
  perPage?: number;
};

export type InventoryOperationStatus = App.Data.Merchant.Inventory.InventoryOperationData["status"];
export type InventoryOperationSort = "created_at" | "-created_at";

export type InventoryOperationListParams = {
  source?: string;
  status?: InventoryOperationStatus;
  dateFrom?: string;
  dateTo?: string;
  sort?: InventoryOperationSort;
  page?: number;
  perPage?: number;
};

export function getInventoryMovements(
  merchantId: string,
  params: InventoryMovementListParams = {}
): Promise<InventoryMovementResponse> {
  return apiRequest<InventoryMovementResponse>(`/${merchantId}/inventory/movements`, {
    query: {
      "filter[ingredient_id]": params.ingredientId,
      "filter[product_id]": params.productId,
      "filter[type]": params.type,
      "filter[source]": params.source,
      "filter[date_from]": params.dateFrom,
      "filter[date_to]": params.dateTo,
      sort: params.sort ?? "-moved_at",
      page: params.page,
      per_page: params.perPage ?? 25,
    },
  });
}

export function getInventoryOperations(
  merchantId: string,
  params: InventoryOperationListParams = {}
): Promise<InventoryOperationResponse> {
  return apiRequest<InventoryOperationResponse>(`/${merchantId}/inventory/operations`, {
    query: {
      "filter[source]": params.source,
      "filter[status]": params.status,
      "filter[date_from]": params.dateFrom,
      "filter[date_to]": params.dateTo,
      sort: params.sort ?? "-created_at",
      page: params.page,
      per_page: params.perPage ?? 25,
    },
  });
}

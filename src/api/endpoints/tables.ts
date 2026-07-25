import { apiRequest } from "@/api/client";

type PosTablesResponse = {
  success: boolean;
  data: App.Data.Merchant.Pos.PosTableData[];
};

type TablesResponse = {
  success: boolean;
  data: App.Data.Merchant.Area.TableData[];
};

type TableResponse = {
  success: boolean;
  data: App.Data.Merchant.Area.TableData;
};

type DeleteTableResponse = {
  success: boolean;
  message?: string;
};

export function getPosTables(merchantId: string): Promise<PosTablesResponse> {
  return apiRequest<PosTablesResponse>(`/${merchantId}/pos/tables`);
}

export function getAreaTables(merchantId: string, areaId: string): Promise<TablesResponse> {
  return apiRequest<TablesResponse>(`/${merchantId}/areas/${areaId}/tables`);
}

export function createTable(
  merchantId: string,
  areaId: string,
  body: App.Requests.Merchant.Area.StoreTableRequest
): Promise<TableResponse> {
  return apiRequest<TableResponse>(`/${merchantId}/areas/${areaId}/tables`, {
    method: "POST",
    body,
  });
}

export function updateTable(
  merchantId: string,
  areaId: string,
  tableId: string,
  body: App.Requests.Merchant.Area.UpdateTableRequest
): Promise<TableResponse> {
  return apiRequest<TableResponse>(`/${merchantId}/areas/${areaId}/tables/${tableId}`, {
    method: "PUT",
    body,
  });
}

export function deleteTable(
  merchantId: string,
  areaId: string,
  tableId: string
): Promise<DeleteTableResponse> {
  return apiRequest<DeleteTableResponse>(`/${merchantId}/areas/${areaId}/tables/${tableId}`, {
    method: "DELETE",
  });
}

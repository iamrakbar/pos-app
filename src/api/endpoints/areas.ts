import { apiRequest } from "@/api/client";

type AreasResponse = {
  success: boolean;
  data: App.Data.Merchant.Area.AreaData[];
  meta?: unknown;
};

type AreaResponse = {
  success: boolean;
  data: App.Data.Merchant.Area.AreaData;
};

type DeleteAreaResponse = {
  success: boolean;
  message?: string;
};

export function getAreas(merchantId: string, perPage = 50): Promise<AreasResponse> {
  return apiRequest<AreasResponse>(`/${merchantId}/areas`, {
    query: { per_page: perPage },
  });
}

export function getArea(merchantId: string, areaId: string): Promise<AreaResponse> {
  return apiRequest<AreaResponse>(`/${merchantId}/areas/${areaId}`);
}

export function createArea(
  merchantId: string,
  body: App.Requests.Merchant.Area.StoreAreaRequest
): Promise<AreaResponse> {
  return apiRequest<AreaResponse>(`/${merchantId}/areas`, {
    method: "POST",
    body,
  });
}

export function updateArea(
  merchantId: string,
  areaId: string,
  body: App.Requests.Merchant.Area.UpdateAreaRequest
): Promise<AreaResponse> {
  return apiRequest<AreaResponse>(`/${merchantId}/areas/${areaId}`, {
    method: "PUT",
    body,
  });
}

export function deleteArea(merchantId: string, areaId: string): Promise<DeleteAreaResponse> {
  return apiRequest<DeleteAreaResponse>(`/${merchantId}/areas/${areaId}`, {
    method: "DELETE",
  });
}

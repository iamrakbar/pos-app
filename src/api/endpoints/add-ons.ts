import { apiRequest } from "@/api/client";

type AddOnsResponse = {
  success: boolean;
  data: App.Data.Merchant.AddOn.AddOnData[];
};

type AddOnResponse = {
  success: boolean;
  data: App.Data.Merchant.AddOn.AddOnData;
};

type DeleteAddOnResponse = {
  success: boolean;
  message?: string;
};

function addOnPath(merchantId: string, productId: string, addOnId?: string): string {
  const base = `/${merchantId}/products/${productId}/add-ons`;
  return addOnId ? `${base}/${addOnId}` : base;
}

export function getAddOns(merchantId: string, productId: string): Promise<AddOnsResponse> {
  return apiRequest<AddOnsResponse>(addOnPath(merchantId, productId));
}

export function getAddOn(
  merchantId: string,
  productId: string,
  addOnId: string
): Promise<AddOnResponse> {
  return apiRequest<AddOnResponse>(addOnPath(merchantId, productId, addOnId));
}

export function createAddOn(
  merchantId: string,
  productId: string,
  body: App.Requests.Merchant.AddOn.StoreAddOnRequest
): Promise<AddOnResponse> {
  return apiRequest<AddOnResponse>(addOnPath(merchantId, productId), {
    method: "POST",
    body,
  });
}

export function updateAddOn(
  merchantId: string,
  productId: string,
  addOnId: string,
  body: App.Requests.Merchant.AddOn.UpdateAddOnRequest
): Promise<AddOnResponse> {
  return apiRequest<AddOnResponse>(addOnPath(merchantId, productId, addOnId), {
    method: "PUT",
    body,
  });
}

export function deleteAddOn(
  merchantId: string,
  productId: string,
  addOnId: string
): Promise<DeleteAddOnResponse> {
  return apiRequest<DeleteAddOnResponse>(addOnPath(merchantId, productId, addOnId), {
    method: "DELETE",
  });
}

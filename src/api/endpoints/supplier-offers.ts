import { apiRequest } from "@/api/client";

type SupplierOfferListResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.SupplierOfferData[];
};

type SupplierOfferResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.SupplierOfferData;
  message?: string;
};

type DeleteSupplierOfferResponse = {
  success: boolean;
  message?: string;
};

export function getIngredientSupplierOffers(
  merchantId: string,
  ingredientId: string
): Promise<SupplierOfferListResponse> {
  return apiRequest<SupplierOfferListResponse>(
    `/${merchantId}/ingredients/${ingredientId}/supplier-offers`
  );
}

export function createIngredientSupplierOffer(
  merchantId: string,
  ingredientId: string,
  body: App.Requests.Merchant.Supplier.OfferRequest
): Promise<SupplierOfferResponse> {
  return apiRequest<SupplierOfferResponse>(
    `/${merchantId}/ingredients/${ingredientId}/supplier-offers`,
    { method: "POST", body }
  );
}

export function updateIngredientSupplierOffer(
  merchantId: string,
  ingredientId: string,
  offerId: number,
  body: App.Requests.Merchant.Supplier.OfferRequest
): Promise<SupplierOfferResponse> {
  return apiRequest<SupplierOfferResponse>(
    `/${merchantId}/ingredients/${ingredientId}/supplier-offers/${offerId}`,
    { method: "PUT", body }
  );
}

export function deleteIngredientSupplierOffer(
  merchantId: string,
  ingredientId: string,
  offerId: number
): Promise<DeleteSupplierOfferResponse> {
  return apiRequest<DeleteSupplierOfferResponse>(
    `/${merchantId}/ingredients/${ingredientId}/supplier-offers/${offerId}`,
    { method: "DELETE" }
  );
}

import { apiRequest } from "@/api/client";

type SupplierOfferListResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.SupplierOfferData[];
};

export function getIngredientSupplierOffers(
  merchantId: string,
  ingredientId: string
): Promise<SupplierOfferListResponse> {
  return apiRequest<SupplierOfferListResponse>(
    `/${merchantId}/ingredients/${ingredientId}/supplier-offers`
  );
}

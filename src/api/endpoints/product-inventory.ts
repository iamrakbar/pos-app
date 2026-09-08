import { apiRequest } from "@/api/client";
import type { ProductInventory, ProductInventoryMutationResult } from "@/types/product-inventory";

type ProductInventoryResponse = {
  success: boolean;
  data: ProductInventory;
  message?: string;
};

type ProductInventoryOperationResponse = {
  success: boolean;
  data: ProductInventoryMutationResult;
  message?: string;
};

type ProductRecipeResponse = {
  success: boolean;
  data: App.Data.Merchant.Inventory.RecipeData;
  message?: string;
};

export function getProductInventory(
  merchantId: string,
  productId: string
): Promise<ProductInventoryResponse> {
  return apiRequest<ProductInventoryResponse>(
    `/${merchantId}/products/${productId}/inventory`
  ).then(assertSuccessful);
}

export function updateProductInventory(
  merchantId: string,
  productId: string,
  body: App.Requests.Merchant.Product.UpdateInventoryRequest
): Promise<ProductInventoryResponse> {
  return apiRequest<ProductInventoryResponse>(`/${merchantId}/products/${productId}/inventory`, {
    method: "PUT",
    body,
  }).then(assertSuccessful);
}

export function recordProductOpeningBalance(
  merchantId: string,
  productId: string,
  body: App.Requests.Merchant.Inventory.OpeningBalanceRequest
): Promise<ProductInventoryOperationResponse> {
  return apiRequest<ProductInventoryOperationResponse>(
    `/${merchantId}/products/${productId}/opening-balance`,
    { method: "POST", body }
  ).then(assertSuccessful);
}

export function adjustProductStock(
  merchantId: string,
  productId: string,
  body: App.Requests.Merchant.Inventory.AdjustmentRequest
): Promise<ProductInventoryOperationResponse> {
  return apiRequest<ProductInventoryOperationResponse>(
    `/${merchantId}/products/${productId}/adjustments`,
    { method: "POST", body }
  ).then(assertSuccessful);
}

export function updateProductRecipe(
  merchantId: string,
  productId: string,
  body: App.Requests.Merchant.Product.UpdateRecipeRequest
): Promise<ProductRecipeResponse> {
  return apiRequest<ProductRecipeResponse>(`/${merchantId}/products/${productId}/recipe`, {
    method: "PUT",
    body,
  }).then(assertSuccessful);
}

function assertSuccessful<T extends { success: boolean; message?: string }>(response: T): T {
  if (!response.success) throw new Error(response.message ?? "Inventory operation failed.");
  return response;
}

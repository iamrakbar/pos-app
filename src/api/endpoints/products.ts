import { apiRequest } from "../client";
import { File } from "expo-file-system";
import { Platform } from "react-native";

type PosProductsResponse = {
  success: boolean;
  data: App.Data.Merchant.Pos.ProductData[];
};

type ProductResponse = {
  success: boolean;
  data: App.Data.Merchant.Product.ProductData;
};

type ProductsResponse = {
  success: boolean;
  data: App.Data.Merchant.Product.ProductData[];
  meta?: unknown;
};

type MutationResponse = {
  success: boolean;
  data: App.Data.Merchant.Product.ProductData;
  message?: string;
};

type DeleteResponse = { success: boolean; message?: string };

export type ProductImageAsset = { uri: string; name: string; type: string };

async function appendProductImage(formData: FormData, image: ProductImageAsset): Promise<void> {
  if (Platform.OS === "web") {
    try {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      formData.append("image", blob, image.name);
      return;
    } catch (error) {
      throw new Error("The selected product image could not be read. Choose it again.", {
        cause: error,
      });
    }
  }

  formData.append("image", new File(image.uri), image.name);
}

function appendProductFields(
  formData: FormData,
  body: App.Requests.Merchant.Product.StoreProductRequest
): void {
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
}

export function getPosProducts(
  merchantId: string,
  params?: { search?: string; category_id?: string }
): Promise<PosProductsResponse> {
  return apiRequest<PosProductsResponse>(`/${merchantId}/pos/products`, {
    query: {
      "filter[search]": params?.search,
      "filter[category_id]": params?.category_id,
      sort: "name",
    },
  });
}

export function getProduct(merchantId: string, productId: string): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/${merchantId}/products/${productId}`);
}

export function getProducts(
  merchantId: string,
  params?: { search?: string; category_id?: string; active?: boolean }
): Promise<ProductsResponse> {
  return apiRequest<ProductsResponse>(`/${merchantId}/products`, {
    query: {
      "filter[search]": params?.search,
      "filter[category_id]": params?.category_id,
      "filter[active]": params?.active === undefined ? undefined : params.active ? 1 : 0,
      sort: "-created_at",
      per_page: 50,
    },
  });
}

export async function createProduct(
  merchantId: string,
  body: App.Requests.Merchant.Product.StoreProductRequest,
  image?: ProductImageAsset | null
): Promise<MutationResponse> {
  const formData = new FormData();
  appendProductFields(formData, body);
  if (image) await appendProductImage(formData, image);
  return apiRequest<MutationResponse>(`/${merchantId}/products`, {
    method: "POST",
    body: formData,
  });
}

export function updateProduct(
  merchantId: string,
  productId: string,
  body: App.Requests.Merchant.Product.UpdateProductRequest
): Promise<MutationResponse> {
  return apiRequest<MutationResponse>(`/${merchantId}/products/${productId}`, {
    method: "PUT",
    body,
  });
}

export async function uploadProductImage(
  merchantId: string,
  productId: string,
  image: ProductImageAsset
): Promise<MutationResponse> {
  const formData = new FormData();
  await appendProductImage(formData, image);
  return apiRequest<MutationResponse>(`/${merchantId}/products/${productId}/image`, {
    method: "POST",
    body: formData,
  });
}

export function deleteProduct(merchantId: string, productId: string): Promise<DeleteResponse> {
  return apiRequest<DeleteResponse>(`/${merchantId}/products/${productId}`, { method: "DELETE" });
}

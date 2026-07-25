import { apiRequest } from "../client";

type CategoriesResponse = {
  success: boolean;
  data: App.Data.Merchant.Category.CategoryData[];
  meta?: unknown;
};

type CategoryResponse = {
  success: boolean;
  data: App.Data.Merchant.Category.CategoryData;
};

type DeleteCategoryResponse = {
  success: boolean;
  message?: string;
};

export type CategoryListParams = {
  search?: string;
  active?: boolean;
  sort?: "name" | "-name" | "position" | "-position" | "created_at" | "-created_at";
  perPage?: number;
};

export type ReorderCategoriesRequest = {
  categories: { id: string; position: number }[];
};

export function getCategories(
  merchantId: string,
  params: CategoryListParams = {}
): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>(`/${merchantId}/categories`, {
    query: {
      "filter[search]": params.search,
      "filter[active]": params.active === undefined ? undefined : params.active ? 1 : 0,
      sort: params.sort ?? "position",
      per_page: params.perPage ?? 50,
    },
  });
}

export function getCategory(merchantId: string, categoryId: string): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/${merchantId}/categories/${categoryId}`);
}

export function createCategory(
  merchantId: string,
  body: App.Requests.Merchant.Category.StoreCategoryRequest
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/${merchantId}/categories`, {
    method: "POST",
    body,
  });
}

export function updateCategory(
  merchantId: string,
  categoryId: string,
  body: App.Requests.Merchant.Category.UpdateCategoryRequest
): Promise<CategoryResponse> {
  return apiRequest<CategoryResponse>(`/${merchantId}/categories/${categoryId}`, {
    method: "PUT",
    body,
  });
}

export function deleteCategory(
  merchantId: string,
  categoryId: string
): Promise<DeleteCategoryResponse> {
  return apiRequest<DeleteCategoryResponse>(`/${merchantId}/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export function reorderCategories(
  merchantId: string,
  body: ReorderCategoriesRequest
): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>(`/${merchantId}/categories/reorder`, {
    method: "PATCH",
    body,
  });
}

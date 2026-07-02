import { apiRequest } from '../client';

// Verified against the live server: the response is a flat { data: [...] },
// not the double-nested { success, data: { data: [...] } } Scramble's example
// response in the Postman collection implied.
type ProductsResponse = {
    data: App.Data.Merchant.Product.ProductData[];
    meta?: unknown;
};

export function getProducts(
    merchantId: string,
    params?: { search?: string; category_id?: string; page?: number },
): Promise<ProductsResponse> {
    return apiRequest<ProductsResponse>(`/${merchantId}/products`, {
        query: {
            search: params?.search,
            category_id: params?.category_id,
            page: params?.page,
        },
    });
}

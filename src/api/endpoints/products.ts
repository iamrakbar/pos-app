import { apiRequest } from '../client';

type ProductsResponse = {
    success: boolean;
    data: {
        data: App.Data.Merchant.Product.ProductData[];
        meta?: unknown;
    };
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

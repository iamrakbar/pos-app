import { apiRequest } from '../client';

type PosProductsResponse = {
    success: boolean;
    data: App.Data.Merchant.Pos.ProductData[];
};

export function getPosProducts(
    merchantId: string,
    params?: { search?: string; category_id?: string },
): Promise<PosProductsResponse> {
    return apiRequest<PosProductsResponse>(`/${merchantId}/pos/products`, {
        query: {
            'filter[search]': params?.search,
            'filter[category_id]': params?.category_id,
            sort: 'name',
        },
    });
}

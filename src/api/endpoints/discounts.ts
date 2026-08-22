import { apiRequest } from "../client";

type DiscountListResponse = {
  success: boolean;
  data: App.Data.Merchant.Discount.DiscountData[];
  meta?: unknown;
};

export type DiscountDetailData = App.Data.Merchant.Discount.DiscountData;

type DiscountResponse = { success: boolean; data: DiscountDetailData };
type DeleteResponse = { success: boolean; message?: string };

export function getDiscounts(
  merchantId: string,
  params?: { search?: string; active?: boolean }
): Promise<DiscountListResponse> {
  return apiRequest<DiscountListResponse>(`/${merchantId}/discounts`, {
    query: {
      "filter[search]": params?.search,
      "filter[active]": params?.active === undefined ? undefined : params.active ? 1 : 0,
      sort: "-created_at",
      per_page: 50,
    },
  });
}

export function getDiscount(merchantId: string, discountId: string): Promise<DiscountResponse> {
  return apiRequest<DiscountResponse>(`/${merchantId}/discounts/${discountId}`);
}

export function createDiscount(
  merchantId: string,
  body: App.Requests.Merchant.Discount.StoreDiscountRequest
): Promise<DiscountResponse> {
  return apiRequest<DiscountResponse>(`/${merchantId}/discounts`, { method: "POST", body });
}

export function updateDiscount(
  merchantId: string,
  discountId: string,
  body: App.Requests.Merchant.Discount.UpdateDiscountRequest
): Promise<DiscountResponse> {
  return apiRequest<DiscountResponse>(`/${merchantId}/discounts/${discountId}`, {
    method: "PUT",
    body,
  });
}

export function deleteDiscount(merchantId: string, discountId: string): Promise<DeleteResponse> {
  return apiRequest<DeleteResponse>(`/${merchantId}/discounts/${discountId}`, { method: "DELETE" });
}

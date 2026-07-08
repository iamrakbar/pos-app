import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { checkout } from "@/api/endpoints/checkout";
import { useAuth } from "@/stores/useAuth";
import type { CheckoutFormValues } from "@/schemas/checkout";

type PosProductData = App.Data.Merchant.Pos.ProductData;
type CheckoutData = App.Data.Merchant.Checkout.CheckoutData;
type OrdersResponse = {
  data: App.Data.Merchant.Order.OrderListData[];
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
  links?: unknown;
};

function getCheckoutProductQty(form: CheckoutFormValues): Map<string, number> {
  const qtyByProductId = new Map<string, number>();
  for (const product of form.products) {
    qtyByProductId.set(
      product.product_id,
      (qtyByProductId.get(product.product_id) ?? 0) + product.qty
    );
  }
  return qtyByProductId;
}

function decrementCachedProductStock(
  products: PosProductData[] | undefined,
  qtyByProductId: Map<string, number>
) {
  if (!products) return products;
  return products.map((product) => {
    const checkoutQty = qtyByProductId.get(product.id);
    if (!checkoutQty || !product.stock.enabled) return product;

    const nextQty = Math.max(0, product.stock.qty - checkoutQty);
    return {
      ...product,
      stock: {
        ...product.stock,
        qty: nextQty,
      },
    };
  });
}

function toOrderListData(checkoutData: CheckoutData): App.Data.Merchant.Order.OrderListData {
  return {
    id: checkoutData.id,
    code: checkoutData.code,
    merchant: checkoutData.merchant as unknown as App.Data.Merchant.Auth.MerchantSummaryData,
    customer: checkoutData.customer ? [checkoutData.customer] : [],
    payment: checkoutData.payment ? [checkoutData.payment] : [],
    order_type: checkoutData.order_type,
    order_status: checkoutData.order_status as unknown as Array<any>,
    payment_status: [] as Array<any>,
    total: checkoutData.pricing.total,
    products_count: checkoutData.products.reduce((total, product) => total + product.qty, 0),
    orderable: checkoutData.table ? ([checkoutData.table] as Array<any>) : null,
    created_at: checkoutData.created_at,
  };
}

function prependOrderToCachedPages(
  pages: InfiniteData<OrdersResponse> | undefined,
  order: App.Data.Merchant.Order.OrderListData
) {
  if (!pages) return pages;
  return {
    ...pages,
    pages: pages.pages.map((page, pageIndex) => {
      if (pageIndex !== 0) return page;
      if (page.data.some((item) => item.id === order.id)) return page;
      return {
        ...page,
        data: [order, ...page.data],
        meta: page.meta ? { ...page.meta, total: page.meta.total + 1 } : page.meta,
      };
    }),
  };
}

export function useCheckout() {
  const merchantId = useAuth((s) => s.merchantId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: CheckoutFormValues) => {
      const body: App.Requests.Merchant.Checkout.CheckoutRequest = {
        customer_type: form.customer_type,
        guest_id: form.customer_type === "guest" ? form.guest_id : undefined,
        customer_id: form.customer_type === "customer" ? form.customer_id : undefined,
        order_type: form.order_type,
        table_id: form.order_type === "dine-in" ? form.table_id : undefined,
        pickup_time: form.order_type === "takeaway" ? form.pickup_time : undefined,
        payment_id: form.payment_id!,
        notes: form.notes || undefined,
        products: form.products,
      };

      const res = await checkout(merchantId!, body);
      return res.data;
    },
    onMutate: async (form) => {
      const productsQueryKey = ["products-raw", merchantId];
      await queryClient.cancelQueries({ queryKey: productsQueryKey });

      const previousProducts = queryClient.getQueriesData<PosProductData[]>({
        queryKey: productsQueryKey,
      });

      const qtyByProductId = getCheckoutProductQty(form);
      queryClient.setQueriesData<PosProductData[]>({ queryKey: productsQueryKey }, (old) =>
        decrementCachedProductStock(old, qtyByProductId)
      );

      return { previousProducts };
    },
    onError: (_error, _form, context) => {
      for (const [queryKey, data] of context?.previousProducts ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (data) => {
      const order = toOrderListData(data);
      const cachedOrderLists = queryClient.getQueriesData<InfiniteData<OrdersResponse>>({
        queryKey: ["orders"],
      });
      for (const [queryKey, cached] of cachedOrderLists) {
        const filterStatus = Array.isArray(queryKey) ? queryKey[1] : undefined;
        if (typeof filterStatus === "string" && filterStatus !== data.order_status.value) continue;
        queryClient.setQueryData(queryKey, prependOrderToCachedPages(cached, order));
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] });
    },
  });
}

import {
  createAddOn,
  deleteAddOn,
  getAddOn,
  getAddOns,
  updateAddOn,
} from "@/api/endpoints/add-ons";
import { useAuth } from "@/stores/use-auth";
import { usePOSStore } from "@/stores/use-pos-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { POSProduct } from "@/types/pos";

const ADD_ON_STALE_TIME_MS = 5 * 60 * 1000;

const addOnKeys = {
  all: (merchantId: string | null, productId: string) =>
    ["add-ons", merchantId, productId] as const,
  list: (merchantId: string | null, productId: string) =>
    ["add-ons", merchantId, productId, "list"] as const,
  detail: (merchantId: string | null, productId: string, addOnId: string) =>
    ["add-ons", merchantId, productId, "detail", addOnId] as const,
};

type ProductAddOn = App.Data.Merchant.Product.ProductAddOnData;
type ProductListSnapshot = [readonly unknown[], POSProduct[] | undefined];
type RawProductListSnapshot = [
  readonly unknown[],
  App.Data.Merchant.Pos.ProductData[] | undefined,
];

function toProductAddOn(addOn: App.Data.Merchant.AddOn.AddOnData): ProductAddOn {
  return {
    id: addOn.id,
    name: addOn.name,
    min: addOn.min,
    max: addOn.max,
    required: addOn.required,
    multiple: addOn.multiple,
    options: addOn.options.map((option) => ({
      id: option.id,
      name: option.name,
      price: option.price,
    })),
  };
}

function optimisticProductAddOn(
  id: string,
  values:
    | App.Requests.Merchant.AddOn.StoreAddOnRequest
    | App.Requests.Merchant.AddOn.UpdateAddOnRequest,
  current?: ProductAddOn
): ProductAddOn {
  const min = values.min ?? current?.min ?? 0;
  const max = values.max ?? current?.max ?? 1;
  const required = values.required ?? current?.required ?? min > 0;
  const multiple = values.multiple ?? current?.multiple ?? max > 1;
  const options =
    values.options?.flatMap((option, index) => {
      if ("_destroy" in option && option._destroy) return [];
      const optionId = "id" in option ? option.id : null;
      const existing = current?.options.find((candidate) => candidate.id === optionId);
      return [
        {
          id: optionId ?? existing?.id ?? `optimistic-option-${id}-${index}`,
          name: option.name,
          price: option.price,
        },
      ];
    }) ?? current?.options ?? [];

  return {
    id,
    name: values.name ?? current?.name ?? "",
    min,
    max,
    required,
    multiple,
    options,
  };
}

function patchProductAddOns(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  productId: string,
  updater: (addOns: ProductAddOn[]) => ProductAddOn[]
) {
  queryClient.setQueriesData<POSProduct[]>(
    { queryKey: ["management-products", merchantId] },
    (products) =>
      products?.map((product) =>
        product.id === productId ? { ...product, add_ons: updater(product.add_ons) } : product
      )
  );
  queryClient.setQueriesData<App.Data.Merchant.Pos.ProductData[]>(
    { queryKey: ["products-raw", merchantId] },
    (products) =>
      products?.map((product) =>
        product.id === productId ? { ...product, add_ons: updater(product.add_ons) } : product
      )
  );
  queryClient.setQueryData<App.Data.Merchant.Product.ProductData>(
    ["product", merchantId, productId],
    (product) => (product ? { ...product, add_ons: updater(product.add_ons) } : product)
  );
  const selectedProduct = usePOSStore.getState().selectedProduct;
  if (selectedProduct?.id === productId) {
    usePOSStore.setState({
      selectedProduct: {
        ...selectedProduct,
        add_ons: updater(selectedProduct.add_ons),
      },
    });
  }
}

function restoreProductAddOns(
  queryClient: ReturnType<typeof useQueryClient>,
  context: {
    managementProducts: ProductListSnapshot[];
    rawProducts: RawProductListSnapshot[];
    productDetail: App.Data.Merchant.Product.ProductData | undefined;
    selectedProduct: POSProduct | null;
  },
  merchantId: string | null,
  productId: string
) {
  for (const [queryKey, data] of context.managementProducts) {
    queryClient.setQueryData(queryKey, data);
  }
  for (const [queryKey, data] of context.rawProducts) {
    queryClient.setQueryData(queryKey, data);
  }
  queryClient.setQueryData(["product", merchantId, productId], context.productDetail);
  if (usePOSStore.getState().selectedProduct?.id === productId) {
    usePOSStore.setState({ selectedProduct: context.selectedProduct });
  }
}

async function snapshotProductAddOns(
  queryClient: ReturnType<typeof useQueryClient>,
  merchantId: string | null,
  productId: string
) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: ["management-products", merchantId] }),
    queryClient.cancelQueries({ queryKey: ["products-raw", merchantId] }),
    queryClient.cancelQueries({ queryKey: ["product", merchantId, productId] }),
  ]);

  return {
    managementProducts: queryClient.getQueriesData<POSProduct[]>({
      queryKey: ["management-products", merchantId],
    }),
    rawProducts: queryClient.getQueriesData<App.Data.Merchant.Pos.ProductData[]>({
      queryKey: ["products-raw", merchantId],
    }),
    productDetail: queryClient.getQueryData<App.Data.Merchant.Product.ProductData>([
      "product",
      merchantId,
      productId,
    ]),
    selectedProduct: usePOSStore.getState().selectedProduct,
  };
}

export function useAddOns(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: addOnKeys.list(merchantId, productId),
    queryFn: async () => (await getAddOns(merchantId!, productId)).data,
    enabled: !!merchantId && !!productId,
    staleTime: ADD_ON_STALE_TIME_MS,
  });
}

export function useAddOn(productId: string, addOnId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  return useQuery({
    queryKey: addOnKeys.detail(merchantId, productId, addOnId),
    queryFn: async () => (await getAddOn(merchantId!, productId, addOnId)).data,
    enabled: !!merchantId && !!productId && addOnId !== "new",
    staleTime: ADD_ON_STALE_TIME_MS,
  });
}

function useInvalidateAddOns(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  return async (addOnId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: addOnKeys.all(merchantId, productId) }),
      queryClient.invalidateQueries({ queryKey: ["product", merchantId, productId] }),
      queryClient.invalidateQueries({ queryKey: ["management-products", merchantId] }),
      queryClient.invalidateQueries({ queryKey: ["products-raw", merchantId] }),
      addOnId
        ? queryClient.invalidateQueries({
            queryKey: addOnKeys.detail(merchantId, productId, addOnId),
          })
        : Promise.resolve(),
    ]);
  };
}

export function useCreateAddOn(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateAddOns = useInvalidateAddOns(productId);
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.AddOn.StoreAddOnRequest) =>
      (await createAddOn(merchantId!, productId, values)).data,
    onMutate: async (values) => {
      const snapshots = await snapshotProductAddOns(queryClient, merchantId, productId);
      const temporaryId = `optimistic-add-on-${Date.now()}`;
      const optimistic = optimisticProductAddOn(temporaryId, values);
      patchProductAddOns(queryClient, merchantId, productId, (addOns) => [
        ...addOns,
        optimistic,
      ]);
      return { ...snapshots, temporaryId };
    },
    onError: (_error, _values, context) => {
      if (context) restoreProductAddOns(queryClient, context, merchantId, productId);
    },
    onSuccess: (addOn, _values, context) => {
      const resolved = toProductAddOn(addOn);
      patchProductAddOns(queryClient, merchantId, productId, (addOns) =>
        addOns.map((item) => (item.id === context?.temporaryId ? resolved : item))
      );
    },
    onSettled: async (addOn) => invalidateAddOns(addOn?.id),
  });
}

export function useUpdateAddOn(productId: string, addOnId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateAddOns = useInvalidateAddOns(productId);
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.AddOn.UpdateAddOnRequest) =>
      (await updateAddOn(merchantId!, productId, addOnId, values)).data,
    onMutate: async (values) => {
      const snapshots = await snapshotProductAddOns(queryClient, merchantId, productId);
      patchProductAddOns(queryClient, merchantId, productId, (addOns) =>
        addOns.map((item) =>
          item.id === addOnId ? optimisticProductAddOn(addOnId, values, item) : item
        )
      );
      return snapshots;
    },
    onError: (_error, _values, context) => {
      if (context) restoreProductAddOns(queryClient, context, merchantId, productId);
    },
    onSuccess: (addOn) => {
      const resolved = toProductAddOn(addOn);
      patchProductAddOns(queryClient, merchantId, productId, (addOns) =>
        addOns.map((item) => (item.id === addOnId ? resolved : item))
      );
    },
    onSettled: async () => invalidateAddOns(addOnId),
  });
}

export function useDeleteAddOn(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const invalidateAddOns = useInvalidateAddOns(productId);
  return useMutation({
    mutationFn: async (addOnId: string) => deleteAddOn(merchantId!, productId, addOnId),
    onMutate: async (addOnId) => {
      const snapshots = await snapshotProductAddOns(queryClient, merchantId, productId);
      patchProductAddOns(queryClient, merchantId, productId, (addOns) =>
        addOns.filter((item) => item.id !== addOnId)
      );
      return snapshots;
    },
    onError: (_error, _addOnId, context) => {
      if (context) restoreProductAddOns(queryClient, context, merchantId, productId);
    },
    onSettled: async () => invalidateAddOns(),
  });
}

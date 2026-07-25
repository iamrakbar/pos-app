import {
  createAddOn,
  deleteAddOn,
  getAddOn,
  getAddOns,
  updateAddOn,
} from "@/api/endpoints/add-ons";
import { useAuth } from "@/stores/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ADD_ON_STALE_TIME_MS = 5 * 60 * 1000;

const addOnKeys = {
  all: (merchantId: string | null, productId: string) =>
    ["add-ons", merchantId, productId] as const,
  list: (merchantId: string | null, productId: string) =>
    ["add-ons", merchantId, productId, "list"] as const,
  detail: (merchantId: string | null, productId: string, addOnId: string) =>
    ["add-ons", merchantId, productId, "detail", addOnId] as const,
};

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
  const invalidateAddOns = useInvalidateAddOns(productId);
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.AddOn.StoreAddOnRequest) =>
      (await createAddOn(merchantId!, productId, values)).data,
    onSuccess: async (addOn) => invalidateAddOns(addOn.id),
  });
}

export function useUpdateAddOn(productId: string, addOnId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateAddOns = useInvalidateAddOns(productId);
  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.AddOn.UpdateAddOnRequest) =>
      (await updateAddOn(merchantId!, productId, addOnId, values)).data,
    onSuccess: async () => invalidateAddOns(addOnId),
  });
}

export function useDeleteAddOn(productId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const invalidateAddOns = useInvalidateAddOns(productId);
  return useMutation({
    mutationFn: async (addOnId: string) => deleteAddOn(merchantId!, productId, addOnId),
    onSuccess: async () => invalidateAddOns(),
  });
}

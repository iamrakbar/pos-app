import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIngredientSupplierOffer,
  deleteIngredientSupplierOffer,
  getIngredientSupplierOffers,
  updateIngredientSupplierOffer,
} from "@/api/endpoints/supplier-offers";
import { useAuth } from "@/stores/use-auth";

export const supplierOfferKeys = {
  ingredient: (merchantId: string | null, ingredientId: string) =>
    ["supplier-offers", merchantId, ingredientId] as const,
};

type SupplierOffer = App.Data.Merchant.Inventory.SupplierOfferData;
type SupplierOfferRequest = App.Requests.Merchant.Supplier.OfferRequest;
type SupplierOfferMutationContext = {
  previousOffers?: SupplierOffer[];
};

export function useIngredientSupplierOffers(ingredientId: string, enabled = true) {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: supplierOfferKeys.ingredient(merchantId, ingredientId),
    queryFn: async () => (await getIngredientSupplierOffers(merchantId!, ingredientId)).data,
    enabled: !!merchantId && ingredientId !== "new" && enabled,
  });
}

export function useCreateIngredientSupplierOffer(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Supplier.OfferRequest) =>
      (await createIngredientSupplierOffer(merchantId!, ingredientId, values)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: supplierOfferKeys.ingredient(merchantId, ingredientId),
      });
    },
  });
}

export function useUpdateIngredientSupplierOffer(ingredientId: string, offerId: number) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const queryKey = supplierOfferKeys.ingredient(merchantId, ingredientId);

  return useMutation({
    mutationFn: async (values: SupplierOfferRequest) =>
      (await updateIngredientSupplierOffer(merchantId!, ingredientId, offerId, values)).data,
    onMutate: async (values): Promise<SupplierOfferMutationContext> => {
      await queryClient.cancelQueries({ queryKey });
      const previousOffers = queryClient.getQueryData<SupplierOffer[]>(queryKey);

      queryClient.setQueryData<SupplierOffer[]>(queryKey, (offers) =>
        offers?.map((offer) =>
          offer.id === offerId
            ? {
                ...offer,
                supplier_id: values.supplier_id,
                supplier_sku: values.supplier_sku ?? null,
                purchase_unit: values.purchase_unit,
                pack_quantity: values.pack_quantity,
                minimum_order_quantity: values.minimum_order_quantity ?? null,
                last_purchase_price: values.last_purchase_price ?? null,
                lead_time_days: values.lead_time_days ?? null,
                is_preferred: values.is_preferred ?? offer.is_preferred,
                active: values.active ?? offer.active,
              }
            : offer
        )
      );

      return { previousOffers };
    },
    onError: (_error, _values, context) => {
      if (context?.previousOffers) {
        queryClient.setQueryData(queryKey, context.previousOffers);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteIngredientSupplierOffer(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);
  const queryClient = useQueryClient();
  const queryKey = supplierOfferKeys.ingredient(merchantId, ingredientId);

  return useMutation({
    mutationFn: async (offerId: number) =>
      deleteIngredientSupplierOffer(merchantId!, ingredientId, offerId),
    onMutate: async (offerId): Promise<SupplierOfferMutationContext> => {
      await queryClient.cancelQueries({ queryKey });
      const previousOffers = queryClient.getQueryData<SupplierOffer[]>(queryKey);

      queryClient.setQueryData<SupplierOffer[]>(queryKey, (offers) =>
        offers?.filter((offer) => offer.id !== offerId)
      );

      return { previousOffers };
    },
    onError: (_error, _offerId, context) => {
      if (context?.previousOffers) {
        queryClient.setQueryData(queryKey, context.previousOffers);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}

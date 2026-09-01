import { useQuery } from "@tanstack/react-query";
import { getIngredientSupplierOffers } from "@/api/endpoints/supplier-offers";
import { useAuth } from "@/stores/use-auth";

export const supplierOfferKeys = {
  ingredient: (merchantId: string | null, ingredientId: string) =>
    ["supplier-offers", merchantId, ingredientId] as const,
};

export function useIngredientSupplierOffers(ingredientId: string) {
  const merchantId = useAuth((state) => state.merchantId);

  return useQuery({
    queryKey: supplierOfferKeys.ingredient(merchantId, ingredientId),
    queryFn: async () => (await getIngredientSupplierOffers(merchantId!, ingredientId)).data,
    enabled: !!merchantId && ingredientId !== "new",
  });
}

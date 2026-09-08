import IngredientSupplierOffersScreen from "@/screens/inventory/ingredient-supplier-offers";
import { useTranslation } from "@/stores/use-locale";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function IngredientSupplierOffersRoute(): React.JSX.Element {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ingredientId = Array.isArray(id) ? id[0] : id;

  return (
    <>
      <Stack.Screen options={{ title: t("ingredients.supplierOffers") }} />
      <IngredientSupplierOffersScreen ingredientId={ingredientId} />
    </>
  );
}

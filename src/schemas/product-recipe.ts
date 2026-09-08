import type { Translate } from "@/locales";

export type InventoryUnit = App.Requests.Merchant.InventoryUnitEnum;

export type RecipeDraftLine = {
  id: string;
  ingredient_id: string;
  quantity: string;
  unit: InventoryUnit;
};

export function getCompatibleUnits(baseUnit: InventoryUnit): InventoryUnit[] {
  if (baseUnit === "gram" || baseUnit === "kilogram") return ["gram", "kilogram"];
  if (baseUnit === "milliliter" || baseUnit === "liter") return ["milliliter", "liter"];
  return [baseUnit];
}

function isCompatibleUnit(baseUnit: InventoryUnit, unit: InventoryUnit): boolean {
  if (baseUnit === "gram" || baseUnit === "kilogram") {
    return unit === "gram" || unit === "kilogram";
  }
  if (baseUnit === "milliliter" || baseUnit === "liter") {
    return unit === "milliliter" || unit === "liter";
  }
  return unit === baseUnit;
}

export function validateRecipeDraft(
  draft: RecipeDraftLine[],
  ingredients: App.Data.Merchant.Inventory.IngredientData[],
  t: Translate
): { lines: App.Requests.Merchant.Product.UpdateRecipeRequest["ingredients"] } | { error: string } {
  if (draft.length === 0) return { error: t("productForm.recipeRequired") };

  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const seenIngredients = new Set<string>();
  const lines: App.Requests.Merchant.Product.UpdateRecipeRequest["ingredients"] = [];

  for (const line of draft) {
    const ingredient = ingredientsById.get(line.ingredient_id);
    if (!ingredient || seenIngredients.has(line.ingredient_id)) {
      return { error: t("productForm.recipeDuplicateIngredient") };
    }
    const quantity = Number(line.quantity);
    if (!line.quantity || !Number.isFinite(quantity) || quantity <= 0) {
      return { error: t("productForm.recipeQuantityInvalid") };
    }
    if (!isCompatibleUnit(ingredient.base_unit, line.unit)) {
      return { error: t("productForm.recipeUnitInvalid") };
    }
    seenIngredients.add(line.ingredient_id);
    lines.push({ ingredient_id: line.ingredient_id, quantity, unit: line.unit });
  }

  return { lines };
}

export function toRecipeDraft(
  recipe: App.Data.Merchant.Inventory.RecipeData | undefined
): RecipeDraftLine[] {
  return (
    recipe?.ingredients.map((ingredient) => ({
      id: ingredient.ingredient_id,
      ingredient_id: ingredient.ingredient_id,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
    })) ?? []
  );
}

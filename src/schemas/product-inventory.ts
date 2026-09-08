import type { ProductFormValues } from "@/schemas/product";
import type { ProductInventoryMode } from "@/types/product-inventory";

export type ProductInventoryCapabilities = {
  showInventoryCost: boolean;
  showStockAlert: boolean;
  showCurrentStock: boolean;
  showOpeningBalance: boolean;
  showAdjustment: boolean;
  showMovements: boolean;
  showRecipe: boolean;
};

export function getProductInventoryCapabilities(
  mode: ProductInventoryMode,
  isNew: boolean
): ProductInventoryCapabilities {
  const isManual = mode === "manual";
  const isTracked = isManual || mode === "recipe";

  return {
    showInventoryCost: isManual,
    showStockAlert: isManual,
    showCurrentStock: !isNew && isTracked,
    showOpeningBalance: !isNew && isManual,
    showAdjustment: !isNew && isManual,
    showMovements: !isNew && isTracked,
    showRecipe: !isNew && mode === "recipe",
  };
}

export function toProductInventoryPayload(
  values: Pick<ProductFormValues, "inventory_mode" | "inventory_cost" | "stock_alert">
): App.Requests.Merchant.Product.UpdateInventoryRequest {
  return {
    inventory_mode: values.inventory_mode,
    cost:
      values.inventory_mode === "manual" && values.inventory_cost !== ""
        ? Number(values.inventory_cost)
        : null,
    stock_alert:
      values.inventory_mode === "manual" && values.stock_alert !== ""
        ? Number(values.stock_alert)
        : null,
  };
}

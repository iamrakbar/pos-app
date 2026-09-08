export type ProductInventoryMode = App.Requests.Merchant.InventoryModeEnum;

export const PRODUCT_INVENTORY_MODES = ["unlimited", "manual", "recipe"] as const;

export type ProductInventory = {
  id: string;
  inventory_mode: ProductInventoryMode;
  cost: number | null;
  stock: number;
  stock_alert: number | null;
  has_recipe: boolean;
  estimated_unit_cogs: number;
};

export type ProductInventoryMutationResult = App.Data.Merchant.Inventory.InventoryOperationData;

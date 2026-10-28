import type { InventoryMovementType } from "@/api/endpoints/inventory-audit";
import { formatInventoryQuantity } from "@/utils/format";

export const MOVEMENT_TYPE_COLORS: Record<
  InventoryMovementType,
  "primary" | "success" | "warning" | "destructive"
> = {
  opening: "success",
  purchase: "success",
  sale: "primary",
  reversal: "warning",
  adjustment: "primary",
  waste: "destructive",
  damage: "destructive",
  return: "warning",
};

export const MOVEMENT_TABLE_COLUMNS = [140, 150, 150, 160, 160, 220, 170, 180].map((width) => ({
  width,
}));
export const MOVEMENT_TABLE_WIDTH = MOVEMENT_TABLE_COLUMNS.reduce(
  (total, column) => total + column.width,
  0
);

export function formatSignedQuantity(value: number): string {
  const quantity = formatInventoryQuantity(Math.abs(value));
  return value > 0 ? `+${quantity}` : value < 0 ? `-${quantity}` : quantity;
}

import type { StatusColor } from "@/api/mappers/order";

export function statusChipVariant(color: StatusColor) {
  if (color === "accent") return "primary";
  if (color === "danger") return "destructive";
  return color;
}

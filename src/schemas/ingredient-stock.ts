import type { Translate } from "@/locales";
import { z } from "zod";

export const INGREDIENT_MOVEMENT_TYPES = [
  "purchase",
  "return",
  "waste",
  "damage",
] as const satisfies readonly App.Requests.Merchant.Ingredient.MovementRequest["type"][];

const DECIMAL_VALUE_PATTERN = /^\d*(?:\.\d{0,6})?$/;

function requiredDecimal(t: Translate, positive = false) {
  return z
    .string()
    .trim()
    .min(1, t("validation.numberRequired"))
    .regex(DECIMAL_VALUE_PATTERN, t("validation.numberFormat"))
    .refine(
      (value) => (positive ? Number(value) > 0 : Number(value) >= 0),
      positive ? t("validation.positiveNumber") : t("validation.nonNegative")
    );
}

function optionalRupiah(t: Translate) {
  return z
    .string()
    .trim()
    .regex(/^\d*$/, t("validation.wholeNumber"))
    .refine((value) => value === "" || Number(value) >= 0, t("validation.nonNegative"));
}

function reasonSchema(t: Translate) {
  return z.string().trim().min(1, t("validation.reasonRequired"));
}

export function createIngredientAdjustmentSchema(t: Translate) {
  return z.object({
    target_balance: requiredDecimal(t),
    reason: reasonSchema(t),
  });
}

export type IngredientAdjustmentFormValues = z.infer<
  ReturnType<typeof createIngredientAdjustmentSchema>
>;

export function toIngredientAdjustmentRequest(
  values: IngredientAdjustmentFormValues,
  operationId: string
): App.Requests.Merchant.Inventory.AdjustmentRequest {
  return {
    target_balance: Number(values.target_balance),
    reason: values.reason.trim(),
    operation_id: operationId,
  };
}

export function createIngredientMovementSchema(t: Translate) {
  return z.object({
    type: z
      .string()
      .refine(
        (value): value is (typeof INGREDIENT_MOVEMENT_TYPES)[number] =>
          INGREDIENT_MOVEMENT_TYPES.includes(value as (typeof INGREDIENT_MOVEMENT_TYPES)[number]),
        t("validation.movementTypeRequired")
      ),
    quantity: requiredDecimal(t, true),
    cost_per_unit: optionalRupiah(t),
    reason: reasonSchema(t),
  });
}

export type IngredientMovementFormValues = {
  type: string;
  quantity: string;
  cost_per_unit: string;
  reason: string;
};

export function toIngredientMovementRequest(
  values: IngredientMovementFormValues,
  operationId: string
): App.Requests.Merchant.Ingredient.MovementRequest {
  return {
    type: values.type as App.Requests.Merchant.Ingredient.MovementRequest["type"],
    quantity: Number(values.quantity),
    reason: values.reason.trim(),
    cost_per_unit: values.cost_per_unit === "" ? null : Number(values.cost_per_unit),
    operation_id: operationId,
  };
}

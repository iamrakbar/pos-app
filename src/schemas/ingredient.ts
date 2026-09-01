import type { Translate } from "@/locales";
import { z } from "zod";

export const INGREDIENT_UNITS = [
  "gram",
  "kilogram",
  "milliliter",
  "liter",
  "piece",
  "serving",
] as const satisfies readonly App.Requests.Merchant.InventoryUnitEnum[];

const DECIMAL_VALUE_PATTERN = /^\d*(?:\.\d{0,6})?$/;

function optionalNonNegativeNumber(t: Translate) {
  return z
    .string()
    .regex(DECIMAL_VALUE_PATTERN, t("validation.numberFormat"))
    .refine((value) => value === "" || Number(value) >= 0, t("validation.nonNegative"));
}

export function createIngredientSchema(t: Translate) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("validation.nameRequired"))
        .max(255, t("validation.nameTooLong")),
      base_unit: z.enum(INGREDIENT_UNITS, { error: t("ingredients.unitRequired") }),
      reorder_point: optionalNonNegativeNumber(t),
      cost_per_unit: z
        .string()
        .regex(/^\d*$/, t("validation.wholeNumber"))
        .refine((value) => value === "" || Number(value) >= 0, t("validation.nonNegative")),
      initial_quantity: optionalNonNegativeNumber(t),
      active: z.boolean(),
    })
    .superRefine((values, context) => {
      if (Number(values.initial_quantity) > 0 && values.cost_per_unit === "") {
        context.addIssue({
          code: "custom",
          path: ["cost_per_unit"],
          message: t("ingredients.initialCostRequired"),
        });
      }
    });
}

export type IngredientFormValues = z.infer<ReturnType<typeof createIngredientSchema>>;

export function toIngredientCreateRequest(
  values: IngredientFormValues,
  operationId: string
): App.Requests.Merchant.Ingredient.StoreIngredientRequest {
  const initialQuantity = Number(values.initial_quantity);
  const request: App.Requests.Merchant.Ingredient.StoreIngredientRequest = {
    name: values.name.trim(),
    base_unit: values.base_unit,
    reorder_point: values.reorder_point === "" ? null : Number(values.reorder_point),
    cost_per_unit: values.cost_per_unit === "" ? null : Number(values.cost_per_unit),
    active: values.active,
  };

  if (initialQuantity > 0) {
    request.initial_quantity = initialQuantity;
    request.operation_id = operationId;
  }

  return request;
}

export function toIngredientUpdateRequest(
  values: IngredientFormValues
): App.Requests.Merchant.Ingredient.UpdateIngredientRequest {
  return {
    name: values.name.trim(),
    base_unit: values.base_unit,
    reorder_point: values.reorder_point === "" ? null : Number(values.reorder_point),
    cost_per_unit: values.cost_per_unit === "" ? null : Number(values.cost_per_unit),
    active: values.active,
  };
}

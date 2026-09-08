import type { Translate } from "@/locales";
import { z } from "zod";

const WHOLE_NUMBER_PATTERN = /^\d*$/;

function wholeNumber(t: Translate, required: boolean) {
  const schema = z.string().trim().regex(WHOLE_NUMBER_PATTERN, t("validation.wholeNumber"));
  return required ? schema.min(1, t("validation.numberRequired")) : schema;
}

function operationReason(t: Translate) {
  return z.string().trim().min(1, t("validation.reasonRequired"));
}

export function createProductOpeningBalanceSchema(t: Translate) {
  return z.object({
    quantity: wholeNumber(t, true),
    cost_per_unit: wholeNumber(t, false),
  });
}

export type ProductOpeningBalanceFormValues = {
  quantity: string;
  cost_per_unit: string;
};

export function toProductOpeningBalanceRequest(
  values: ProductOpeningBalanceFormValues,
  operationId: string
): App.Requests.Merchant.Inventory.OpeningBalanceRequest {
  return {
    quantity: Number(values.quantity),
    cost_per_unit: values.cost_per_unit === "" ? null : Number(values.cost_per_unit),
    operation_id: operationId,
  };
}

export function createProductAdjustmentSchema(t: Translate) {
  return z.object({
    target_balance: wholeNumber(t, true),
    reason: operationReason(t),
  });
}

export type ProductAdjustmentFormValues = {
  target_balance: string;
  reason: string;
};

export function toProductAdjustmentRequest(
  values: ProductAdjustmentFormValues,
  operationId: string
): App.Requests.Merchant.Inventory.AdjustmentRequest {
  return {
    target_balance: Number(values.target_balance),
    reason: values.reason.trim(),
    operation_id: operationId,
  };
}

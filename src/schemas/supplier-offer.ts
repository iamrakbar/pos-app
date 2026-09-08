import type { Translate } from "@/locales";
import { z } from "zod";

const DECIMAL_VALUE_PATTERN = /^\d*(?:\.\d{0,6})?$/;
const WHOLE_NUMBER_PATTERN = /^\d*$/;

function optionalDecimal(t: Translate) {
  return z
    .string()
    .regex(DECIMAL_VALUE_PATTERN, t("validation.numberFormat"))
    .refine((value) => value === "" || Number(value) >= 0, t("validation.nonNegative"));
}

function optionalWholeNumber(t: Translate) {
  return z
    .string()
    .regex(WHOLE_NUMBER_PATTERN, t("validation.wholeNumber"))
    .refine((value) => value === "" || Number(value) >= 0, t("validation.nonNegative"));
}

export function createSupplierOfferSchema(t: Translate) {
  return z.object({
    supplier_id: z.string().min(1, t("validation.supplierRequired")),
    supplier_sku: z.string().trim().max(100, t("validation.supplierSkuTooLong")),
    purchase_unit: z
      .string()
      .trim()
      .min(1, t("validation.purchaseUnitRequired"))
      .max(100, t("validation.nameTooLong")),
    pack_quantity: z
      .string()
      .regex(DECIMAL_VALUE_PATTERN, t("validation.numberFormat"))
      .refine((value) => Number(value) > 0, t("validation.positiveNumber")),
    minimum_order_quantity: optionalDecimal(t),
    last_purchase_price: optionalWholeNumber(t),
    lead_time_days: optionalWholeNumber(t),
    is_preferred: z.boolean(),
    active: z.boolean(),
  });
}

export type SupplierOfferFormValues = z.infer<ReturnType<typeof createSupplierOfferSchema>>;

export function toSupplierOfferRequest(
  values: SupplierOfferFormValues
): App.Requests.Merchant.Supplier.OfferRequest {
  return {
    supplier_id: values.supplier_id,
    supplier_sku: values.supplier_sku.trim() || null,
    purchase_unit: values.purchase_unit.trim(),
    pack_quantity: Number(values.pack_quantity),
    minimum_order_quantity:
      values.minimum_order_quantity === "" ? null : Number(values.minimum_order_quantity),
    last_purchase_price:
      values.last_purchase_price === "" ? null : Number(values.last_purchase_price),
    lead_time_days: values.lead_time_days === "" ? null : Number(values.lead_time_days),
    is_preferred: values.is_preferred,
    active: values.active,
  };
}

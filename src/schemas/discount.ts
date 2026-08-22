import type { Translate } from "@/locales";
import { z } from "zod";

export function createDiscountSchema(t: Translate) {
  return z
    .object({
      name: z.string().trim().min(1, t("discounts.nameRequired")).max(255, t("validation.nameTooLong")),
      unit: z.enum(["percentage", "fixed"]),
      value: z.string().trim().min(1, t("discounts.valueRequired")),
      start: z.string().trim(),
      end: z.string().trim(),
      active: z.boolean(),
      products: z.array(z.string()),
    })
    .superRefine((values, ctx) => {
      const value = Number(values.value);
      if (!Number.isFinite(value) || value < 0 || (values.unit === "percentage" && value > 100)) {
        ctx.addIssue({ code: "custom", path: ["value"], message: t("discounts.valueInvalid") });
      }
      if (values.start && !/^\d{4}-\d{2}-\d{2}$/.test(values.start)) {
        ctx.addIssue({ code: "custom", path: ["start"], message: t("discounts.dateInvalid") });
      }
      if (values.end && !/^\d{4}-\d{2}-\d{2}$/.test(values.end)) {
        ctx.addIssue({ code: "custom", path: ["end"], message: t("discounts.dateInvalid") });
      }
      if (values.start && values.end && values.start > values.end) {
        ctx.addIssue({ code: "custom", path: ["end"], message: t("discounts.endBeforeStart") });
      }
    });
}

export type DiscountFormValues = z.infer<ReturnType<typeof createDiscountSchema>>;

export function toDiscountRequest(
  values: DiscountFormValues
): App.Requests.Merchant.Discount.StoreDiscountRequest {
  return {
    name: values.name.trim(),
    unit: values.unit,
    value: Number(values.value),
    start: values.start || null,
    end: values.end || null,
    active: values.active,
    products: values.products.length ? values.products : null,
  };
}

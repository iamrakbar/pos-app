import type { Translate } from "@/locales";
import { z } from "zod";

export function createSupplierSchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255, t("validation.nameTooLong")),
    contact_name: z.string().trim().max(255, t("validation.nameTooLong")),
    email: z
      .string()
      .trim()
      .max(255, t("validation.nameTooLong"))
      .refine((value) => value === "" || z.email().safeParse(value).success, {
        message: t("validation.emailInvalid"),
      }),
    phone: z.string().trim().max(32, t("validation.merchantPhoneTooLong")),
    lead_time_days: z
      .string()
      .regex(/^\d*$/, t("validation.wholeNumber"))
      .refine((value) => value === "" || Number(value) >= 0, t("validation.nonNegative")),
    payment_terms: z.string().trim().max(255, t("validation.nameTooLong")),
    active: z.boolean(),
  });
}

export type SupplierFormValues = z.infer<ReturnType<typeof createSupplierSchema>>;

export function toSupplierRequest(
  values: SupplierFormValues
): App.Requests.Merchant.Supplier.StoreSupplierRequest {
  return {
    name: values.name.trim(),
    contact_name: values.contact_name.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    lead_time_days: values.lead_time_days === "" ? null : Number(values.lead_time_days),
    payment_terms: values.payment_terms.trim() || null,
    active: values.active,
  };
}

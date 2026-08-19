import type { Translate } from "@/locales";
import { z } from "zod";

export function createMerchantProfileSchema(t: Translate) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("validation.merchantNameRequired"))
        .max(255, t("validation.merchantNameTooLong")),
      description: z.string().trim().max(2000, t("validation.merchantDescriptionTooLong")),
      phone: z.string().trim().max(32, t("validation.merchantPhoneTooLong")),
      email: z
        .string()
        .trim()
        .max(255)
        .refine((value) => value === "" || z.email().safeParse(value).success, {
          message: t("validation.merchantEmailInvalid"),
        }),
      website: z.string().trim().max(255, t("validation.merchantWebsiteTooLong")),
      terms: z.string().trim().max(2000, t("validation.merchantTermsTooLong")),
      auto_process_on_payment_settlement: z.boolean(),
      dine_in: z.boolean(),
      takeaway: z.boolean(),
      delivery: z.boolean(),
      tax_is_enable: z.boolean(),
      tax_name: z.string().trim().max(100, t("validation.merchantTaxNameTooLong")),
      tax_value: z.string().trim(),
      charge_app_payment_fee_to_customer: z.boolean(),
    })
    .superRefine((values, context) => {
      if (!values.tax_is_enable) return;
      if (values.tax_name === "") {
        context.addIssue({
          code: "custom",
          path: ["tax_name"],
          message: t("validation.merchantTaxNameRequired"),
        });
      }
      const taxValue = Number(values.tax_value);
      if (values.tax_value === "" || !Number.isFinite(taxValue) || taxValue < 0) {
        context.addIssue({
          code: "custom",
          path: ["tax_value"],
          message: t("validation.merchantTaxValueInvalid"),
        });
      }
    });
}

export type MerchantProfileFormValues = z.infer<ReturnType<typeof createMerchantProfileSchema>>;

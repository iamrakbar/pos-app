import type { ProductImageAsset } from "@/api/endpoints/products";
import type { Translate } from "@/locales";
import { z } from "zod";

export function createProductSchema(t: Translate) {
  return z
    .object({
      category_id: z.string().min(1, t("validation.productCategoryRequired")),
      name: z
        .string()
        .trim()
        .min(1, t("validation.productNameRequired"))
        .max(255, t("validation.productNameTooLong")),
      description: z.string().trim().max(2000, t("validation.productDescriptionTooLong")),
      price: z
        .string()
        .trim()
        .superRefine((value, context) => {
          const parsed = Number(value);
          if (value === "" || !Number.isFinite(parsed) || parsed < 0) {
            context.addIssue({ code: "custom", message: t("validation.productPriceInvalid") });
          }
        }),
      code: z.string().trim().max(100, t("validation.productCodeTooLong")),
      stock_enabled: z.boolean(),
      stock: z.string().trim(),
      stock_alert: z.string().trim(),
      active: z.boolean(),
      image: z.custom<ProductImageAsset>().nullable(),
    })
    .superRefine((values, context) => {
      if (!values.stock_enabled) return;
      const stock = Number(values.stock);
      if (values.stock === "" || !Number.isInteger(stock) || stock < 0) {
        context.addIssue({
          code: "custom",
          path: ["stock"],
          message: t("validation.productStockInvalid"),
        });
      }
      if (values.stock_alert !== "") {
        const alert = Number(values.stock_alert);
        if (!Number.isInteger(alert) || alert < 0) {
          context.addIssue({
            code: "custom",
            path: ["stock_alert"],
            message: t("validation.productStockAlertInvalid"),
          });
        }
      }
    });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;

import type { ProductImageAsset } from "@/api/endpoints/products";
import type { Translate } from "@/locales";
import { z } from "zod";

export function createProductSchema(t: Translate) {
  const nestedAddOnOptionSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.optionNameRequired", { number: 1 }))
      .max(255, t("validation.optionNameTooLong")),
    price: z.string().regex(/^\d+$/, t("validation.priceWholeNumber")),
  });
  const nestedAddOnSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255, t("validation.nameTooLong")),
    required: z.boolean(),
    multiple: z.boolean(),
    min: z.string(),
    max: z.string(),
    options: z.array(nestedAddOnOptionSchema).min(1, t("validation.addOption")),
  });

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
      add_ons: z.array(nestedAddOnSchema),
    })
    .superRefine((values, context) => {
      if (values.stock_enabled) {
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
      }

      values.add_ons.forEach((addOn, addOnIndex) => {
        const min = addOn.required ? Number(addOn.min) : 0;
        const max = addOn.multiple ? Number(addOn.max) : 1;

        if (addOn.multiple && addOn.required && !/^\d+$/.test(addOn.min)) {
          context.addIssue({
            code: "custom",
            path: ["add_ons", addOnIndex, "min"],
            message: t("validation.minimumWholeNumber"),
          });
        }
        if (addOn.multiple && !/^\d+$/.test(addOn.max)) {
          context.addIssue({
            code: "custom",
            path: ["add_ons", addOnIndex, "max"],
            message: t("validation.maximumWholeNumber"),
          });
        }
        if (addOn.multiple && max < 2) {
          context.addIssue({
            code: "custom",
            path: ["add_ons", addOnIndex, "max"],
            message: t("validation.maximumAtLeastTwo"),
          });
        }
        if (addOn.multiple && addOn.required && min < 1) {
          context.addIssue({
            code: "custom",
            path: ["add_ons", addOnIndex, "min"],
            message: t("validation.minimumAtLeastOne"),
          });
        }
        if (min > max) {
          context.addIssue({
            code: "custom",
            path: ["add_ons", addOnIndex, "max"],
            message: t("validation.maximumBelowMinimum"),
          });
        }
        if (max > addOn.options.length) {
          context.addIssue({
            code: "custom",
            path: ["add_ons", addOnIndex, "max"],
            message: t("validation.maximumExceedsOptions"),
          });
        }
      });
    });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;

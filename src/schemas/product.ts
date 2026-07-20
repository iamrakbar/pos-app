import type { ProductImageAsset } from "@/api/endpoints/products";
import { z } from "zod";

export const productSchema = z
  .object({
    category_id: z.string().min(1, "Select a category"),
    name: z
      .string()
      .trim()
      .min(1, "Product name is required")
      .max(255, "Use 255 characters or fewer"),
    description: z.string().trim().max(2000, "Use 2,000 characters or fewer"),
    price: z
      .string()
      .trim()
      .superRefine((value, context) => {
        const parsed = Number(value);
        if (value === "" || !Number.isFinite(parsed) || parsed < 0) {
          context.addIssue({ code: "custom", message: "Enter a valid price of zero or more" });
        }
      }),
    code: z.string().trim().max(100, "Use 100 characters or fewer"),
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
        message: "Available stock must be a whole number of zero or more",
      });
    }
    if (values.stock_alert !== "") {
      const alert = Number(values.stock_alert);
      if (!Number.isInteger(alert) || alert < 0) {
        context.addIssue({
          code: "custom",
          path: ["stock_alert"],
          message: "Low-stock alert must be a whole number of zero or more",
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

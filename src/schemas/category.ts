import type { Translate } from "@/locales";
import { z } from "zod";

export function createCategorySchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255, t("validation.nameTooLong")),
    description: z.string().trim().max(1000, t("validation.descriptionTooLong")),
    position: z
      .string()
      .regex(/^\d+$/, t("validation.positionWholeNumber"))
      .refine((value) => Number(value) >= 0, t("validation.positionNegative")),
    active: z.boolean(),
  });
}

export type CategoryFormValues = z.infer<ReturnType<typeof createCategorySchema>>;

export function toCategoryRequest(
  values: CategoryFormValues
): App.Requests.Merchant.Category.StoreCategoryRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    position: Number(values.position),
    active: values.active,
  };
}

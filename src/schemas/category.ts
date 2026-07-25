import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().trim().max(1000, "Description is too long"),
  position: z
    .string()
    .regex(/^\d+$/, "Position must be a whole number")
    .refine((value) => Number(value) >= 0, "Position cannot be negative"),
  active: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

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

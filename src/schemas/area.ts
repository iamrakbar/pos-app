import { z } from "zod";

export const areaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
});

export type AreaFormValues = z.infer<typeof areaSchema>;

export const tableSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  pax: z
    .string()
    .regex(/^\d+$/, "Capacity must be a whole number")
    .refine((value) => Number(value) >= 1, "Capacity must be at least 1"),
  active: z.boolean(),
});

export type TableFormValues = z.infer<typeof tableSchema>;

export function toTableRequest(
  values: TableFormValues
): App.Requests.Merchant.Area.StoreTableRequest {
  return {
    name: values.name.trim(),
    pax: Number(values.pax),
    active: values.active,
  };
}

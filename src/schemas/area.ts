import type { Translate } from "@/locales";
import { z } from "zod";

export function createAreaSchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255, t("validation.nameTooLong")),
  });
}

export type AreaFormValues = z.infer<ReturnType<typeof createAreaSchema>>;

export function createTableSchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255, t("validation.nameTooLong")),
    pax: z
      .string()
      .regex(/^\d+$/, t("validation.capacityWholeNumber"))
      .refine((value) => Number(value) >= 1, t("validation.capacityMinimum")),
    active: z.boolean(),
  });
}

export type TableFormValues = z.infer<ReturnType<typeof createTableSchema>>;

export function toTableRequest(
  values: TableFormValues
): App.Requests.Merchant.Area.StoreTableRequest {
  return {
    name: values.name.trim(),
    pax: Number(values.pax),
    active: values.active,
  };
}

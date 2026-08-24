import type { Translate } from "@/locales";
import { z } from "zod";

export function createAddOnManagementSchema(t: Translate) {
  const optionSchema = z.object({
    id: z.string().nullable(),
    name: z.string().trim().max(255, t("validation.optionNameTooLong")),
    price: z.string().regex(/^\d+$/, t("validation.priceWholeNumber")),
    destroyed: z.boolean(),
  });

  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("validation.nameRequired"))
        .max(255, t("validation.nameTooLong")),
      required: z.boolean(),
      multiple: z.boolean(),
      min: z.string(),
      max: z.string(),
      options: z.array(optionSchema),
    })
    .superRefine((values, context) => {
      const activeOptions = values.options.filter((option) => !option.destroyed);
      const min = values.multiple && values.required ? Number(values.min) : values.required ? 1 : 0;
      const max = values.multiple ? Number(values.max) : 1;
      if (values.multiple && values.required && !/^\d+$/.test(values.min)) {
        context.addIssue({
          code: "custom",
          path: ["min"],
          message: t("validation.minimumWholeNumber"),
        });
      }
      if (values.multiple && !/^\d+$/.test(values.max)) {
        context.addIssue({
          code: "custom",
          path: ["max"],
          message: t("validation.maximumWholeNumber"),
        });
      }
      if (values.multiple && max < 2) {
        context.addIssue({
          code: "custom",
          path: ["max"],
          message: t("validation.maximumAtLeastTwo"),
        });
      }
      if (values.multiple && values.required && min < 1) {
        context.addIssue({
          code: "custom",
          path: ["min"],
          message: t("validation.minimumAtLeastOne"),
        });
      }
      if (min > max) {
        context.addIssue({
          code: "custom",
          path: ["max"],
          message: t("validation.maximumBelowMinimum"),
        });
      }
      if (activeOptions.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["options"],
          message: t("validation.addOption"),
        });
      }
      if (max > activeOptions.length) {
        context.addIssue({
          code: "custom",
          path: ["max"],
          message: t("validation.maximumExceedsOptions"),
        });
      }
      activeOptions.forEach((option, index) => {
        if (!option.name) {
          context.addIssue({
            code: "custom",
            path: ["options", values.options.indexOf(option), "name"],
            message: t("validation.optionNameRequired", { number: index + 1 }),
          });
        }
      });
    });
}

export type AddOnManagementValues = z.infer<ReturnType<typeof createAddOnManagementSchema>>;

export type AddOnManagementRequest = {
  name: string;
  required: boolean;
  multiple: boolean;
  min: number;
  max: number;
  options: {
    id?: string | null;
    name: string;
    price: number;
    _destroy?: boolean;
  }[];
};

export function toAddOnRequest(values: AddOnManagementValues): AddOnManagementRequest {
  return {
    name: values.name.trim(),
    required: values.required,
    multiple: values.multiple,
    min: values.multiple && values.required ? Number(values.min) : values.required ? 1 : 0,
    max: values.multiple ? Number(values.max) : 1,
    options: values.options.map((option) => ({
      id: option.id,
      name: option.name.trim(),
      price: Number(option.price),
      _destroy: option.destroyed || undefined,
    })),
  };
}

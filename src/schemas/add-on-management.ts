import { z } from "zod";

const optionSchema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().max(255, "Option name is too long"),
  price: z.string().regex(/^\d+$/, "Price must be a whole number"),
  destroyed: z.boolean(),
});

export const addOnManagementSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
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
        message: "Minimum must be a whole number",
      });
    }
    if (values.multiple && !/^\d+$/.test(values.max)) {
      context.addIssue({
        code: "custom",
        path: ["max"],
        message: "Maximum must be a whole number",
      });
    }
    if (values.multiple && max < 2) {
      context.addIssue({
        code: "custom",
        path: ["max"],
        message: "Maximum must be at least 2 for multiple selection",
      });
    }
    if (values.multiple && values.required && min < 1) {
      context.addIssue({
        code: "custom",
        path: ["min"],
        message: "Minimum must be at least 1 when a selection is required",
      });
    }
    if (min > max) {
      context.addIssue({
        code: "custom",
        path: ["max"],
        message: "Maximum must be greater than or equal to minimum",
      });
    }
    if (activeOptions.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Add at least one option",
      });
    }
    if (max > activeOptions.length) {
      context.addIssue({
        code: "custom",
        path: ["max"],
        message: "Maximum cannot exceed the number of available options",
      });
    }
    activeOptions.forEach((option, index) => {
      if (!option.name) {
        context.addIssue({
          code: "custom",
          path: ["options", values.options.indexOf(option), "name"],
          message: `Option ${index + 1} needs a name`,
        });
      }
    });
  });

export type AddOnManagementValues = z.infer<typeof addOnManagementSchema>;

export type AddOnManagementRequest = {
  name: string;
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

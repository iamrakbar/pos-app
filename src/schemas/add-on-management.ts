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
    min: z.string().regex(/^\d+$/, "Minimum must be a whole number"),
    max: z.string().regex(/^\d+$/, "Maximum must be a whole number"),
    options: z.array(optionSchema),
  })
  .superRefine((values, context) => {
    const activeOptions = values.options.filter((option) => !option.destroyed);
    const min = Number(values.min);
    const max = Number(values.max);
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
    min: Number(values.min),
    max: Number(values.max),
    options: values.options.map((option) => ({
      id: option.id,
      name: option.name.trim(),
      price: Number(option.price),
      _destroy: option.destroyed || undefined,
    })),
  };
}

import type { Translate } from "@/locales";
import type { AddOnGroup } from "@/types/pos";
import { z } from "zod";

export function createAddOnSchema(groups: AddOnGroup[], t: Translate) {
  return z
    .object({
      radioSelections: z.record(z.string(), z.string()),
      checkboxSelections: z.record(z.string(), z.array(z.string())),
      notes: z.string(),
    })
    .superRefine((data, ctx) => {
      for (const group of groups) {
        if (!group.required) continue;
        if (!group.multiple) {
          if (!data.radioSelections[group.id]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("validation.addOnRequired", { group: group.name }),
              path: ["radioSelections", group.id],
            });
          }
        } else {
          const selected = data.checkboxSelections[group.id] ?? [];
          if (selected.length < group.min) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("validation.addOnMinimum", {
                group: group.name,
                min: group.min,
              }),
              path: ["checkboxSelections", group.id],
            });
          }
        }
      }
    });
}

export type AddOnFormValues = z.infer<ReturnType<typeof createAddOnSchema>>;

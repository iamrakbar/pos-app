import { z } from 'zod';
import type { AddOnGroup } from '@/types/pos';

export function createAddOnSchema(groups: AddOnGroup[]) {
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
              message: `${group.name} wajib diisi`,
              path: ['radioSelections', group.id],
            });
          }
        } else {
          const selected = data.checkboxSelections[group.id] ?? [];
          if (selected.length < group.min) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${group.name} wajib diisi (min. ${group.min})`,
              path: ['checkboxSelections', group.id],
            });
          }
        }
      }
    });
}

export type AddOnFormValues = z.infer<ReturnType<typeof createAddOnSchema>>;

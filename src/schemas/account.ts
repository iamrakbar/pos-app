import type { Translate } from "@/locales";
import { z } from "zod";

export function createAccountSchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.nameRequired"))
      .max(255, t("validation.nameTooLong")),
    email: z.string(),
    role: z.string(),
    roleLabel: z.string(),
    merchantIds: z.array(z.string()),
  });
}

export type AccountFormValues = z.infer<ReturnType<typeof createAccountSchema>>;

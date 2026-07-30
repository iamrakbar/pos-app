import type { Translate } from "@/locales";
import { z } from "zod";

export function createLoginSchema(t: Translate) {
  return z.object({
    email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

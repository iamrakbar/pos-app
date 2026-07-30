import type { Translate } from "@/locales";
import { z } from "zod";

export function createPrinterSchema(t: Translate) {
  return z
    .object({
      connection: z.enum(["bluetooth", "wifi"]),
      name: z.string().trim().min(1, t("validation.printerNameRequired")),
      macAddress: z.string().trim(),
      ipAddress: z.string().trim(),
      port: z
        .string()
        .trim()
        .refine((value) => value === "" || /^\d+$/.test(value), t("validation.printerPortNumeric")),
      paperWidth: z.enum(["58mm", "80mm"]),
      charactersPerLine: z
        .string()
        .trim()
        .regex(/^\d+$/, t("validation.printerCharactersNumeric"))
        .refine(
          (value) => Number(value) >= 24 && Number(value) <= 64,
          t("validation.printerCharactersRange")
        ),
      logoWidthDots: z
        .string()
        .trim()
        .regex(/^\d+$/, t("validation.printerLogoWidthNumeric"))
        .refine(
          (value) => Number(value) >= 100 && Number(value) <= 280,
          t("validation.printerLogoWidthRange")
        ),
      cutReceipt: z.boolean(),
      openDrawer: z.boolean(),
      selectedDeviceId: z.string().trim(),
    })
    .superRefine((value, ctx) => {
      const maxLogoWidth = value.paperWidth === "80mm" ? 280 : 200;
      if (Number(value.logoWidthDots) > maxLogoWidth) {
        ctx.addIssue({
          code: "custom",
          path: ["logoWidthDots"],
          message: t("validation.printerLogoWidthRange"),
        });
      }

      if (value.connection === "bluetooth") {
        if (!value.macAddress && !value.selectedDeviceId) {
          ctx.addIssue({
            code: "custom",
            path: ["macAddress"],
            message: t("validation.printerBluetoothRequired"),
          });
        }
        return;
      }

      if (!value.ipAddress) {
        ctx.addIssue({
          code: "custom",
          path: ["ipAddress"],
          message: t("validation.printerIpRequired"),
        });
      }

      const parsedPort = Number(value.port || "9100");
      if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        ctx.addIssue({
          code: "custom",
          path: ["port"],
          message: t("validation.printerPortRange"),
        });
      }
    });
}

export type PrinterFormValues = z.infer<ReturnType<typeof createPrinterSchema>>;

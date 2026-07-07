import { z } from "zod";

export const printerSchema = z
  .object({
    connection: z.enum(["bluetooth", "wifi"]),
    name: z.string().trim().min(1, "Printer name is required"),
    macAddress: z.string().trim(),
    ipAddress: z.string().trim(),
    port: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+$/.test(value), "Port must be numeric"),
    paperWidth: z.enum(["58mm", "80mm"]),
    cutReceipt: z.boolean(),
    openDrawer: z.boolean(),
    selectedDeviceId: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.connection === "bluetooth") {
      if (!value.macAddress && !value.selectedDeviceId) {
        ctx.addIssue({
          code: "custom",
          path: ["macAddress"],
          message: "Select a Bluetooth device or enter a MAC address",
        });
      }
      return;
    }

    if (!value.ipAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["ipAddress"],
        message: "IP address is required",
      });
    }

    const parsedPort = Number(value.port || "9100");
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      ctx.addIssue({
        code: "custom",
        path: ["port"],
        message: "Port must be between 1 and 65535",
      });
    }
  });

export type PrinterFormValues = z.infer<typeof printerSchema>;

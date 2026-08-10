import type { Translate } from "@/locales";
import { z } from "zod";

const checkoutProductOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

const checkoutProductAddOnSchema = z.object({
  id: z.string(),
  name: z.string(),
  options: z.array(checkoutProductOptionSchema).optional().nullable(),
});

const checkoutProductSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  name: z.string(),
  qty: z.number(),
  price: z.number(),
  subtotal: z.number(),
  notes: z.string().optional().nullable(),
  add_ons: z.array(checkoutProductAddOnSchema).optional().nullable(),
});

export function createCheckoutSchema(t: Translate) {
  return z
    .object({
      order_type: z.enum(["dine-in", "takeaway"]),
      table_id: z.string().nullable(),
      pickup_time: z.string().nullable(),
      payment_group: z.string().min(1, t("validation.paymentGroupRequired")),
      payment_id: z.string().min(1, t("validation.paymentMethodRequired")),
      tender_value: z.string().nullable(),
      customer_type: z.enum(["guest", "customer", "anonymous"]),
      guest_id: z.string().nullable(),
      customer_id: z.string().nullable(),
      customer_search: z.string(),
      notes: z.string(),
      products: z.array(checkoutProductSchema).min(1, t("validation.cartEmpty")),
    })
    .superRefine((values, ctx) => {
      if (values.customer_type === "guest" && !values.guest_id) {
        ctx.addIssue({
          code: "custom",
          path: ["guest_id"],
          message: t("validation.guestRequired"),
        });
      }
      if (values.customer_type === "customer" && !values.customer_id) {
        ctx.addIssue({
          code: "custom",
          path: ["customer_id"],
          message: t("validation.customerRequired"),
        });
      }
      if (values.order_type === "takeaway") {
        if (!values.pickup_time) {
          ctx.addIssue({
            code: "custom",
            path: ["pickup_time"],
            message: t("validation.pickupTimeRequired"),
          });
          return;
        }

        const timeParts = /^(\d{2}):(\d{2})$/.exec(values.pickup_time);
        if (!timeParts) {
          ctx.addIssue({
            code: "custom",
            path: ["pickup_time"],
            message: t("validation.pickupTimeInvalid"),
          });
          return;
        }

        const hour = Number(timeParts[1]);
        const minute = Number(timeParts[2]);
        const now = new Date();
        if (hour * 60 + minute <= now.getHours() * 60 + now.getMinutes()) {
          ctx.addIssue({
            code: "custom",
            path: ["pickup_time"],
            message: t("validation.pickupTimePast"),
          });
        }
      }
    });
}

export type CheckoutFormValues = z.infer<ReturnType<typeof createCheckoutSchema>>;

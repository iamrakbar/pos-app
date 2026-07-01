import { z } from 'zod';

export const checkoutSchema = z.object({
  order_type: z.enum(['dine-in', 'takeaway']),
  table_id: z.string().nullable(),
  pickup_time: z.string().nullable(),
  payment_group: z.enum(['e-money', 'cash']),
  payment_id: z.string().min(1, 'Pilih metode pembayaran'),
  customer_type: z.enum(['guest', 'customer', 'anonymous']),
  guest_id: z.string().nullable(),
  customer_id: z.string().nullable(),
  customer_search: z.string(),
  notes: z.string(),
}).superRefine((values, ctx) => {
  if (values.customer_type === 'guest' && !values.guest_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['guest_id'],
      message: 'Pilih atau buat guest terlebih dahulu',
    });
  }
  if (values.customer_type === 'customer' && !values.customer_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['customer_id'],
      message: 'Cari dan pilih pelanggan terlebih dahulu',
    });
  }
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

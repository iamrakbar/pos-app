import { z } from 'zod';

export const checkoutSchema = z.object({
  order_type: z.enum(['dine-in', 'takeaway']),
  table_id: z.string().nullable(),
  payment_group: z.enum(['e-money', 'cash']),
  payment_id: z.string().min(1, 'Pilih metode pembayaran'),
  customer_type: z.enum(['merchant', 'registered']),
  customer_search: z.string(),
  notes: z.string(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

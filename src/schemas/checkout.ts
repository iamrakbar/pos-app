import { z } from 'zod';

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

export const checkoutSchema = z.object({
  order_type: z.enum(['dine-in', 'takeaway']),
  table_id: z.string().nullable(),
  pickup_time: z.string().nullable(),
  payment_group: z.string().min(1, 'Pilih grup pembayaran'),
  payment_id: z.string().min(1, 'Pilih metode pembayaran'),
  customer_type: z.enum(['guest', 'customer', 'anonymous']),
  guest_id: z.string().nullable(),
  customer_id: z.string().nullable(),
  customer_search: z.string(),
  notes: z.string(),
  products: z.array(checkoutProductSchema).min(1, 'Keranjang kosong'),
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

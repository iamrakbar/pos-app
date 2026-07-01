import { z } from 'zod';

export const guestSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export type GuestFormValues = z.infer<typeof guestSchema>;

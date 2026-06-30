import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi'),
    price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
    original_price: z.coerce.number().min(0).nullable(),
    image_url: z.string().nullable(),
    thumbnail_url: z.string().nullable(),
    category_id: z.string().nullable(),
    is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGuest, listGuests } from '@/api/endpoints/guests';
import { useAuth } from '@/stores/useAuth';
import type { GuestFormValues } from '@/schemas/guest';

export function useGuests() {
    const merchantId = useAuth((s) => s.merchantId);
    return useQuery({
        queryKey: ['guests', merchantId],
        queryFn: async () => (await listGuests(merchantId!)).data,
        enabled: !!merchantId,
    });
}

export function useCreateGuest() {
    const merchantId = useAuth((s) => s.merchantId);
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: GuestFormValues) =>
            (
                await createGuest(merchantId!, {
                    name: values.name,
                    email: values.email || null,
                    phone: values.phone || null,
                })
            ).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guests', merchantId] });
        },
    });
}

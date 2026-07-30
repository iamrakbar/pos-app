import { getCurrentUser, updateCurrentUser } from "@/api/endpoints/auth";
import { useAuth } from "@/stores/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ACCOUNT_STALE_TIME_MS = 5 * 60 * 1000;
export const accountProfileKey = ["account-profile"] as const;

export function useAccountProfile() {
  const token = useAuth((state) => state.token);

  return useQuery({
    queryKey: accountProfileKey,
    queryFn: async () => (await getCurrentUser()).data.user,
    enabled: Boolean(token),
    staleTime: ACCOUNT_STALE_TIME_MS,
  });
}

export function useUpdateAccountProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Auth.UpdateProfileRequest) =>
      (await updateCurrentUser(values)).data.user,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: accountProfileKey });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(accountProfileKey, user);
    },
  });
}

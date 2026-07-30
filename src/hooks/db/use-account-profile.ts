import { getCurrentUser, updateCurrentUser } from "@/api/endpoints/auth";
import { useAuth } from "@/stores/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const ACCOUNT_STALE_TIME_MS = 5 * 60 * 1000;
const accountProfileKey = ["account-profile"] as const;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function mergeUserProfile(
  current: App.Data.Merchant.Auth.MerchantUserProfileData | null,
  incoming: App.Data.Merchant.Auth.MerchantUserProfileData
): App.Data.Merchant.Auth.MerchantUserProfileData {
  return {
    id: hasText(incoming.id) ? incoming.id : (current?.id ?? ""),
    name: hasText(incoming.name) ? incoming.name : (current?.name ?? ""),
    email: hasText(incoming.email) ? incoming.email : (current?.email ?? ""),
    role: hasText(incoming.role) ? incoming.role : (current?.role ?? ""),
    role_label: hasText(incoming.role_label)
      ? incoming.role_label
      : (current?.role_label ?? ""),
  };
}

export function useAccountProfile() {
  const token = useAuth((state) => state.token);
  const user = useAuth((state) => state.user);
  const selectUser = useCallback(
    (cachedUser: App.Data.Merchant.Auth.MerchantUserProfileData) =>
      mergeUserProfile(user, cachedUser),
    [user]
  );

  return useQuery({
    queryKey: accountProfileKey,
    queryFn: async () => {
      const responseUser = (await getCurrentUser()).data;
      const latestUser = mergeUserProfile(useAuth.getState().user, responseUser);
      useAuth.getState().setUser(latestUser);
      return latestUser;
    },
    enabled: Boolean(token),
    initialData: user ?? undefined,
    initialDataUpdatedAt: 0,
    select: selectUser,
    staleTime: ACCOUNT_STALE_TIME_MS,
  });
}

export function useUpdateAccountProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuth((state) => state.setUser);

  return useMutation({
    mutationFn: async (values: App.Requests.Merchant.Auth.UpdateProfileRequest) => {
      const responseUser = (await updateCurrentUser(values)).data;
      return mergeUserProfile(useAuth.getState().user, responseUser);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(accountProfileKey, user);
      setUser(user);
    },
  });
}

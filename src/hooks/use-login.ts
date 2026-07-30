import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { login as loginRequest } from "@/api/endpoints/auth";
import { accountProfileKey } from "@/hooks/db/use-account-profile";
import { useAuth } from "@/stores/use-auth";
import type { LoginFormValues } from "@/schemas/auth";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginFormValues) => loginRequest(values),
    onSuccess: (payload) => {
      queryClient.clear();
      useAuth.getState().login(payload.data);
      queryClient.setQueryData(accountProfileKey, payload.data.user);
      router.replace("/(app)");
    },
  });
}

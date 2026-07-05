import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { login as loginRequest } from "@/api/endpoints/auth";
import { useAuth } from "@/stores/useAuth";
import type { LoginFormValues } from "@/schemas/auth";

export function useLogin() {
  return useMutation({
    mutationFn: (values: LoginFormValues) => loginRequest(values),
    onSuccess: (payload) => {
      useAuth.getState().login(payload.data);
      router.replace("/(app)");
    },
  });
}

import { Stack } from "expo-router/stack";
import type { JSX } from "react";

export default function AuthLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}

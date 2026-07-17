import { Stack } from "expo-router";
import { useNavigationTheme } from "@/utils/navigationTheme";

export default function POSFlowLayout() {
  const theme = useNavigationTheme();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "",
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          color: theme.foreground,
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="payment-success"
        options={{ title: "Payment Success", headerShown: false }}
      />
    </Stack>
  );
}

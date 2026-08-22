import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router/stack";
import { useTranslation } from "@/stores/use-locale";

export default function POSFlowLayout() {
  const theme = useNavigationTheme();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "",
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerShadowVisible: false,
        headerTintColor: theme.foreground,
        headerTitleStyle: {
          color: theme.foreground,
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("navigation.pos"), headerShown: false }} />
      <Stack.Screen name="cart" options={{ title: t("navigation.cart") }} />
      <Stack.Screen name="checkout" options={{ title: t("navigation.checkout") }} />
      <Stack.Screen
        name="table-selection"
        options={{
          title: t("navigation.selectTable"),
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: t("navigation.payment"),
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
          gestureEnabled: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen
        name="payment-success"
        options={{ title: t("navigation.paymentSuccess"), headerShown: false }}
      />
    </Stack>
  );
}

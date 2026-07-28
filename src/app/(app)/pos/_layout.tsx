import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router/stack";

export default function POSFlowLayout() {
  const theme = useNavigationTheme();
  const { isWide } = useResponsiveLayout();

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
      <Stack.Screen name="index" options={{ title: "POS", headerShown: false }} />
      <Stack.Screen name="cart" options={{ title: "Cart" }} />
      <Stack.Screen
        name="add-ons"
        options={{
          title: "Add-ons",
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.75, 1],
          sheetInitialDetentIndex: "last",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="table-selection"
        options={{
          title: "Select Table",
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: isWide ? [0.65, 0.9] : [0.65, 0.9, 1],
          sheetInitialDetentIndex: 1,
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          title: "Checkout",
          headerShown: !isWide,
          presentation: isWide ? "formSheet" : "card",
          sheetAllowedDetents: isWide ? [0.9, 1] : undefined,
          sheetInitialDetentIndex: isWide ? "last" : undefined,
          sheetGrabberVisible: isWide,
          contentStyle: {
            backgroundColor: isWide ? "transparent" : theme.background,
          },
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: "Payment",
          headerShown: false,
          presentation: isWide ? "formSheet" : "card",
          sheetAllowedDetents: isWide ? [0.9, 1] : undefined,
          sheetInitialDetentIndex: isWide ? "last" : undefined,
          sheetGrabberVisible: isWide,
          contentStyle: {
            backgroundColor: isWide ? "transparent" : theme.background,
          },
        }}
      />
      <Stack.Screen
        name="payment-success"
        options={{ title: "Payment Success", headerShown: false }}
      />
    </Stack>
  );
}

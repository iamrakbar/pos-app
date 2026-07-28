import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/stores/use-locale";

export default function POSFlowLayout() {
  const theme = useNavigationTheme();
  const { t } = useTranslation();
  const { height, isWide } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const maxSheetDetent = height > 0 ? Math.min(1, (height - insets.top) / height) : 1;

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
      <Stack.Screen
        name="add-ons"
        options={{
          title: t("navigation.addOns"),
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: [0.75, maxSheetDetent],
          sheetInitialDetentIndex: "last",
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="table-selection"
        options={{
          title: t("navigation.selectTable"),
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          title: t("navigation.checkout"),
          headerShown: !isWide,
          presentation: isWide ? "formSheet" : "card",
          sheetAllowedDetents: isWide ? [0.75, maxSheetDetent] : undefined,
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
          title: t("navigation.payment"),
          headerShown: false,
          presentation: isWide ? "formSheet" : "card",
          sheetAllowedDetents: isWide ? [0.75, maxSheetDetent] : undefined,
          sheetInitialDetentIndex: isWide ? "last" : undefined,
          sheetGrabberVisible: isWide,
          contentStyle: {
            backgroundColor: isWide ? "transparent" : theme.background,
          },
        }}
      />
      <Stack.Screen
        name="payment-success"
        options={{ title: t("navigation.paymentSuccess"), headerShown: false }}
      />
    </Stack>
  );
}

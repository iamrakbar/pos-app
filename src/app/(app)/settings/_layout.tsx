import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import { useTranslation } from "@/stores/use-locale";

export default function SettingsLayout() {
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
      <Stack.Screen
        name="index"
        options={{
          title: t("navigation.settings"),
          headerLeft: () => <DrawerMenuButton />,
        }}
      />
      <Stack.Screen name="account" options={{ title: t("navigation.account") }} />
      <Stack.Screen name="merchant-profile" options={{ title: t("navigation.merchantProfile") }} />
      <Stack.Screen name="preferences" options={{ title: t("settings.appPreferences") }} />
      <Stack.Screen name="printers" options={{ headerShown: false }} />
      <Stack.Screen name="receipt" options={{ title: t("navigation.receiptSetup") }} />
      <Stack.Screen name="updates" options={{ title: t("navigation.appUpdates") }} />
      <Stack.Screen name="notifications" options={{ title: t("settings.notifications") }} />
      <Stack.Screen name="payments" options={{ title: t("settings.payments") }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen
        name="discounts"
        options={{ title: t("navigation.discounts"), headerShown: false }}
      />
      <Stack.Screen name="areas" options={{ headerShown: false }} />
    </Stack>
  );
}

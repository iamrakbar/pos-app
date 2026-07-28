import { Stack } from "expo-router";
import { useNavigationTheme } from "@/utils/navigation-theme";
import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useTranslation } from "@/stores/use-locale";

export default function OrdersLayout() {
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
        options={{ title: t("navigation.orders"), headerLeft: () => <DrawerMenuButton /> }}
      />
      <Stack.Screen name="[id]" options={{ title: t("navigation.orderDetail") }} />
    </Stack>
  );
}

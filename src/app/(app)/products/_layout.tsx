import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import { useTranslation } from "@/stores/use-locale";

export default function ProductsLayout() {
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
          title: t("navigation.products"),
          headerLeft: () => <DrawerMenuButton />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: t("navigation.product") }} />
    </Stack>
  );
}

import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";

export default function EarningsLayout() {
  const theme = useNavigationTheme();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "",
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTintColor: theme.foreground,
        headerTitleStyle: { color: theme.foreground },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Earnings", headerLeft: () => <DrawerMenuButton /> }}
      />
    </Stack>
  );
}

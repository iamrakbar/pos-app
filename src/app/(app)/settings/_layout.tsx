import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";

export default function SettingsLayout() {
  const theme = useNavigationTheme();

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
          title: "Settings",
          headerLeft: () => <DrawerMenuButton />,
        }}
      />
      <Stack.Screen name="printer" options={{ title: "Printer" }} />
      <Stack.Screen name="printers/index" options={{ title: "Printers" }} />
      <Stack.Screen name="printers/[id]" options={{ title: "Printer" }} />
      <Stack.Screen name="receipt" options={{ title: "Receipt Setup" }} />
      <Stack.Screen name="updates" options={{ title: "App Updates" }} />
      <Stack.Screen name="areas/index" options={{ title: "Areas & Tables" }} />
      <Stack.Screen name="areas/[id]" options={{ title: "Area" }} />
      <Stack.Screen name="areas/[areaId]/tables" options={{ title: "Tables" }} />
    </Stack>
  );
}

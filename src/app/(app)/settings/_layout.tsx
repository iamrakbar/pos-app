import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import { useNavigationTheme } from "@/utils/navigationTheme";
import { Stack } from "expo-router";

export default function SettingsLayout() {
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
    </Stack>
  );
}

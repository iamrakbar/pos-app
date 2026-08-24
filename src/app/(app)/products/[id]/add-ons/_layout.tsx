import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import { useTranslation } from "@/stores/use-locale";

export default function ProductAddOnsLayout() {
  const theme = useNavigationTheme();
  const { t } = useTranslation();

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
      <Stack.Screen name="index" options={{ title: t("navigation.addOns") }} />
      <Stack.Screen name="[addOnId]" options={{ title: t("navigation.addOn") }} />
    </Stack>
  );
}

import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";
import { useTranslation } from "@/stores/use-locale";

export default function InventoryLayout(): React.JSX.Element {
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
      <Stack.Screen
        name="index"
        options={{
          title: t("navigation.inventoryOverview"),
          headerLeft: () => <DrawerMenuButton />,
        }}
      />
      <Stack.Screen name="ingredients" options={{ title: t("navigation.ingredients") }} />
      <Stack.Screen name="ingredients/[id]" options={{ title: t("ingredients.editTitle") }} />
      <Stack.Screen name="suppliers" options={{ title: t("navigation.suppliers") }} />
      <Stack.Screen name="suppliers/[id]" options={{ title: t("suppliers.editTitle") }} />
      <Stack.Screen name="movements" options={{ title: t("navigation.movements") }} />
      <Stack.Screen name="operations" options={{ title: t("navigation.operations") }} />
    </Stack>
  );
}

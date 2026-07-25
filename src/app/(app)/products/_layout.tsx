import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Stack } from "expo-router";

export default function ProductsLayout() {
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
          title: "Products",
          headerLeft: () => <DrawerMenuButton />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "Product" }} />
      <Stack.Screen name="categories/index" options={{ title: "Categories" }} />
      <Stack.Screen name="categories/[id]" options={{ title: "Category" }} />
      <Stack.Screen name="[productId]/add-ons/index" options={{ title: "Add-ons" }} />
      <Stack.Screen name="[productId]/add-ons/[addOnId]" options={{ title: "Add-on" }} />
    </Stack>
  );
}

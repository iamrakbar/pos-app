import { Drawer } from "expo-router/drawer";
import AppDrawerContent from "@/components/navigation/AppDrawerContent";
import { useNavigationTheme } from "@/utils/navigationTheme";

export default function AppLayout() {
  const theme = useNavigationTheme();

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.background,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
        drawerContentStyle: {
          backgroundColor: theme.background,
        },
        drawerActiveBackgroundColor: theme.surfaceSecondary,
        drawerActiveTintColor: theme.foreground,
        drawerInactiveTintColor: theme.muted,
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.foreground,
        sceneStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "POS",
          drawerLabel: "POS",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          title: "Products",
          drawerLabel: "Products",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="orders"
        options={{
          title: "Orders",
          drawerLabel: "Orders",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="earnings"
        options={{
          title: "Earnings",
          drawerLabel: "Earnings",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
          drawerLabel: "Settings",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="pos"
        options={{
          title: "POS",
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
    </Drawer>
  );
}

import { Drawer } from "expo-router/drawer";
import AppDrawerContent from "@/components/navigation/app-drawer-content";
import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";

export default function AppLayout() {
  const theme = useNavigationTheme();
  const router = useRouter();
  const { width, isCompact } = useResponsiveLayout();
  const drawerWidth = Math.min(isCompact ? width - 48 : 320, 320);

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        swipeEnabled: true,
        drawerStyle: {
          width: drawerWidth,
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
          backgroundColor: theme.background,
        },
        headerShadowVisible: false,
        headerTintColor: theme.foreground,
        sceneStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Dashboard",
          drawerLabel: "Dashboard",
          headerShown: true,
          headerLeft: () => <DrawerMenuButton />,
          headerRight: () => (
            <Button variant="ghost" size="sm" onPress={() => router.push("/pos")}>
              <Ionicons name="calculator-outline" size={16} color={theme.foreground} />
              <Button.Label>POS</Button.Label>
            </Button>
          ),
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
        name="categories"
        options={{
          title: "Categories",
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
          drawerLabel: "POS",
          headerShown: false,
        }}
      />
    </Drawer>
  );
}

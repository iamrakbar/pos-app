import { Drawer } from "expo-router/drawer";
import AppDrawerContent from "@/components/navigation/app-drawer-content";
import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNavigationTheme } from "@/utils/navigation-theme";
import AppIcon from "@/components/common/app-icon";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { useTranslation } from "@/stores/use-locale";
import { useAuth } from "@/stores/use-auth";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";

export default function AppLayout() {
  useMerchantProfile();

  const theme = useNavigationTheme();
  const accentForeground = useThemeColor("accent-foreground");
  const { t } = useTranslation();
  const router = useRouter();
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const kdsEnabled = activeMerchant?.features?.kds === true;
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
          title: t("navigation.dashboard"),
          drawerLabel: t("navigation.dashboard"),
          headerShown: true,
          headerLeft: () => <DrawerMenuButton />,
          headerRightContainerStyle: { paddingRight: 12 },
          headerRight: () => (
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push("/pos")}
              accessibilityLabel={t("navigation.openPosAccessibility")}
            >
              <AppIcon name="calculator-outline" size={16} color={accentForeground} />
              <Button.Label>{t("navigation.openPos")}</Button.Label>
            </Button>
          ),
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          title: t("navigation.products"),
          drawerLabel: t("navigation.products"),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="orders"
        options={{
          title: t("navigation.orders"),
          drawerLabel: t("navigation.orders"),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="kds"
        options={{
          title: t("navigation.kds"),
          drawerLabel: t("navigation.kds"),
          headerShown: false,
          drawerItemStyle: kdsEnabled ? undefined : { display: "none" },
        }}
      />
      <Drawer.Screen
        name="earnings"
        options={{
          title: t("navigation.earnings"),
          drawerLabel: t("navigation.earnings"),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: t("navigation.settings"),
          drawerLabel: t("navigation.settings"),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="pos"
        options={{
          title: t("navigation.pos"),
          drawerLabel: t("navigation.pos"),
          headerShown: false,
        }}
      />
    </Drawer>
  );
}

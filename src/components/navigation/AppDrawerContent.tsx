import Logo from "@/components/common/logo";
import LogoutConfirmationDialog from "@/components/common/LogoutConfirmationDialog";
import { t } from "@/locales";
import { useAuth } from "@/stores/useAuth";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useThemeStore, type ThemeMode } from "@/stores/useThemeStore";
import { Ionicons } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "expo-router/drawer";
import { Avatar, Popover, Surface, Typography, useThemeColor } from "heroui-native";
import type { ComponentProps, JSX } from "react";
import { useState } from "react";
import { Pressable, View } from "react-native";

type DrawerRouteName = "index" | "products" | "orders" | "earnings" | "settings";

const DRAWER_ROUTE_ORDER: DrawerRouteName[] = [
  "index",
  "orders",
  "earnings",
  "products",
  "settings",
];

const DRAWER_ICONS: Record<DrawerRouteName, ComponentProps<typeof Ionicons>["name"]> = {
  index: "grid-outline",
  products: "fast-food-outline",
  orders: "receipt-outline",
  earnings: "wallet-outline",
  settings: "settings-outline",
};

const DRAWER_DESCRIPTIONS: Record<DrawerRouteName, string> = {
  index: "Sales workspace",
  products: "Catalog and add-ons",
  orders: "Transactions and status",
  earnings: "Revenue and sales summary",
  settings: "Preferences and setup",
};

const THEME_ACTIONS: {
  value: ThemeMode;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
}[] = [
  { value: "light", icon: "sunny-outline", label: "Use light theme" },
  { value: "dark", icon: "moon-outline", label: "Use dark theme" },
  { value: "system", icon: "desktop-outline", label: "Use device theme" },
];

function getRouteLabel(routeName: string): string {
  if (routeName === "index") return "POS";
  if (routeName === "products") return "Products";
  if (routeName === "orders") return "Orders";
  if (routeName === "earnings") return "Earnings";
  if (routeName === "settings") return "Settings";
  return routeName;
}

export default function AppDrawerContent({
  state,
  descriptors,
  navigation,
}: DrawerContentComponentProps): JSX.Element {
  const [
    themeColorAccent,
    themeColorAccentForeground,
    themeColorMuted,
    themeColorAccentSoftForeground,
    themeColorWarningSoftForeground,
  ] = useThemeColor([
    "accent",
    "accent-foreground",
    "muted",
    "accent-soft-foreground",
    "warning-soft-foreground",
  ]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const activeMerchant = useAuth((s) => s.activeMerchant);
  const isOffline = useNetworkStore((s) => s.isOffline);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  return (
    <View className="flex-1 gap-4 px-3 py-safe bg-background">
      <View className="px-3 py-6">
        <Logo tintColor={themeColorAccent} />
      </View>

      <View className="gap-1 mt-4">
        <Typography type="body-xs" weight="semibold" color="muted" className="px-3 pb-2">
          Workspace
        </Typography>
        {DRAWER_ROUTE_ORDER.map((routeName) => {
          const routeIndex = state.routes.findIndex((route) => route.name === routeName);
          if (routeIndex < 0) return null;

          const route = state.routes[routeIndex];
          const focused = state.index === routeIndex;

          const descriptor = descriptors[route.key];
          const label =
            typeof descriptor?.options.drawerLabel === "string"
              ? descriptor.options.drawerLabel
              : (descriptor?.options.title ?? getRouteLabel(route.name));
          const iconName = DRAWER_ICONS[routeName] ?? "ellipse-outline";

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : undefined}
              accessibilityLabel={`Open ${label}`}
              onPress={() => {
                const event = navigation.emit({
                  type: "drawerItemPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (event.defaultPrevented) return;

                navigation.closeDrawer();
                if (!focused) navigation.navigate(route.name, route.params);
              }}
            >
              <Surface
                variant={focused ? "default" : "transparent"}
                className="min-h-13 flex-row items-center gap-3 px-3 py-2"
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-xl ${focused ? "bg-accent-soft" : "bg-transparent"}`}
                >
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={focused ? themeColorAccentSoftForeground : themeColorMuted}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Typography type="body-sm" weight={focused ? "semibold" : "medium"}>
                    {label}
                  </Typography>
                  <Typography type="body-xs" color="muted" numberOfLines={1}>
                    {DRAWER_DESCRIPTIONS[routeName] ?? ""}
                  </Typography>
                </View>
              </Surface>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-4 mt-auto">
        {isOffline && (
          <View className="flex-row items-center gap-2 rounded-panel-inner bg-warning-soft px-3 py-2.5">
            <Ionicons
              name="cloud-offline-outline"
              size={16}
              color={themeColorWarningSoftForeground}
            />
            <Typography
              type="body-xs"
              weight="semibold"
              className="flex-1 text-warning-soft-foreground"
              numberOfLines={1}
            >
              {t("offline.title")}
            </Typography>
          </View>
        )}

        <Popover isOpen={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <Popover.Trigger asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Open profile menu">
              <Surface
                variant={isProfileOpen ? "default" : "transparent"}
                className="flex-row items-center gap-3 px-3 py-2"
              >
                <Avatar variant="soft" size="sm">
                  <Avatar.Fallback>
                    {(user?.name || activeMerchant?.name || "SO").slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                <View className="flex-1 gap-0.5">
                  <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                    {activeMerchant?.name ?? "Soeat"}
                  </Typography>
                  <Typography type="body-xs" color="muted" numberOfLines={1}>
                    {user?.name ?? "Merchant workspace"}
                  </Typography>
                </View>
                <Ionicons
                  name={isProfileOpen ? "chevron-down" : "chevron-up"}
                  size={16}
                  color={themeColorMuted}
                />
              </Surface>
            </Pressable>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Overlay />
            <Popover.Content
              presentation="popover"
              placement="top"
              align="center"
              width="trigger"
              className="overflow-hidden border border-border p-0"
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setIsProfileOpen(false);
                  navigation.closeDrawer();
                  navigation.navigate("settings");
                }}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-secondary"
              >
                <Ionicons name="person-circle-outline" size={19} color={themeColorMuted} />
                <Typography type="body-sm" weight="medium">
                  Profile
                </Typography>
              </Pressable>

              <View className="h-px bg-border" />

              <View className="flex-row gap-2 p-2">
                {THEME_ACTIONS.map((action) => {
                  const isSelected = themeMode === action.value;
                  return (
                    <Pressable
                      key={action.value}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setThemeMode(action.value)}
                      className={`h-10 flex-1 items-center justify-center rounded-full ${isSelected ? "bg-accent" : "active:bg-surface-secondary"}`}
                    >
                      <Ionicons
                        name={action.icon}
                        size={19}
                        color={isSelected ? themeColorAccentForeground : themeColorMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View className="h-px bg-border" />

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setIsProfileOpen(false);
                  setIsLogoutOpen(true);
                }}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-secondary"
              >
                <Ionicons name="log-out-outline" size={19} color={themeColorMuted} />
                <Typography type="body-sm" weight="medium">
                  {t("settings.logout")}
                </Typography>
              </Pressable>
            </Popover.Content>
          </Popover.Portal>
        </Popover>
        <LogoutConfirmationDialog
          isOpen={isLogoutOpen}
          onOpenChange={setIsLogoutOpen}
          onConfirm={logout}
        />
      </View>
    </View>
  );
}

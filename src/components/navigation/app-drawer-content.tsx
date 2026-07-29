import Logo from "@/components/common/logo";
import LogoutConfirmationDialog from "@/components/common/logout-confirmation-dialog";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { useNetworkStore } from "@/stores/use-network-store";
import { useThemeStore, type ThemeMode } from "@/stores/use-theme-store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { DrawerContentComponentProps } from "expo-router/drawer";
import {
  Avatar,
  Button,
  Popover,
  ScrollShadow,
  Surface,
  Typography,
  useThemeColor,
} from "heroui-native";
import type { ComponentProps, JSX } from "react";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";

type DrawerRouteName = "index" | "pos" | "products" | "orders" | "earnings" | "settings";

const DRAWER_ROUTE_ORDER: DrawerRouteName[] = [
  "index",
  "pos",
  "orders",
  "products",
  "earnings",
  "settings",
];

const DRAWER_ICONS: Record<DrawerRouteName, ComponentProps<typeof Ionicons>["name"]> = {
  index: "grid-outline",
  pos: "calculator-outline",
  products: "fast-food-outline",
  orders: "receipt-outline",
  earnings: "wallet-outline",
  settings: "settings-outline",
};

function getRouteLabel(routeName: string, translate: typeof import("@/locales").t): string {
  if (routeName === "index") return translate("navigation.dashboard");
  if (routeName === "pos") return translate("navigation.pos");
  if (routeName === "products") return translate("navigation.products");
  if (routeName === "orders") return translate("navigation.orders");
  if (routeName === "earnings") return translate("navigation.earnings");
  if (routeName === "settings") return translate("navigation.settings");
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
    themeColorDanger,
  ] = useThemeColor([
    "accent",
    "accent-foreground",
    "muted",
    "accent-soft-foreground",
    "warning-soft-foreground",
    "danger",
  ]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const activeMerchant = useAuth((s) => s.activeMerchant);
  const isOffline = useNetworkStore((s) => s.isOffline);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const drawerDescriptions: Record<DrawerRouteName, string> = {
    index: t("navigation.descriptions.dashboard"),
    pos: t("navigation.descriptions.pos"),
    products: t("navigation.descriptions.products"),
    orders: t("navigation.descriptions.orders"),
    earnings: t("navigation.descriptions.earnings"),
    settings: t("navigation.descriptions.settings"),
  };
  const themeActions: {
    value: ThemeMode;
    icon: ComponentProps<typeof Ionicons>["name"];
    label: string;
  }[] = [
    { value: "light", icon: "sunny-outline", label: t("theme.useLight") },
    { value: "dark", icon: "moon-outline", label: t("theme.useDark") },
    { value: "system", icon: "desktop-outline", label: t("theme.useSystem") },
  ];

  return (
    <View className="flex-1 pt-safe bg-background">
      <View className="px-6 py-4">
        <Logo tintColor={themeColorAccent} />
      </View>

      <ScrollShadow size={32} LinearGradientComponent={LinearGradient}>
        <ScrollView contentContainerClassName="gap-1 px-3">
          {DRAWER_ROUTE_ORDER.map((routeName) => {
            const routeIndex = state.routes.findIndex((route) => route.name === routeName);
            if (routeIndex < 0) return null;

            const route = state.routes[routeIndex];
            const focused = state.index === routeIndex;

            const descriptor = descriptors[route.key];
            const label =
              typeof descriptor?.options.drawerLabel === "string"
                ? descriptor.options.drawerLabel
                : (descriptor?.options.title ?? getRouteLabel(route.name, t));
            const iconName = DRAWER_ICONS[routeName] ?? "ellipse-outline";

            return (
              <Pressable
                key={routeName}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : undefined}
                accessibilityLabel={t("navigation.openRouteAccessibility", { route: label })}
                onPress={() => {
                  const event = navigation.emit({
                    type: "drawerItemPress",
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (event.defaultPrevented) return;

                  navigation.closeDrawer();
                  if (routeName === "pos") {
                    navigation.navigate(route.name, { screen: "index" });
                  } else if (!focused) {
                    navigation.navigate(route.name, route.params);
                  }
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
                      {drawerDescriptions[routeName] ?? ""}
                    </Typography>
                  </View>
                </Surface>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollShadow>

      <View className="gap-4 p-3 mt-auto">
        {isOffline && (
          <View className="flex-row items-center gap-2 rounded-panel-inner bg-warning-soft px-y py-2.5">
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

        <Popover
          presentation={choicePresentation}
          isOpen={isProfileOpen}
          onOpenChange={setIsProfileOpen}
        >
          <Popover.Trigger asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.openMenu")}
              accessibilityState={{ expanded: isProfileOpen }}
            >
              <Surface
                variant={isProfileOpen ? "default" : "transparent"}
                className="min-h-12 flex-row items-center gap-3 px-3 py-2"
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
                    {user?.name ?? t("profile.merchantWorkspace")}
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
              presentation={choicePresentation}
              placement="top"
              align="center"
              width={choicePresentation === "popover" ? "trigger" : undefined}
              className={choicePresentation === "popover" ? "gap-2 p-2" : undefined}
              contentContainerClassName={
                choicePresentation === "bottom-sheet" ? "gap-2 px-4 pb-safe pt-2" : undefined
              }
            >
              <Button
                variant="ghost"
                onPress={() => {
                  setIsProfileOpen(false);
                  navigation.closeDrawer();
                  navigation.navigate("settings");
                }}
                className="flex-1 items-center justify-between"
              >
                <Button.Label>{t("profile.profile")}</Button.Label>
                <Ionicons name="chevron-forward" size={16} color={themeColorMuted} />
              </Button>

              <View className="flex-row gap-1 rounded-full bg-surface-secondary p-1">
                {themeActions.map((action) => {
                  const isSelected = themeMode === action.value;
                  return (
                    <Pressable
                      key={action.value}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setThemeMode(action.value)}
                      className={`h-9 flex-1 items-center justify-center rounded-full ${isSelected ? "bg-accent" : "active:bg-surface-tertiary"}`}
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
              <Button
                variant="danger-soft"
                onPress={() => {
                  setIsProfileOpen(false);
                  setIsLogoutOpen(true);
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={themeColorDanger} />
                <Button.Label>{t("settings.logout")}</Button.Label>
              </Button>
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

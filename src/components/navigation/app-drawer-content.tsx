import {
  Surface,
  Typography,
  Button as PanelButton,
  Dialog as PanelDialog,
  ScrollFade,
  Avatar as PanelAvatar,
  Popover as PanelPopover,
  cn,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import Logo from "@/components/common/logo";
import { useAccountProfile } from "@/hooks/db/use-account-profile";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";
import type { Translate } from "@/locales";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { useThemeStore, type ThemeMode } from "@/stores/use-theme-store";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import type { DrawerContentComponentProps } from "expo-router/drawer";
import type { ComponentProps, JSX } from "react";
import { Fragment, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { hasMerchantFeature } from "@/utils/merchant-features";

type DrawerRouteName = "index" | "pos" | "products" | "orders" | "kds" | "earnings" | "settings";

const DRAWER_ROUTE_ORDER: DrawerRouteName[] = [
  "index",
  "pos",
  "orders",
  "kds",
  "products",
  "earnings",
  "settings",
];

const DRAWER_ICONS: Record<DrawerRouteName, ComponentProps<typeof AppIcon>["icon"]> = {
  index: AppIcons.grid,
  pos: AppIcons.cashier,
  products: AppIcons.handPlatter,
  orders: AppIcons.receipt,
  kds: AppIcons.chefHat,
  earnings: AppIcons.wallet,
  settings: AppIcons.settings,
};

function getRouteLabel(routeName: string, translate: Translate): string {
  if (routeName === "index") return translate("navigation.dashboard");
  if (routeName === "pos") return translate("navigation.pos");
  if (routeName === "products") return translate("navigation.products");
  if (routeName === "orders") return translate("navigation.orders");
  if (routeName === "kds") return translate("navigation.kds");
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
    themeColorDanger,
  ] = useCSSVariable([
    "--color-primary",
    "--color-primary-foreground",
    "--color-muted-foreground",
    "--color-secondary-foreground",
    "--color-destructive",
  ]) as [string, string, string, string, string];
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { data: user } = useAccountProfile();
  const { data: merchantProfile } = useMerchantProfile();
  const logout = useAuth((s) => s.logout);
  const activeMerchant = useAuth((s) => s.activeMerchant);
  const kdsEnabled = hasMerchantFeature(
    merchantProfile?.features ?? activeMerchant?.features,
    "kds"
  );
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const drawerDescriptions: Record<DrawerRouteName, string> = {
    index: t("navigation.descriptions.dashboard"),
    pos: t("navigation.descriptions.pos"),
    products: t("navigation.descriptions.products"),
    orders: t("navigation.descriptions.orders"),
    kds: t("navigation.descriptions.kds"),
    earnings: t("navigation.descriptions.earnings"),
    settings: t("navigation.descriptions.settings"),
  };
  const themeActions: {
    value: ThemeMode;
    icon: ComponentProps<typeof AppIcon>["icon"];
    label: string;
  }[] = [
    { value: "light", icon: AppIcons.sunny, label: t("theme.useLight") },
    { value: "dark", icon: AppIcons.moon, label: t("theme.useDark") },
    { value: "system", icon: AppIcons.desktop, label: t("theme.useSystem") },
  ];

  return (
    <View
      className="flex-1 justify-between bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="px-6 py-4 landscape:pb-3">
        <Logo tintColor={themeColorAccent} />
      </View>

      <ScrollFade size={16} className="flex-1">
        <ScrollView contentContainerClassName="gap-0.5 px-3" showsVerticalScrollIndicator={false}>
          {DRAWER_ROUTE_ORDER.map((routeName) => {
            if (routeName === "kds" && !kdsEnabled) return null;

            const routeIndex = state.routes.findIndex((route) => route.name === routeName);
            if (routeIndex < 0) return null;

            const route = state.routes[routeIndex];
            const focused = state.index === routeIndex;

            const descriptor = descriptors[route.key];
            const label =
              typeof descriptor?.options.drawerLabel === "string"
                ? descriptor.options.drawerLabel
                : (descriptor?.options.title ?? getRouteLabel(route.name, t));
            const iconName = DRAWER_ICONS[routeName] ?? AppIcons.ellipse;

            return (
              <Fragment key={routeName}>
                <Pressable
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
                    if (routeName === "pos" || routeName === "settings") {
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
                    <Surface
                      variant="transparent"
                      className={cn(
                        "h-12 w-12 items-center justify-center p-0 rounded-xl shadow-none border-0",
                        focused ? "bg-secondary" : "bg-transparent"
                      )}
                    >
                      <AppIcon
                        icon={iconName}
                        size={20}
                        color={focused ? themeColorAccentSoftForeground : themeColorMuted}
                      />
                    </Surface>
                    <View className="flex-1">
                      <Typography weight={focused ? "semibold" : "medium"}>{label}</Typography>
                      <Typography type="body-sm" muted numberOfLines={1}>
                        {drawerDescriptions[routeName] ?? ""}
                      </Typography>
                    </View>
                  </Surface>
                </Pressable>
              </Fragment>
            );
          })}
        </ScrollView>
      </ScrollFade>

      <View className="gap-4 p-3 pt-0">
        <PanelPopover
          presentation={choicePresentation}
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
        >
          <PanelPopover.Trigger>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.openMenu")}
              accessibilityState={{ expanded: isProfileOpen }}
            >
              <Surface
                variant={isProfileOpen ? "default" : "transparent"}
                className="min-h-12 flex-row items-center gap-3 px-3 py-2"
              >
                <PanelAvatar
                  fallback={(user?.name || activeMerchant?.name || "SO").slice(0, 2).toUpperCase()}
                />
                <View className="flex-1">
                  <Typography weight="semibold" numberOfLines={1}>
                    {user?.name ?? t("profile.account")}
                  </Typography>
                  <Typography type="body-sm" muted numberOfLines={1}>
                    {activeMerchant?.name ?? t("profile.merchantWorkspace")}
                  </Typography>
                </View>
                <AppIcon
                  icon={isProfileOpen ? AppIcons.chevronDown : AppIcons.chevronUp}
                  size={16}
                  color={themeColorMuted}
                />
              </Surface>
            </Pressable>
          </PanelPopover.Trigger>
          <PanelPopover.Content
            placement="top"
            align="center"
            width={choicePresentation === "popover" ? "trigger" : undefined}
            className={choicePresentation === "popover" ? "gap-2 p-2" : "gap-2 px-4 pb-safe pt-2"}
          >
            <PanelButton
              variant="ghost"
              onPress={() => {
                setIsProfileOpen(false);
                navigation.closeDrawer();
                navigation.navigate("settings", { screen: "account" });
              }}
              className="flex-1 items-center justify-between"
            >
              {t("profile.account")}
              <AppIcon icon={AppIcons.chevronForward} size={18} color={themeColorMuted} />
            </PanelButton>

            <View className="flex-row gap-1 rounded-full bg-surface-secondary p-1">
              {themeActions.map((action) => {
                const isSelected = themeMode === action.value;
                return (
                  <PanelButton
                    key={action.value}
                    size="sm"
                    variant={isSelected ? "primary" : "ghost"}
                    accessibilityLabel={action.label}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setThemeMode(action.value)}
                    className="h-9 flex-1"
                  >
                    <AppIcon
                      icon={action.icon}
                      size={19}
                      color={isSelected ? themeColorAccentForeground : themeColorMuted}
                    />
                  </PanelButton>
                );
              })}
            </View>
            <PanelButton
              variant="destructive"
              onPress={() => {
                setIsProfileOpen(false);
                setIsLogoutOpen(true);
              }}
            >
              <AppIcon icon={AppIcons.logout} size={18} color={themeColorDanger} />
              {t("settings.logout")}
            </PanelButton>
          </PanelPopover.Content>
        </PanelPopover>
        <PanelDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
          <PanelDialog.Content>
            <PanelDialog.Title>{t("logout.title")}</PanelDialog.Title>
            <PanelDialog.Description>{t("logout.description")}</PanelDialog.Description>
            <PanelDialog.Footer>
              <PanelDialog.Close>
                <PanelButton variant="ghost" size="sm">
                  {t("common.cancel")}
                </PanelButton>
              </PanelDialog.Close>
              <PanelButton variant="destructive" size="sm" onPress={logout}>
                {t("logout.confirm")}
              </PanelButton>
            </PanelDialog.Footer>
          </PanelDialog.Content>
        </PanelDialog>
      </View>
    </View>
  );
}

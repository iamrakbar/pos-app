import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Select, Separator, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useAuth } from "@/stores/use-auth";
import { useThemeStore, type ThemeMode } from "@/stores/use-theme-store";
import { useLocale, useTranslation } from "@/stores/use-locale";
import type { Locale } from "@/locales";
import LogoutConfirmationDialog from "@/components/common/logout-confirmation-dialog";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useState } from "react";

type SettingsItem = {
  id: string;
  href: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
};

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const { isCompact } = useResponsiveLayout();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [themeColorMuted, themeColorAccentSoftForeground, themeColorDangerSoftForeground] =
    useThemeColor(["muted", "accent-soft-foreground", "danger-soft-foreground"]);
  const logout = useAuth((s) => s.logout);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const setLocale = useLocale((s) => s.setLocale);
  const { locale, t } = useTranslation();
  const settingsItems: SettingsItem[] = [
    {
      id: "categories",
      href: "/categories",
      icon: "grid-outline",
      label: t("settings.categories"),
      description: t("settings.categoriesDescription"),
    },
    {
      id: "areas",
      href: "/settings/areas",
      icon: "storefront-outline",
      label: t("settings.areas"),
      description: t("settings.areasDescription"),
    },
    {
      id: "printer",
      href: "/settings/printers",
      icon: "print-outline",
      label: t("settings.printer"),
      description: t("settings.printerDescription"),
    },
    {
      id: "receipt",
      href: "/settings/receipt",
      icon: "receipt-outline",
      label: t("settings.receipt"),
      description: t("settings.receiptDescription"),
    },
  ];
  const appUpdatesItem: SettingsItem = {
    id: "updates",
    href: "/settings/updates",
    icon: "cloud-download-outline",
    label: t("settings.updates"),
    description: t("settings.updatesDescription"),
  };
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];
  const languageOptions: { value: Locale; label: string }[] = [
    { value: "en", label: t("settings.english") },
    { value: "id", label: t("settings.indonesian") },
  ];
  const localeOption =
    languageOptions.find((option) => option.value === locale) ?? languageOptions[0];
  const themeOption = themeOptions.find((option) => option.value === themeMode) ?? themeOptions[0];

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="flex-grow px-4 py-6 pb-10 md:px-6"
      >
        <View className="flex-1 justify-between gap-6">
          <Card className="p-0 overflow-hidden">
            {settingsItems.map((item) => (
              <View key={item.id}>
                <Pressable
                  onPress={() => router.push(item.href as never)}
                  className="flex-row items-center gap-4 px-4 py-4 active:bg-surface-secondary"
                >
                  <View className="w-10 h-10 rounded-panel-inner bg-accent-soft items-center justify-center">
                    <Ionicons name={item.icon} size={20} color={themeColorAccentSoftForeground} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Typography type="body-sm" weight="semibold">
                      {item.label}
                    </Typography>
                    <Typography type="body-xs" color="muted" numberOfLines={2}>
                      {item.description}
                    </Typography>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={themeColorMuted} />
                </Pressable>
                <Separator className="mx-4" />
              </View>
            ))}

            <View
              className={`gap-4 px-4 py-4 ${isCompact ? "items-stretch" : "flex-row items-center"}`}
            >
              <View className="w-10 h-10 rounded-panel-inner bg-surface-secondary items-center justify-center">
                <Ionicons
                  name={
                    themeMode === "dark"
                      ? "moon-outline"
                      : themeMode === "light"
                        ? "sunny-outline"
                        : "desktop-outline"
                  }
                  size={20}
                  color={themeColorMuted}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {t("settings.appearance")}
                </Typography>
                <Typography type="body-xs" color="muted" numberOfLines={2}>
                  {t("settings.appearanceDescription")}
                </Typography>
              </View>
              <View className={isCompact ? "w-full" : "w-36"}>
                <Select
                  key={`theme-${locale}`}
                  value={themeOption}
                  onValueChange={(option) => {
                    if (option?.value) setThemeMode(option.value as ThemeMode);
                  }}
                >
                  <Select.Trigger>
                    <Select.Value placeholder={t("settings.appearance")} />
                    <Select.TriggerIndicator />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Overlay />
                    <Select.Content presentation="popover" width="trigger">
                      {themeOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value} label={option.label} />
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
              </View>
            </View>
            <Separator className="mx-4" />

            <View
              className={`gap-4 px-4 py-4 ${isCompact ? "items-stretch" : "flex-row items-center"}`}
            >
              <View className="w-10 h-10 rounded-panel-inner bg-surface-secondary items-center justify-center">
                <Ionicons name="language-outline" size={20} color={themeColorMuted} />
              </View>
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {t("settings.language")}
                </Typography>
                <Typography type="body-xs" color="muted" numberOfLines={2}>
                  {t("settings.languageDescription")}
                </Typography>
              </View>
              <View className={isCompact ? "w-full" : "w-36"}>
                <Select
                  key={`language-${locale}`}
                  value={localeOption}
                  onValueChange={(option) => {
                    if (option?.value) setLocale(option.value as Locale);
                  }}
                >
                  <Select.Trigger>
                    <Select.Value placeholder={t("settings.language")} />
                    <Select.TriggerIndicator />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Overlay />
                    <Select.Content presentation="popover" width="trigger">
                      {languageOptions.map((option) => (
                        <Select.Item key={option.value} {...option} />
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
              </View>
            </View>
            <Separator className="mx-4" />

            <Pressable
              onPress={() => router.push(appUpdatesItem.href as never)}
              className="flex-row items-center gap-4 px-4 py-4 active:bg-surface-secondary"
            >
              <View className="w-10 h-10 rounded-panel-inner bg-accent-soft items-center justify-center">
                <Ionicons
                  name={appUpdatesItem.icon}
                  size={20}
                  color={themeColorAccentSoftForeground}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {appUpdatesItem.label}
                </Typography>
                <Typography type="body-xs" color="muted" numberOfLines={2}>
                  {appUpdatesItem.description}
                </Typography>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColorMuted} />
            </Pressable>
          </Card>

          <Button variant="danger-soft" onPress={() => setIsLogoutOpen(true)} className="w-full">
            <Ionicons name="log-out-outline" size={18} color={themeColorDangerSoftForeground} />
            <Button.Label>{t("settings.logout")}</Button.Label>
          </Button>
        </View>
      </ScrollView>
      <LogoutConfirmationDialog
        isOpen={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        onConfirm={logout}
      />
    </>
  );
}

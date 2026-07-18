import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Select, Separator, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useAuth } from "@/stores/useAuth";
import { useThemeStore, type ThemeMode } from "@/stores/useThemeStore";
import { useLocale } from "@/stores/useLocale";
import { t } from "@/locales";
import LogoutConfirmationDialog from "@/components/common/LogoutConfirmationDialog";
import { useState } from "react";

type SettingsItem = {
  id: string;
  href: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
};

const SETTINGS_ITEMS: SettingsItem[] = [
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

const APP_UPDATES_ITEM: SettingsItem = {
  id: "updates",
  href: "/settings/updates",
  icon: "cloud-download-outline",
  label: t("settings.updates"),
  description: t("settings.updatesDescription"),
};

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: t("settings.themeSystem") },
  { value: "light", label: t("settings.themeLight") },
  { value: "dark", label: t("settings.themeDark") },
];

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [themeColorMuted, themeColorAccentSoftForeground, themeColorDangerSoftForeground] =
    useThemeColor(["muted", "accent-soft-foreground", "danger-soft-foreground"]);
  const logout = useAuth((s) => s.logout);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const locale = useLocale((s) => s.locale);
  const localeOption = {
    value: locale,
    label: locale === "id" ? t("settings.indonesian") : t("settings.english"),
  };
  const themeOption =
    THEME_OPTIONS.find((option) => option.value === themeMode) ?? THEME_OPTIONS[0];

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow p-5">
        <View className="flex-1 justify-between gap-6">
          <Card className="p-0 overflow-hidden">
            {SETTINGS_ITEMS.map((item) => (
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

            <View className="flex-row items-center gap-4 px-4 py-4">
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
              <View className="w-36">
                <Select
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
                      {THEME_OPTIONS.map((option) => (
                        <Select.Item key={option.value} value={option.value} label={option.label} />
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
              </View>
            </View>
            <Separator className="mx-4" />

            <View className="flex-row items-center gap-4 px-4 py-4">
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
              <View className="w-36">
                <Select value={localeOption} isDisabled>
                  <Select.Trigger>
                    <Select.Value placeholder={t("settings.language")} />
                    <Select.TriggerIndicator />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Overlay />
                    <Select.Content presentation="popover" width="trigger">
                      <Select.Item value="en" label={t("settings.english")} />
                      <Select.Item value="id" label={t("settings.indonesian")} />
                    </Select.Content>
                  </Select.Portal>
                </Select>
              </View>
            </View>
            <Separator className="mx-4" />

            <Pressable
              onPress={() => router.push(APP_UPDATES_ITEM.href as never)}
              className="flex-row items-center gap-4 px-4 py-4 active:bg-surface-secondary"
            >
              <View className="w-10 h-10 rounded-panel-inner bg-accent-soft items-center justify-center">
                <Ionicons
                  name={APP_UPDATES_ITEM.icon}
                  size={20}
                  color={themeColorAccentSoftForeground}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {APP_UPDATES_ITEM.label}
                </Typography>
                <Typography type="body-xs" color="muted" numberOfLines={2}>
                  {APP_UPDATES_ITEM.description}
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

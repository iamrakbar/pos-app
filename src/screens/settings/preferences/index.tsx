import { Frame, Select as PanelSelect } from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import type { Locale } from "@/locales";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useLocale, useTranslation } from "@/stores/use-locale";
import { useThemeStore, type ThemeMode } from "@/stores/use-theme-store";

export default function PreferencesScreen(): JSX.Element {
  const router = useRouter();
  const { isCompact } = useResponsiveLayout();
  const { choicePresentation } = useOverlayPresentation();
  const mutedColor = useCSSVariable("--color-muted-foreground") as string;
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);
  const setLocale = useLocale((state) => state.setLocale);
  const { locale, t } = useTranslation();
  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];
  const languageOptions: { value: Locale; label: string }[] = [
    { value: "en", label: t("settings.english") },
    { value: "id", label: t("settings.indonesian") },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-6 md:px-6">
      <View className="mx-auto w-full max-w-3xl">
        <Frame variant="plain">
          <Frame.Panel>
            <Frame.Row className={isCompact ? "flex-col items-stretch gap-4" : undefined}>
              <View className="flex-1 flex-row items-center gap-4">
                <Frame.Media>
                  <AppIcon
                    icon={
                      themeMode === "dark"
                        ? AppIcons.moon
                        : themeMode === "light"
                          ? AppIcons.sunny
                          : AppIcons.desktop
                    }
                    size={21}
                    color={mutedColor}
                  />
                </Frame.Media>
                <Frame.Content>
                  <Frame.Title>{t("settings.appearance")}</Frame.Title>
                  <Frame.Description numberOfLines={2}>
                    {t("settings.appearanceDescription")}
                  </Frame.Description>
                </Frame.Content>
              </View>
              <Frame.Actions className={isCompact ? "w-full" : "w-48"}>
                <PanelSelect
                  triggerClassName="h-12"
                  key={`theme-${locale}`}
                  presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
                  value={themeMode}
                  onValueChange={(value) => setThemeMode(value as ThemeMode)}
                  placeholder={t("settings.appearance")}
                  title={t("settings.appearance")}
                >
                  {themeOptions.map((option) => (
                    <PanelSelect.Item key={option.value} {...option} />
                  ))}
                </PanelSelect>
              </Frame.Actions>
            </Frame.Row>

            <Frame.Row className={isCompact ? "flex-col items-stretch gap-4" : undefined}>
              <View className="flex-1 flex-row items-center gap-4">
                <Frame.Media>
                  <AppIcon icon={AppIcons.language} size={21} color={mutedColor} />
                </Frame.Media>
                <Frame.Content>
                  <Frame.Title>{t("settings.language")}</Frame.Title>
                  <Frame.Description numberOfLines={2}>
                    {t("settings.languageDescription")}
                  </Frame.Description>
                </Frame.Content>
              </View>
              <Frame.Actions className={isCompact ? "w-full" : "w-48"}>
                <PanelSelect
                  triggerClassName="h-12"
                  key={`language-${locale}`}
                  presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
                  value={locale}
                  onValueChange={(value) => setLocale(value as Locale)}
                  placeholder={t("settings.language")}
                  title={t("settings.language")}
                >
                  {languageOptions.map((option) => (
                    <PanelSelect.Item key={option.value} {...option} />
                  ))}
                </PanelSelect>
              </Frame.Actions>
            </Frame.Row>

            <Frame.Row
              chevron
              accessibilityRole="button"
              onPress={() => router.push("/settings/updates")}
            >
              <Frame.Media>
                <AppIcon icon={AppIcons.cloudDownload} size={21} color={mutedColor} />
              </Frame.Media>
              <Frame.Content>
                <Frame.Title>{t("settings.updates")}</Frame.Title>
                <Frame.Description numberOfLines={2}>
                  {t("settings.updatesDescription")}
                </Frame.Description>
              </Frame.Content>
            </Frame.Row>
          </Frame.Panel>
        </Frame>
      </View>
    </ScrollView>
  );
}

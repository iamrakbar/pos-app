import AppIcon from "@/components/common/app-icon";
import { useRouter } from "expo-router";
import { ListGroup, Select, Separator, useThemeColor } from "heroui-native";
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
  const mutedColor = useThemeColor("muted");
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
  const themeOption = themeOptions.find((option) => option.value === themeMode) ?? themeOptions[0];
  const localeOption =
    languageOptions.find((option) => option.value === locale) ?? languageOptions[0];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-6 md:px-6">
      <View className="mx-auto w-full max-w-3xl">
        <ListGroup>
          <ListGroup.Item
            disabled
            className={isCompact ? "flex-col items-stretch gap-4" : undefined}
          >
            <View className="flex-1 flex-row items-center gap-4">
              <ListGroup.ItemPrefix>
                <AppIcon
                  name={
                    themeMode === "dark"
                      ? "moon-outline"
                      : themeMode === "light"
                        ? "sunny-outline"
                        : "desktop-outline"
                  }
                  size={21}
                  color={mutedColor}
                />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.appearance")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription numberOfLines={2}>
                  {t("settings.appearanceDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </View>
            <ListGroup.ItemSuffix className={isCompact ? "w-full" : "w-36"}>
              <Select
                key={`theme-${locale}`}
                presentation={choicePresentation}
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
                  <Select.Content
                    presentation={choicePresentation}
                    width={choicePresentation === "popover" ? "trigger" : undefined}
                  >
                    {themeOptions.map((option) => (
                      <Select.Item key={option.value} {...option} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item
            disabled
            className={isCompact ? "flex-col items-stretch gap-4" : undefined}
          >
            <View className="flex-1 flex-row items-center gap-4">
              <ListGroup.ItemPrefix>
                <AppIcon name="language-outline" size={21} color={mutedColor} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.language")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription numberOfLines={2}>
                  {t("settings.languageDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </View>
            <ListGroup.ItemSuffix className={isCompact ? "w-full" : "w-36"}>
              <Select
                key={`language-${locale}`}
                presentation={choicePresentation}
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
                  <Select.Content
                    presentation={choicePresentation}
                    width={choicePresentation === "popover" ? "trigger" : undefined}
                  >
                    {languageOptions.map((option) => (
                      <Select.Item key={option.value} {...option} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item
            accessibilityRole="button"
            onPress={() => router.push("/settings/updates")}
          >
            <ListGroup.ItemPrefix>
              <AppIcon name="cloud-download-outline" size={21} color={mutedColor} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.updates")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription numberOfLines={2}>
                {t("settings.updatesDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  );
}

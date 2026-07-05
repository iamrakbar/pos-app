import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card, Switch, Typography, useThemeColor } from 'heroui-native';
import { Select } from 'heroui-native';
import type { JSX } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useAuth } from '@/stores/useAuth';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocale } from '@/stores/useLocale';
import { t } from '@/locales';

type SettingsItem = {
    id: string;
    href: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    description: string;
};

const SETTINGS_ITEMS: SettingsItem[] = [
    {
        id: 'printer',
        href: '/settings/printer',
        icon: 'print-outline',
        label: t('settings.printer'),
        description: t('settings.printerDescription'),
    },
    {
        id: 'receipt',
        href: '/settings/receipt',
        icon: 'receipt-outline',
        label: t('settings.receipt'),
        description: t('settings.receiptDescription'),
    },
];

export default function SettingsScreen(): JSX.Element {
    const router = useRouter();
    const [themeColorMuted, themeColorAccentSoftForeground, themeColorDangerSoftForeground] = useThemeColor([
        'muted',
        'accent-soft-foreground',
        'danger-soft-foreground',
    ]);
    const logout = useAuth((s) => s.logout);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const setDarkMode = useThemeStore((s) => s.setDarkMode);
    const locale = useLocale((s) => s.locale);
    const localeOption = {
        value: locale,
        label: locale === 'id' ? t('settings.indonesian') : t('settings.english'),
    };

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow p-5">
            <View className="flex-1 justify-between gap-6">
                <View className="gap-3">
                    {SETTINGS_ITEMS.map((item) => (
                        <Card key={item.id} className="p-0 overflow-hidden">
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
                        </Card>
                    ))}

                    <Card className="p-0 overflow-hidden">
                        <View className="flex-row items-center gap-4 px-4 py-4">
                            <View className="w-10 h-10 rounded-panel-inner bg-surface-secondary items-center justify-center">
                                <Ionicons name="moon-outline" size={20} color={themeColorMuted} />
                            </View>
                            <View className="flex-1 gap-0.5">
                                <Typography type="body-sm" weight="semibold">
                                    {t('settings.darkMode')}
                                </Typography>
                                <Typography type="body-xs" color="muted" numberOfLines={2}>
                                    {t('settings.darkModeDescription')}
                                </Typography>
                            </View>
                            <Switch isSelected={isDarkMode} onSelectedChange={setDarkMode} />
                        </View>
                    </Card>

                    <Card className="p-0 overflow-hidden">
                        <View className="flex-row items-center gap-4 px-4 py-4">
                            <View className="w-10 h-10 rounded-panel-inner bg-surface-secondary items-center justify-center">
                                <Ionicons name="language-outline" size={20} color={themeColorMuted} />
                            </View>
                            <View className="flex-1 gap-0.5">
                                <Typography type="body-sm" weight="semibold">
                                    {t('settings.language')}
                                </Typography>
                                <Typography type="body-xs" color="muted" numberOfLines={2}>
                                    {t('settings.languageDescription')}
                                </Typography>
                            </View>
                            <View className="w-36">
                                <Select value={localeOption} isDisabled>
                                    <Select.Trigger>
                                        <Select.Value placeholder={t('settings.language')} />
                                        <Select.TriggerIndicator />
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Overlay />
                                        <Select.Content presentation="popover" width="trigger">
                                            <Select.Item value="en" label={t('settings.english')} />
                                            <Select.Item value="id" label={t('settings.indonesian')} />
                                        </Select.Content>
                                    </Select.Portal>
                                </Select>
                            </View>
                        </View>
                    </Card>
                </View>

                <Button variant="danger-soft" onPress={logout} className="w-full">
                    <Ionicons name="log-out-outline" size={18} color={themeColorDangerSoftForeground} />
                    <Button.Label>{t('settings.logout')}</Button.Label>
                </Button>
            </View>
        </ScrollView>
    );
}

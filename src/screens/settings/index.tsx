import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Separator, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

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
        label: 'Printer',
        description: 'Configure thermal printer connection and paper size',
    },
    {
        id: 'receipt',
        href: '/settings/receipt',
        icon: 'receipt-outline',
        label: 'Receipt',
        description: 'Customize receipt layout, store info, and footer',
    },
];

export default function SettingsScreen(): JSX.Element {
    const router = useRouter();

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="py-2">
            {SETTINGS_ITEMS.map((item, index) => (
                <View key={item.id}>
                    <Pressable
                        onPress={() => router.push(item.href as never)}
                        className="flex-row items-center gap-4 px-4 py-4 active:bg-muted/30"
                    >
                        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                            <Ionicons name={item.icon} size={20} color="hsl(var(--primary))" />
                        </View>
                        <View className="flex-1 gap-0.5">
                            <Typography className="text-sm font-semibold text-foreground">
                                {item.label}
                            </Typography>
                            <Typography className="text-xs text-muted-foreground">
                                {item.description}
                            </Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="hsl(var(--muted-foreground))" />
                    </Pressable>
                    {index < SETTINGS_ITEMS.length - 1 && <Separator className="mx-4" />}
                </View>
            ))}
        </ScrollView>
    );
}

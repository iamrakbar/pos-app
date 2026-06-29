import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Menu, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { Pressable, View } from 'react-native';

type NavItem = {
    label: string;
    href: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
};

const NAV_ITEMS: NavItem[] = [
    { label: 'POS', href: '/', icon: 'storefront-outline' },
    { label: 'Products', href: '/products', icon: 'cube-outline' },
    { label: 'Orders', href: '/orders', icon: 'receipt-outline' },
    { label: 'Settings', href: '/settings', icon: 'settings-outline' },
];

const ROUTE_TITLES: [string, string][] = [
    ['/products', 'Products'],
    ['/orders', 'Orders'],
    ['/settings', 'Settings'],
    ['/', 'POS'],
];

export default function AppHeader(): JSX.Element {
    const pathname = usePathname();
    const router = useRouter();

    const title =
        ROUTE_TITLES.find(([route]) =>
            route === '/' ? pathname === '/' : pathname.startsWith(route)
        )?.[1] ?? 'SoEat';

    return (
        <View className="flex-row items-center justify-between px-4 h-14 border-b border-border bg-background">
            <Typography className="text-base font-semibold text-foreground">{title}</Typography>

            <Menu>
                <Menu.Trigger asChild>
                    <Pressable className="p-2 rounded-lg active:opacity-70">
                        <Ionicons name="menu-outline" size={24} color="hsl(var(--foreground))" />
                    </Pressable>
                </Menu.Trigger>

                <Menu.Portal>
                    <Menu.Overlay />
                    <Menu.Content presentation="popover" placement="bottom" align="end" width={220}>
                        <Menu.Label>Navigation</Menu.Label>
                        {NAV_ITEMS.map((item) => (
                            <Menu.Item
                                key={item.href}
                                onPress={() => router.push(item.href as never)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={16}
                                    color="hsl(var(--foreground))"
                                />
                                <Menu.ItemTitle>{item.label}</Menu.ItemTitle>
                            </Menu.Item>
                        ))}
                    </Menu.Content>
                </Menu.Portal>
            </Menu>
        </View>
    );
}

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Menu } from 'heroui-native';
import type { JSX } from 'react';
import { Pressable } from 'react-native';

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

export default function NavMenu(): JSX.Element {
    const router = useRouter();

    return (
        <Menu>
            <Menu.Trigger asChild>
                <Pressable className="p-2 rounded-lg active:opacity-70">
                    <Ionicons name="menu-outline" size={24} color="hsl(var(--foreground))" />
                </Pressable>
            </Menu.Trigger>

            <Menu.Portal>
                <Menu.Overlay />
                <Menu.Content presentation="popover" placement="bottom" align="start" width={220}>
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
    );
}

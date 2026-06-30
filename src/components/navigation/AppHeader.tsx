import { usePathname } from 'expo-router';
import { Typography } from 'heroui-native';
import type { JSX } from 'react';
import { View } from 'react-native';
import NavMenu from './NavMenu';

const ROUTE_TITLES: [string, string][] = [
    ['/products', 'Products'],
    ['/orders', 'Orders'],
    ['/settings', 'Settings'],
    ['/', 'POS'],
];

export default function AppHeader(): JSX.Element {
    const pathname = usePathname();

    const title =
        ROUTE_TITLES.find(([route]) =>
            route === '/' ? pathname === '/' : pathname.startsWith(route)
        )?.[1] ?? 'SoEat';

    return (
        <View className="flex-row items-center justify-between px-4 h-14 border-b border-border bg-background">
            <Typography className="text-base font-semibold text-foreground">{title}</Typography>
            <NavMenu />
        </View>
    );
}

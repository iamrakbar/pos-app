import Logo from '@/components/common/logo';
import { t } from '@/locales';
import { useAuth } from '@/stores/useAuth';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { Avatar, Surface, Typography, useThemeColor } from 'heroui-native';
import type { ComponentProps, JSX } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DrawerRouteName = 'index' | 'products' | 'orders' | 'settings';

const DRAWER_ICONS: Record<DrawerRouteName, ComponentProps<typeof Ionicons>['name']> = {
    index: 'grid-outline',
    products: 'fast-food-outline',
    orders: 'receipt-outline',
    settings: 'settings-outline',
};

const DRAWER_DESCRIPTIONS: Record<DrawerRouteName, string> = {
    index: 'Sales workspace',
    products: 'Catalog and add-ons',
    orders: 'Transactions and status',
    settings: 'Preferences and setup',
};

function getRouteLabel(routeName: string): string {
    if (routeName === 'index') return 'POS';
    if (routeName === 'products') return 'Products';
    if (routeName === 'orders') return 'Orders';
    if (routeName === 'settings') return 'Settings';
    return routeName;
}

export default function AppDrawerContent({
    state,
    descriptors,
    navigation,
}: DrawerContentComponentProps): JSX.Element {
    const [
        themeColorAccent,
        themeColorForeground,
        themeColorMuted,
        themeColorAccentSoftForeground,
        themeColorWarningSoftForeground,
    ] = useThemeColor([
        'accent',
        'foreground',
        'muted',
        'accent-soft-foreground',
        'warning-soft-foreground',
    ]);
    const user = useAuth((s) => s.user);
    const activeMerchant = useAuth((s) => s.activeMerchant);
    const isOffline = useNetworkStore((s) => s.isOffline);

    return (
        <View className="flex-1 gap-4 px-3 py-safe bg-background">
            <View className="px-3 py-6">
                <Logo tintColor={themeColorAccent} />
            </View>

            <View className="gap-1 mt-4">
                <Typography type="body-xs" weight="semibold" color="muted" className="px-3 pb-2">
                    Workspace
                </Typography>
                {state.routes.map((route, index) => {
                    const focused = state.index === index;
                    const routeName = route.name as DrawerRouteName;
                    if (!(routeName in DRAWER_ICONS)) return null;

                    const descriptor = descriptors[route.key];
                    const label =
                        typeof descriptor?.options.drawerLabel === 'string'
                            ? descriptor.options.drawerLabel
                            : descriptor?.options.title ?? getRouteLabel(route.name);
                    const iconName = DRAWER_ICONS[routeName] ?? 'ellipse-outline';

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={focused ? { selected: true } : undefined}
                            accessibilityLabel={`Open ${label}`}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'drawerItemPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (event.defaultPrevented) return;

                                navigation.closeDrawer();
                                if (!focused) navigation.navigate(route.name, route.params);
                            }}
                        >
                            <Surface
                                variant={focused ? 'default' : 'transparent'}
                                className="min-h-13 flex-row items-center gap-3 px-3 py-2"
                            >
                                <View
                                    className={`h-10 w-10 items-center justify-center rounded-xl ${focused ? 'bg-accent-soft' : 'bg-transparent'}`}
                                >
                                    <Ionicons
                                        name={iconName}
                                        size={20}
                                        color={focused ? themeColorAccentSoftForeground : themeColorMuted}
                                    />
                                </View>
                                <View className="flex-1 gap-0.5">
                                    <Typography type="body-sm" weight={focused ? 'semibold' : 'medium'}>
                                        {label}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" numberOfLines={1}>
                                        {DRAWER_DESCRIPTIONS[routeName] ?? ''}
                                    </Typography>
                                </View>
                            </Surface>
                        </Pressable>
                    );
                })}
            </View>

            <View className="gap-4 mt-auto">
                {isOffline && (
                    <View className="flex-row items-center gap-2 rounded-panel-inner bg-warning-soft px-3 py-2.5">
                        <Ionicons
                            name="cloud-offline-outline"
                            size={16}
                            color={themeColorWarningSoftForeground}
                        />
                        <Typography
                            type="body-xs"
                            weight="semibold"
                            className="flex-1 text-warning-soft-foreground"
                            numberOfLines={1}
                        >
                            {t('offline.title')}
                        </Typography>
                    </View>
                )}

                <Surface variant='transparent' className="flex-row items-center gap-3 px-3 py-2">
                    <Avatar variant="soft" size='sm'>
                        <Avatar.Fallback> {(user?.name || activeMerchant?.name || 'SO').slice(0, 2).toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                    <View className="flex-1 gap-0.5">
                        <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                            {activeMerchant?.name ?? 'Soeat'}
                        </Typography>
                        <Typography type="body-xs" color="muted" numberOfLines={1}>
                            {user?.email ?? user?.name ?? 'Merchant workspace'}
                        </Typography>
                    </View>
                </Surface>
            </View>
        </View>
    );
}

import { Drawer } from 'expo-router/drawer';
import AppDrawerContent from '@/components/navigation/AppDrawerContent';
import { useThemeStore } from '@/stores/useThemeStore';
import { getNavigationTheme } from '@/utils/navigationTheme';

export default function AppLayout() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const theme = getNavigationTheme(isDarkMode);

    return (
        <Drawer
            drawerContent={(props) => <AppDrawerContent {...props} />}
            screenOptions={{
                drawerStyle: {
                    backgroundColor: theme.background,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                },
                drawerContentStyle: {
                    backgroundColor: theme.background,
                },
                drawerActiveBackgroundColor: theme.surfaceSecondary,
                drawerActiveTintColor: theme.foreground,
                drawerInactiveTintColor: theme.muted,
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.foreground,
                sceneStyle: {
                    backgroundColor: theme.background,
                },
            }}
        >
            <Drawer.Screen
                name="index"
                options={{
                    title: 'POS',
                    drawerLabel: 'POS',
                    headerShown: false,
                }}
            />
            <Drawer.Screen
                name="products"
                options={{
                    title: 'Products',
                    drawerLabel: 'Products',
                    headerShown: false,
                }}
            />
            <Drawer.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    drawerLabel: 'Orders',
                    headerShown: false,
                }}
            />
            <Drawer.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    drawerLabel: 'Settings',
                    headerShown: false,
                }}
            />
        </Drawer>
    );
}

import { Stack } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';
import { getNavigationTheme } from '@/utils/navigationTheme';
import DrawerMenuButton from '@/components/navigation/DrawerMenuButton';

export default function OrdersLayout() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const theme = getNavigationTheme(isDarkMode);

    return (
        <Stack
            screenOptions={{
                headerBackTitle: '',
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.foreground,
                headerTitleStyle: {
                    color: theme.foreground,
                },
                contentStyle: {
                    backgroundColor: theme.background,
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Orders', headerLeft: () => <DrawerMenuButton /> }} />
            <Stack.Screen name="[id]" options={{ title: 'Order Detail' }} />
        </Stack>
    );
}

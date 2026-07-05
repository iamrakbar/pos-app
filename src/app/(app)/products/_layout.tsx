import { Stack } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';
import { getNavigationTheme } from '@/utils/navigationTheme';

export default function ProductsLayout() {
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const theme = getNavigationTheme(isDarkMode);

    return (
        <Stack
            screenOptions={{
                headerBackTitle: '',
                navigationBarHidden: true,
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
            <Stack.Screen name="index" options={{ title: 'Products' }} />
            <Stack.Screen name="[id]" options={{ title: 'Product' }} />
        </Stack>
    );
}

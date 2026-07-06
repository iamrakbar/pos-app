import { Stack } from 'expo-router';
import { useNavigationTheme } from '@/utils/navigationTheme';
import DrawerMenuButton from '@/components/navigation/DrawerMenuButton';

export default function OrdersLayout() {
    const theme = useNavigationTheme();

    return (
        <Stack
            screenOptions={{
                headerBackTitle: '',
                headerStyle: {
                    backgroundColor: theme.surface,
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

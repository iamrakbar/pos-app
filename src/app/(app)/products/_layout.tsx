import DrawerMenuButton from '@/components/navigation/DrawerMenuButton';
import { useNavigationTheme } from '@/utils/navigationTheme';
import { Stack } from 'expo-router';

export default function ProductsLayout() {
    const theme = useNavigationTheme();

    return (
        <Stack screenOptions={{
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
        }}>
            <Stack.Screen name="index" options={{
                title: 'Products',
                headerLeft: () => <DrawerMenuButton />,
            }} />
            <Stack.Screen name="[id]" options={{ title: 'Product' }} />
        </Stack>
    );
}

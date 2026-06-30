import { Stack } from 'expo-router';
import NavMenu from '@/components/navigation/NavMenu';

export default function OrdersLayout() {
    return (
        <Stack screenOptions={{ headerRight: () => <NavMenu />, headerBackTitle: '' }}>
            <Stack.Screen name="index" options={{ title: 'Orders' }} />
            <Stack.Screen name="[id]" options={{ title: 'Order Detail' }} />
        </Stack>
    );
}

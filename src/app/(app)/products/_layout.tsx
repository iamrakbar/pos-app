import { Stack } from 'expo-router';
import NavMenu from '@/components/navigation/NavMenu';

export default function ProductsLayout() {
    return (
        <Stack screenOptions={{ headerRight: () => <NavMenu />, headerBackTitle: '' }}>
            <Stack.Screen name="index" options={{ title: 'Products' }} />
            <Stack.Screen name="[id]" options={{ title: 'Product' }} />
        </Stack>
    );
}

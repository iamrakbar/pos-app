import { Stack } from 'expo-router';
import NavMenu from '@/components/navigation/NavMenu';

export default function SettingsLayout() {
    return (
        <Stack screenOptions={{ headerRight: () => <NavMenu />, headerBackTitle: '' }}>
            <Stack.Screen name="index" options={{ title: 'Settings' }} />
            <Stack.Screen name="printer" options={{ title: 'Printer' }} />
            <Stack.Screen name="receipt" options={{ title: 'Receipt Setup' }} />
        </Stack>
    );
}

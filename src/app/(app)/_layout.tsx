import { Slot, usePathname } from 'expo-router';
import AppHeader from '@/components/navigation/AppHeader';
import { View } from 'react-native';

export default function AppLayout() {
    const pathname = usePathname();

    return (
        <View className="flex-1">
            {pathname !== '/' && <AppHeader />}
            <Slot />
        </View>
    );
}

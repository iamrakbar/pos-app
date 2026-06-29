import { Slot } from 'expo-router';
import AppHeader from '@/components/navigation/AppHeader';
import { View } from 'react-native';

export default function AppLayout() {
  return (
    <View className="flex-1">
      <AppHeader />
      <Slot />
    </View>
  );
}

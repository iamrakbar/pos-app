import { Text } from 'heroui-native';
import type { JSX } from 'react';
import { View } from 'react-native';

export default function OrdersScreen(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-semibold text-foreground">Orders</Text>
      <Text className="text-sm text-muted-foreground mt-1">Coming soon</Text>
    </View>
  );
}

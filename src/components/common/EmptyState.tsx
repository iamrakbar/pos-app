import { View } from 'react-native';
import { Typography, useThemeColor } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, JSX } from 'react';

export default function EmptyState({
    icon = 'file-tray-outline',
    message,
}: {
    icon?: ComponentProps<typeof Ionicons>['name'];
    message: string;
}): JSX.Element {
    const themeColorMuted = useThemeColor('muted');

    return (
        <View className="items-center justify-center py-20 gap-2">
            <Ionicons name={icon} size={40} color={themeColorMuted} />
            <Typography className="text-sm text-muted-foreground">{message}</Typography>
        </View>
    );
}

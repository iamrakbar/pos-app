import { ActivityIndicator, View } from 'react-native';
import { Typography } from 'heroui-native';
import type { JSX } from 'react';

export default function LoadingState({ message }: { message?: string }): JSX.Element {
    return (
        <View className="flex-1 items-center justify-center gap-3 py-20">
            <ActivityIndicator />
            {message && <Typography className="text-sm text-muted-foreground">{message}</Typography>}
        </View>
    );
}

import { Pressable, View } from 'react-native';
import { Typography, useThemeColor } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import type { JSX } from 'react';
import { getErrorMessage } from '@/api/ApiError';
import { t } from '@/locales';

export default function ErrorState({
    error,
    onRetry,
}: {
    error: unknown;
    onRetry?: () => void;
}): JSX.Element {
    const themeColorDanger = useThemeColor('danger');

    return (
        <View className="flex-1 items-center justify-center gap-2 py-20 px-6">
            <Ionicons name="alert-circle-outline" size={40} color={themeColorDanger} />
            <Typography className="text-sm text-danger text-center">{getErrorMessage(error)}</Typography>
            {onRetry && (
                <Pressable onPress={onRetry} className="mt-2 px-4 py-2 rounded-full border border-border active:opacity-70">
                    <Typography className="text-sm text-foreground">{t('common.retry')}</Typography>
                </Pressable>
            )}
        </View>
    );
}

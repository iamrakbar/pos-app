import { Ionicons } from '@expo/vector-icons';
import { Typography } from 'heroui-native';
import { View } from 'react-native';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { t } from '@/locales';

export default function OfflineBanner() {
    const isOffline = useNetworkStore((s) => s.isOffline);

    if (!isOffline) return null;

    return (
        <View className="bg-warning-soft px-4 py-2 flex-row items-center gap-2">
            <Ionicons name="cloud-offline-outline" size={16} color="hsl(var(--warning-soft-foreground))" />
            <View className="flex-1">
                <Typography type="body-xs" weight="semibold" className="text-warning-soft-foreground">
                    {t('offline.title')}
                </Typography>
                <Typography type="body-xs" className="text-warning-soft-foreground" numberOfLines={1}>
                    {t('offline.description')}
                </Typography>
            </View>
        </View>
    );
}

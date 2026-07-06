import AppUpdateManager from '@/components/common/AppUpdateManager';
import type { JSX } from 'react';
import { ScrollView, View } from 'react-native';

export default function UpdateSettingsScreen(): JSX.Element {
    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="p-5">
            <View className="gap-4">
                <AppUpdateManager mode="settings" />
            </View>
        </ScrollView>
    );
}

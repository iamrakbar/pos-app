import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { Button, useThemeColor } from 'heroui-native';
import type { JSX } from 'react';

type DrawerNavigation = {
    openDrawer: () => void;
};

type DrawerMenuButtonProps = {
    accessibilityLabel?: string;
};

export default function DrawerMenuButton({
    accessibilityLabel = 'Open navigation',
}: DrawerMenuButtonProps): JSX.Element {
    const navigation = useNavigation<DrawerNavigation>();
    const themeColorForeground = useThemeColor('foreground');

    return (
        <Button
            variant="ghost"
            isIconOnly
            onPress={() => navigation.openDrawer()}
            accessibilityLabel={accessibilityLabel}
        >
            <Ionicons name="menu-outline" size={24} color={themeColorForeground} />
        </Button>
    );
}

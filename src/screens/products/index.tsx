import { Typography } from 'heroui-native';
import type { JSX } from 'react';
import { View } from 'react-native';

export default function ProductsScreen(): JSX.Element {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Typography className="text-xl font-semibold text-foreground">Products</Typography>
            <Typography className="text-sm text-muted-foreground mt-1">Coming soon</Typography>
        </View>
    );
}

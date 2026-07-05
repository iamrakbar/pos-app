import { Stack } from "expo-router";
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { HeroUINativeProvider } from "heroui-native";
import { useEffect, type JSX } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatabaseProvider } from '@/db';
import { useAuth, setQueryClientRef } from '@/stores/useAuth';
import { useThemeStore } from '@/stores/useThemeStore';
import { isApiError } from '@/api/ApiError';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { getNavigationTheme } from '@/utils/navigationTheme';
import OfflineBanner from '@/components/common/OfflineBanner';

import "../global.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) =>
                isApiError(error) && error.status >= 500 && failureCount < 2,
        },
    },
});

export default function RootLayout(): JSX.Element {
    const token = useAuth((s) => s.token);
    const hasHydrated = useAuth((s) => s.hasHydrated);
    const isDarkMode = useThemeStore((s) => s.isDarkMode);
    const session = !!token;
    const navigationTheme = getNavigationTheme(isDarkMode);

    useEffect(() => {
        setQueryClientRef(queryClient);
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
                <HeroUINativeProvider>
                    <QueryClientProvider client={queryClient}>
                        <DatabaseProvider>
                            <StatusBar
                                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                                backgroundColor={navigationTheme.background}
                            />
                            <ErrorBoundary>
                                {!hasHydrated ? (
                                    <View className="flex-1 items-center justify-center bg-background">
                                        <ActivityIndicator />
                                    </View>
                                ) : (
                                    <Stack screenOptions={{ headerShown: false }}>
                                        <Stack.Protected guard={session}>
                                            <Stack.Screen name="(app)" />
                                        </Stack.Protected>
                                        <Stack.Protected guard={!session}>
                                            <Stack.Screen name="sign-in" />
                                        </Stack.Protected>
                                    </Stack>
                                )}
                                <OfflineBanner />
                            </ErrorBoundary>
                        </DatabaseProvider>
                    </QueryClientProvider>
                </HeroUINativeProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    );
}

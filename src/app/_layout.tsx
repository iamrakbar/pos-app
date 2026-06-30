import { StatusBar } from 'expo-status-bar';
import { Stack } from "expo-router";
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatabaseProvider } from '@/db';

import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout(): JSX.Element {
    const session = true; // Replace with your session management logic

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
                <HeroUINativeProvider>
                    <QueryClientProvider client={queryClient}>
                        <DatabaseProvider>
                            <StatusBar />
                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Protected guard={!!session}>
                                    <Stack.Screen name="(app)" />
                                </Stack.Protected>
                                <Stack.Protected guard={!session}>
                                    <Stack.Screen name="sign-in" />
                                </Stack.Protected>
                            </Stack>
                        </DatabaseProvider>
                    </QueryClientProvider>
                </HeroUINativeProvider>
            </KeyboardProvider>
        </GestureHandlerRootView>
    );
}

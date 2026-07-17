import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { HeroUINativeProvider } from "heroui-native";
import { useEffect, type JSX } from "react";
import { Platform, StatusBar as NativeStatusBar, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, setQueryClientRef } from "@/stores/useAuth";
import { isApiError } from "@/api/ApiError";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useNavigationTheme } from "@/utils/navigationTheme";
import OfflineBanner from "@/components/common/OfflineBanner";
import AppUpdateManager from "@/components/common/AppUpdateManager";

import "../global.css";

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 350, fade: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => isApiError(error) && error.status >= 500 && failureCount < 2,
    },
  },
});

export default function RootLayout(): JSX.Element {
  const token = useAuth((s) => s.token);
  const hasHydrated = useAuth((s) => s.hasHydrated);
  const isDarkMode = useColorScheme() === "dark";
  const session = !!token;
  const navigationTheme = useNavigationTheme();
  const isAppReady = hasHydrated;

  const handleAppLayout = () => {
    if (isAppReady) {
      SplashScreen.hide();
    }
  };

  useEffect(() => {
    setQueryClientRef(queryClient);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      NativeStatusBar.setBackgroundColor(navigationTheme.background, true);
      NativeStatusBar.setTranslucent(false);
    }
  }, [navigationTheme.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: navigationTheme.background }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUINativeProvider>
            {Platform.OS === "android" && (
              <NavigationBar style={isDarkMode ? "dark" : "light"} hidden={false} />
            )}
            <ExpoStatusBar style={isDarkMode ? "light" : "dark"} />
            <ErrorBoundary>
              {isAppReady && (
                <View className="flex-1" onLayout={handleAppLayout}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Protected guard={session}>
                      <Stack.Screen name="(app)" />
                    </Stack.Protected>
                    <Stack.Protected guard={!session}>
                      <Stack.Screen name="sign-in" />
                    </Stack.Protected>
                  </Stack>
                </View>
              )}
              <OfflineBanner />
              <AppUpdateManager mode="banner" />
            </ErrorBoundary>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

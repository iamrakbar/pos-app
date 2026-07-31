import { Stack } from "expo-router";
import { ObserveRoot, useObserve } from "expo-observe";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { HeroUINativeProvider } from "heroui-native";
import { useEffect, type JSX, type ReactNode } from "react";
import { Platform, StatusBar as NativeStatusBar, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, setQueryClientRef } from "@/stores/use-auth";
import { isApiError } from "@/api/api-error";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { useNavigationTheme } from "@/utils/navigation-theme";
import OfflineBanner from "@/components/common/offline-banner";
import AppUpdateManager from "@/components/common/app-update-manager";
import POSAddOnSheet from "@/screens/pos/add-ons";
import { TrueSheetProvider } from "@lodev09/react-native-true-sheet";

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

function wrapToastContent(children: ReactNode): JSX.Element {
  return (
    <View pointerEvents="box-none" className="w-full max-w-md flex-1 self-center">
      {children}
    </View>
  );
}

function RootLayout(): JSX.Element {
  const token = useAuth((s) => s.token);
  const hasHydrated = useAuth((s) => s.hasHydrated);
  const isDarkMode = useColorScheme() === "dark";
  const session = !!token;
  const navigationTheme = useNavigationTheme();
  const isAppReady = hasHydrated;
  const { markInteractive } = useObserve();

  const handleAppLayout = () => {
    if (isAppReady) {
      SplashScreen.hide();
      markInteractive();
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
          <TrueSheetProvider>
            <HeroUINativeProvider config={{ toast: { contentWrapper: wrapToastContent } }}>
              {Platform.OS === "android" && <NavigationBar style="auto" hidden={false} />}
              <ExpoStatusBar style={isDarkMode ? "light" : "dark"} />
              <ErrorBoundary>
                {isAppReady && (
                  <View className="flex-1" onLayout={handleAppLayout}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Protected guard={session}>
                        <Stack.Screen name="(app)" />
                      </Stack.Protected>
                      <Stack.Protected guard={!session}>
                        <Stack.Screen name="(auth)" />
                      </Stack.Protected>
                    </Stack>
                    {session ? <POSAddOnSheet /> : null}
                  </View>
                )}
                <OfflineBanner />
                <AppUpdateManager mode="banner" />
              </ErrorBoundary>
            </HeroUINativeProvider>
          </TrueSheetProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default ObserveRoot.wrap(RootLayout);

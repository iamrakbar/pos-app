import { Stack } from "expo-router";
import { ObserveRoot, useObserve } from "expo-observe";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { PanelUIProvider, Typography as PanelTypography } from "panelui-native";
import { useEffect, type JSX } from "react";
import { Platform, StatusBar as NativeStatusBar, View } from "react-native";
import { useCSSVariable, useUniwind } from "uniwind";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, setQueryClientRef } from "@/stores/use-auth";
import { isApiError } from "@/api/api-error";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { useNavigationTheme } from "@/utils/navigation-theme";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useNetworkStore } from "@/stores/use-network-store";
import { useTranslation } from "@/stores/use-locale";
import AppUpdateManager from "@/components/common/app-update-manager";
import POSAddOnSheet from "@/screens/pos/add-ons";
import { TrueSheetProvider } from "@lodev09/react-native-true-sheet";
import PanelUIIntegrationScreen from "./panelui-integration";
import NotificationManager from "@/components/common/notification-manager";

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

function RootLayout(): JSX.Element {
  const token = useAuth((s) => s.token);
  const isOffline = useNetworkStore((state) => state.isOffline);
  const { t } = useTranslation();
  const warningForeground = useCSSVariable("--color-warning-foreground") as string;
  const hasHydrated = useAuth((s) => s.hasHydrated);
  const { theme } = useUniwind();
  const isDarkMode = theme === "dark";
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

  if (__DEV__ && process.env.EXPO_PUBLIC_PANELUI_SPIKE === "1") {
    return (
      <PanelUIProvider>
        <QueryClientProvider client={queryClient}>
          <TrueSheetProvider>
            <View className="flex-1" onLayout={handleAppLayout}>
              <PanelUIIntegrationScreen standalone />
            </View>
          </TrueSheetProvider>
        </QueryClientProvider>
      </PanelUIProvider>
    );
  }

  return (
    <PanelUIProvider>
      <QueryClientProvider client={queryClient}>
        <TrueSheetProvider>
          {Platform.OS === "android" && <NavigationBar style="auto" hidden={false} />}
          <ExpoStatusBar style={isDarkMode ? "light" : "dark"} />
          <ErrorBoundary>
            {isAppReady && (
              <View className="flex-1" onLayout={handleAppLayout}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Protected guard={__DEV__}>
                    <Stack.Screen name="panelui-integration" />
                  </Stack.Protected>
                  <Stack.Protected guard={session}>
                    <Stack.Screen name="(app)" />
                  </Stack.Protected>
                  <Stack.Protected guard={!session}>
                    <Stack.Screen name="(auth)" />
                  </Stack.Protected>
                </Stack>
                {session ? <POSAddOnSheet /> : null}
                <NotificationManager />
              </View>
            )}
            {isOffline ? (
              <View className="bg-warning/10 px-4 py-2 flex-row items-center gap-2 pb-safe">
                <AppIcon icon={AppIcons.cloudOffline} size={16} color={warningForeground} />
                <View className="flex-1">
                  <PanelTypography
                    type="body-xs"
                    weight="semibold"
                    className="text-warning-foreground"
                  >
                    {t("offline.title")}
                  </PanelTypography>
                  <PanelTypography
                    type="body-xs"
                    className="text-warning-foreground"
                    numberOfLines={1}
                  >
                    {t("offline.description")}
                  </PanelTypography>
                </View>
              </View>
            ) : null}
            <AppUpdateManager mode="banner" />
          </ErrorBoundary>
        </TrueSheetProvider>
      </QueryClientProvider>
    </PanelUIProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);

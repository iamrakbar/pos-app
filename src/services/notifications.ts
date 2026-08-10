import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

export type NotificationPermissionState = {
  status: "granted" | "denied" | "undetermined" | "unavailable";
  canAskAgain: boolean;
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function configureNotifications(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: "General",
    description: "Order and application notifications",
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 250, 150, 250],
    showBadge: true,
  });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") {
    return { status: "unavailable", canAskAgain: false };
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) {
    return { status: "granted", canAskAgain: permission.canAskAgain };
  }

  return {
    status: permission.status === Notifications.PermissionStatus.DENIED ? "denied" : "undetermined",
    canAskAgain: permission.canAskAgain,
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (Platform.OS === "web") {
    return { status: "unavailable", canAskAgain: false };
  }

  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) {
    return getNotificationPermissionState();
  }

  await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return getNotificationPermissionState();
}

export async function scheduleTestNotification(title: string, body: string): Promise<string> {
  await configureNotifications();
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: "test" },
    },
    trigger: Platform.OS === "android" ? { channelId: DEFAULT_NOTIFICATION_CHANNEL_ID } : null,
  });
}

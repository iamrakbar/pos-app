import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registerDeviceToken } from "@/api/endpoints/device-tokens";

export const ORDER_NOTIFICATION_CHANNEL_ID = "orders";
export const GENERAL_NOTIFICATION_CHANNEL_ID = "general";
export const DEFAULT_NOTIFICATION_CHANNEL_ID = GENERAL_NOTIFICATION_CHANNEL_ID;
export const NEW_ORDER_SOUND = "new_order.wav";

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

  await Promise.all([
    Notifications.setNotificationChannelAsync(ORDER_NOTIFICATION_CHANNEL_ID, {
      name: "Orders",
      description: "New order notifications",
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 250, 150, 250],
      showBadge: true,
      sound: NEW_ORDER_SOUND,
    }),
    Notifications.setNotificationChannelAsync(GENERAL_NOTIFICATION_CHANNEL_ID, {
      name: "General",
      description: "Application notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: true,
      showBadge: true,
    }),
  ]);
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

export async function getDevicePushToken(): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("Push tokens are not available on web.");
  }

  await configureNotifications();
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Notification permission was not granted.");
  }

  return (await Notifications.getDevicePushTokenAsync()).data;
}

export async function registerCurrentDevicePushToken(): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("Push tokens are not available on web.");
  }

  const token = await getDevicePushToken();
  return registerDevicePushTokenValue({ data: token });
}

export async function registerDevicePushTokenValue(deviceToken: { data: string }): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("Push tokens are not available on web.");
  }

  const platform = Platform.OS === "ios" ? "ios" : "android";
  const response = await registerDeviceToken({
    token: deviceToken.data,
    platform,
    app_version: Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null,
  });

  return response.data.id;
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
    trigger: Platform.OS === "android" ? { channelId: GENERAL_NOTIFICATION_CHANNEL_ID } : null,
  });
}

export async function scheduleGeneralNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<string> {
  await configureNotifications();
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data },
    trigger: Platform.OS === "android" ? { channelId: GENERAL_NOTIFICATION_CHANNEL_ID } : null,
  });
}

export async function notifyNewOrder(
  order: {
    id: string;
    code: string;
    total?: string | number | null;
    merchantId: string;
  },
  title: string,
  body: string
): Promise<string> {
  await configureNotifications();
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: NEW_ORDER_SOUND,
      data: { type: "order.created", orderId: order.id, merchantId: order.merchantId },
    },
    trigger: Platform.OS === "android" ? { channelId: ORDER_NOTIFICATION_CHANNEL_ID } : null,
  });
}

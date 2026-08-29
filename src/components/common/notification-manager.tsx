import {
  configureNotifications,
  getNotificationPermissionState,
  registerDevicePushTokenValue,
  requestNotificationPermission,
  notifyNewOrder,
} from "@/services/notifications";
import { getOrders } from "@/api/endpoints/orders";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { useQueryClient } from "@tanstack/react-query";
import { router, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";
import React from "react";

const ORDER_POLL_INTERVAL_MS = 15_000;
const remotelyNotifiedOrderIds = new Set<string>();

function getOrderNotificationData(notification: Notifications.Notification) {
  const data = notification.request.content.data;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const orderId = record.orderId ?? record.order_id;
  const eventType = record.type ?? record.event;
  const eventIsOrder =
    eventType == null ||
    eventType === "order.created" ||
    eventType === "new_order" ||
    eventType === "new-order";

  if (!eventIsOrder || typeof orderId !== "string") return null;

  const merchantValue = record.merchantId ?? record.merchant_id;
  return {
    orderId,
    merchantId: typeof merchantValue === "string" ? merchantValue : null,
  };
}

export default function NotificationManager(): null {
  const merchantId = useAuth((state) => state.merchantId);
  const token = useAuth((state) => state.token);
  const hasHydrated = useAuth((state) => state.hasHydrated);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const rootNavigationState = useRootNavigationState();

  React.useEffect(() => {
    void configureNotifications().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (Platform.OS === "web" || !hasHydrated || !merchantId || !token) return;

    let stopped = false;
    let lastRegisteredToken: string | null = null;
    let inFlightToken: string | null = null;
    let inFlightRegistration: Promise<void> | null = null;

    const registerPushToken = (deviceToken: { data: string }) => {
      if (stopped || deviceToken.data === lastRegisteredToken) return Promise.resolve();
      if (deviceToken.data === inFlightToken && inFlightRegistration) return inFlightRegistration;

      inFlightToken = deviceToken.data;
      inFlightRegistration = registerDevicePushTokenValue(deviceToken)
        .then((registrationId) => {
          lastRegisteredToken = deviceToken.data;
          if (__DEV__) console.info("Device push token registered", registrationId);
        })
        .catch(() => {
          // Registration is retried on app resume or the next token rotation.
        })
        .finally(() => {
          inFlightToken = null;
          inFlightRegistration = null;
        });

      return inFlightRegistration;
    };

    const syncPushToken = async (requestPermission: boolean) => {
      try {
        await configureNotifications();
        const permission = requestPermission
          ? await requestNotificationPermission()
          : await getNotificationPermissionState();
        if (stopped || !permission.status || permission.status !== "granted") return;

        await registerPushToken(await Notifications.getDevicePushTokenAsync());
      } catch {
        // Permission is undetermined/denied, or push is unavailable on this build.
      }
    };

    void syncPushToken(true);
    const tokenSubscription = Notifications.addPushTokenListener((deviceToken) => {
      void registerPushToken(deviceToken);
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncPushToken(false);
    });

    return () => {
      stopped = true;
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [hasHydrated, merchantId, token]);

  React.useEffect(() => {
    if (Platform.OS === "web" || !merchantId || !token) return;

    let stopped = false;
    let initialized = false;
    let knownOrderIds = new Set<string>();

    const refreshOrders = async () => {
      try {
        const response = await getOrders(merchantId, { per_page: 20, sort: "-created_at" });
        if (stopped) return;

        const orders = response.data;
        const currentIds = new Set(orders.map((order) => order.id));
        const newOrders = initialized
          ? orders.filter(
              (order) => !knownOrderIds.has(order.id) && !remotelyNotifiedOrderIds.has(order.id)
            )
          : [];
        knownOrderIds = currentIds;
        initialized = true;

        if (newOrders.length === 0) return;

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["orders", merchantId] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard", merchantId] }),
        ]);
        await Promise.all(
          newOrders
            .slice(0, 3)
            .map((order) =>
              notifyNewOrder(
                { id: order.id, code: order.code, total: order.total, merchantId },
                t("notifications.newOrderTitle"),
                t("notifications.newOrderBody", { code: order.code })
              )
            )
        );
      } catch {
        // Polling is a best-effort alert. The normal queries remain authoritative.
      }
    };

    void refreshOrders();
    const interval = setInterval(() => void refreshOrders(), ORDER_POLL_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshOrders();
    });

    return () => {
      stopped = true;
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [merchantId, queryClient, t, token]);

  React.useEffect(() => {
    if (Platform.OS === "web" || !rootNavigationState?.key) return;

    const refreshForOrder = (notification: Notifications.Notification) => {
      const data = getOrderNotificationData(notification);
      if (!data || (data.merchantId && data.merchantId !== merchantId)) return;

      remotelyNotifiedOrderIds.add(data.orderId);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", merchantId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", merchantId] }),
        queryClient.invalidateQueries({ queryKey: ["order", merchantId, data.orderId] }),
      ]);
    };

    const openOrder = (response: Notifications.NotificationResponse) => {
      const data = getOrderNotificationData(response.notification);
      if (data && (!data.merchantId || data.merchantId === merchantId)) {
        remotelyNotifiedOrderIds.add(data.orderId);
        void queryClient.invalidateQueries({ queryKey: ["order", merchantId, data.orderId] });
        router.push(`/orders/${data.orderId}` as never);
      }
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(refreshForOrder);
    const subscription = Notifications.addNotificationResponseReceivedListener(openOrder);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openOrder(response);
    });
    return () => {
      receivedSubscription.remove();
      subscription.remove();
    };
  }, [merchantId, queryClient, rootNavigationState?.key]);

  return null;
}

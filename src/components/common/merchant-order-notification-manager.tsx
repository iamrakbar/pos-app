import {
  createMerchantEcho,
  parseMerchantOrderPaidEvent,
  type MerchantOrderPaidEvent,
} from "@/services/merchant-order-notifications";
import { useAuth } from "@/stores/use-auth";
import { useTranslation } from "@/stores/use-locale";
import { useOrderRealtimeStatus } from "@/stores/use-order-realtime-status";
import { useToast } from "heroui-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState } from "react-native";

const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const MAX_DEDUPE_ENTRIES = 500;

function isActiveOrderEvent(event: MerchantOrderPaidEvent, merchantId: string): boolean {
  return event.merchant_id === merchantId && event.payment_status === "settlement";
}

export default function MerchantOrderNotificationManager(): null {
  const token = useAuth((state) => state.token);
  const merchantId = useAuth((state) => state.merchantId);
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setRealtimeStatus = useOrderRealtimeStatus((state) => state.setStatus);

  useEffect(() => {
    if (!token || !merchantId) {
      setRealtimeStatus("disconnected");
      return () => undefined;
    }

    let isSessionActive = true;
    const processedOrders = new Map<string, number>();
    let hasShownConnectionError = false;
    let echo: ReturnType<typeof createMerchantEcho>;

    const pruneProcessedOrders = () => {
      const now = Date.now();
      for (const [orderId, processedAt] of processedOrders) {
        if (now - processedAt > DEDUPE_WINDOW_MS) processedOrders.delete(orderId);
      }
      while (processedOrders.size > MAX_DEDUPE_ENTRIES) {
        const oldest = processedOrders.keys().next().value;
        if (!oldest) break;
        processedOrders.delete(oldest);
      }
    };

    const processEvent = (payload: unknown) => {
      if (!isSessionActive) return;
      const event = parseMerchantOrderPaidEvent(payload);
      if (!event || !isActiveOrderEvent(event, merchantId)) return;

      pruneProcessedOrders();
      if (processedOrders.has(event.order_id)) return;
      processedOrders.set(event.order_id, Date.now());

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", merchantId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", merchantId] }),
      ]);

      toast.show({
        variant: "success",
        label: t("notifications.newPaidOrder"),
        description: event.code
          ? t("notifications.newPaidOrderDescription", { code: event.code })
          : undefined,
        actionLabel: t("notifications.viewOrder"),
        onActionPress: () => {
          if (isSessionActive) router.push(`/orders/${event.order_id}` as never);
        },
      });
    };

    try {
      setRealtimeStatus("connecting");
      echo = createMerchantEcho(token);
    } catch (error) {
      setRealtimeStatus("failed");
      if (__DEV__) console.warn("Merchant Reverb configuration is unavailable", error);
      return () => undefined;
    }

    const channel = echo.private(`merchants.${merchantId}`);
    channel.listen(".order.paid", processEvent);
    const removeConnectionListener = echo.connector.onConnectionChange((status) => {
      setRealtimeStatus(status);
    });
    const handleChannelError = () => {
      setRealtimeStatus("failed");
      if (hasShownConnectionError || !isSessionActive) return;
      hasShownConnectionError = true;
      toast.show({
        variant: "danger",
        label: t("notifications.orderConnectionFailed"),
        description: t("notifications.orderConnectionFailedDescription"),
      });
      if (__DEV__) console.warn("Merchant Reverb channel authorization failed");
    };
    channel.error(handleChannelError);

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || !isSessionActive) return;

      const connector = echo.connector;
      if (connector.connectionStatus() !== "connected") connector.pusher.connect();
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", merchantId] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", merchantId] }),
      ]);
    });

    return () => {
      isSessionActive = false;
      appStateSubscription.remove();
      removeConnectionListener();
      channel.stopListening(".order.paid", processEvent);
      echo.leave(`merchants.${merchantId}`);
      echo.disconnect();
      setRealtimeStatus("disconnected");
    };
  }, [merchantId, queryClient, router, setRealtimeStatus, t, toast, token]);

  return null;
}

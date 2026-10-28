import {
  Alert as PanelAlert,
  Button as PanelButton,
  Typography,
  useToast,
  Card,
  Chip as PanelChip,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import type { Translate } from "@/locales";
import {
  getDevicePushToken,
  registerCurrentDevicePushToken,
  scheduleTestNotification,
} from "@/services/notifications";
import { useTranslation } from "@/stores/use-locale";
import Constants from "expo-constants";
import React from "react";
import { Linking, ScrollView, View } from "react-native";

async function sendTestNotification(
  t: Translate,
  toast: ReturnType<typeof useToast>["toast"]
): Promise<void> {
  try {
    await scheduleTestNotification(
      t("notifications.testNotificationTitle"),
      t("notifications.testNotificationBody")
    );
    toast.show({ variant: "success", label: t("notifications.testScheduled") });
  } catch (error) {
    toast.show({
      variant: "destructive",
      label: t("notifications.testFailed"),
      description: error instanceof Error ? error.message : undefined,
    });
  }
}

export default function NotificationsSettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accentColor] = useCSSVariable(["--color-primary"]) as [string];
  const permission = useNotificationPermission();
  const isProduction = Constants.expoConfig?.extra?.buildVariant === "production";
  const [isSendingTest, setIsSendingTest] = React.useState(false);
  const [pushToken, setPushToken] = React.useState<string | null>(null);
  const [isGettingToken, setIsGettingToken] = React.useState(false);

  const statusLabel = t(`notifications.permission.${permission.status}`);
  const statusColor =
    permission.status === "granted"
      ? "success"
      : permission.status === "denied"
        ? "danger"
        : "default";

  const handleRequest = async () => {
    try {
      const nextPermission = await permission.request();
      toast.show({
        variant: nextPermission.status === "granted" ? "success" : "warning",
        label:
          nextPermission.status === "granted"
            ? t("notifications.permissionGranted")
            : t("notifications.permissionNotGranted"),
      });
      if (nextPermission.status === "granted") {
        void registerCurrentDevicePushToken().catch(() => undefined);
      }
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("notifications.permissionRequestFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    await sendTestNotification(t, toast).finally(() => setIsSendingTest(false));
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("notifications.openSettingsFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleGetToken = async () => {
    setIsGettingToken(true);
    try {
      setPushToken(await getDevicePushToken());
      toast.show({ variant: "success", label: t("notifications.tokenReady") });
    } catch (error) {
      toast.show({
        variant: "destructive",
        label: t("notifications.tokenFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    }
    setIsGettingToken(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-10 md:px-6"
    >
      <View className="mx-auto w-full max-w-3xl gap-5">
        <NotificationsCard
          permission={permission}
          isProduction={isProduction}
          isSendingTest={isSendingTest}
          isGettingToken={isGettingToken}
          pushToken={pushToken}
          statusLabel={statusLabel}
          statusColor={statusColor}
          accentColor={accentColor}
          onRequest={handleRequest}
          onOpenSettings={handleOpenSettings}
          onSendTest={handleSendTest}
          onGetToken={handleGetToken}
        />

        <Typography type="body-xs" muted className="px-1">
          {t("notifications.localOnlyNotice")}
        </Typography>
      </View>
    </ScrollView>
  );
}

function NotificationsCard({
  permission,
  isProduction,
  isSendingTest,
  isGettingToken,
  pushToken,
  statusLabel,
  statusColor,
  accentColor,
  onRequest,
  onOpenSettings,
  onSendTest,
  onGetToken,
}: {
  permission: ReturnType<typeof useNotificationPermission>;
  isProduction: boolean;
  isSendingTest: boolean;
  isGettingToken: boolean;
  pushToken: string | null;
  statusLabel: string;
  statusColor: "success" | "danger" | "default";
  accentColor: string;
  onRequest: () => void;
  onOpenSettings: () => void;
  onSendTest: () => void;
  onGetToken: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="p-4">
      <Card.Content className="gap-4 p-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-xl bg-accent">
              <AppIcon icon={AppIcons.notifications} size={20} color={accentColor} />
            </View>
            <View className="flex-1 gap-1">
              <Card.Title>{t("notifications.title")}</Card.Title>
              {permission.status !== "granted" ? (
                <Card.Description>{t("notifications.description")}</Card.Description>
              ) : null}
            </View>
          </View>
          <PanelChip size="sm" variant={statusColor === "danger" ? "destructive" : statusColor}>
            <PanelChip.Label>
              {permission.isLoading ? t("notifications.loading") : statusLabel}
            </PanelChip.Label>
          </PanelChip>
        </View>

        {permission.status !== "granted" ? (
          <PanelAlert variant={permission.status === "denied" ? "warning" : "info"}>
            <PanelAlert.Indicator />
            <PanelAlert.Content>
              <PanelAlert.Title>{t("notifications.permissionTitle")}</PanelAlert.Title>
              <PanelAlert.Description>
                {t(`notifications.descriptionByStatus.${permission.status}`)}
              </PanelAlert.Description>
            </PanelAlert.Content>
          </PanelAlert>
        ) : null}

        <NotificationActions
          permission={permission}
          isProduction={isProduction}
          isSendingTest={isSendingTest}
          isGettingToken={isGettingToken}
          onRequest={onRequest}
          onOpenSettings={onOpenSettings}
          onSendTest={onSendTest}
          onGetToken={onGetToken}
        />

        {pushToken ? (
          <View className="rounded-2xl bg-surface-secondary p-3">
            <Typography type="body-xs" weight="semibold">
              {t("notifications.tokenLabel")}
            </Typography>
            <Typography selectable type="body-xs" muted className="mt-1">
              {pushToken}
            </Typography>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function NotificationActions({
  permission,
  isProduction,
  isSendingTest,
  isGettingToken,
  onRequest,
  onOpenSettings,
  onSendTest,
  onGetToken,
}: {
  permission: ReturnType<typeof useNotificationPermission>;
  isProduction: boolean;
  isSendingTest: boolean;
  isGettingToken: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
  onSendTest: () => void;
  onGetToken: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View className="gap-3 pt-1">
      {permission.status === "undetermined" ||
      (permission.status === "denied" && permission.canAskAgain) ? (
        <PanelButton
          className="w-full"
          disabled={permission.isLoading || permission.isRequesting}
          onPress={onRequest}
        >
          {permission.isRequesting ? t("notifications.requesting") : t("notifications.allow")}
        </PanelButton>
      ) : null}

      {permission.status === "denied" && !permission.canAskAgain ? (
        <PanelButton className="w-full" onPress={onOpenSettings}>
          {t("notifications.openSettings")}
        </PanelButton>
      ) : null}

      {permission.status === "granted" && !isProduction ? (
        <>
          <PanelButton className="w-full" disabled={isSendingTest} onPress={onSendTest}>
            {isSendingTest ? t("notifications.sendingTest") : t("notifications.sendTest")}
          </PanelButton>
          <PanelButton
            variant="outline"
            className="w-full"
            disabled={isGettingToken}
            onPress={onGetToken}
          >
            {isGettingToken ? t("notifications.gettingToken") : t("notifications.getToken")}
          </PanelButton>
        </>
      ) : null}
    </View>
  );
}

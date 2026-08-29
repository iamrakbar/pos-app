import AppIcon from "@/components/common/app-icon";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import type { Translate } from "@/locales";
import {
  getDevicePushToken,
  registerCurrentDevicePushToken,
  scheduleTestNotification,
} from "@/services/notifications";
import { useTranslation } from "@/stores/use-locale";
import { Alert, Button, Card, Chip, Typography, useThemeColor, useToast } from "heroui-native";
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
      variant: "danger",
      label: t("notifications.testFailed"),
      description: error instanceof Error ? error.message : undefined,
    });
  }
}

export default function NotificationsSettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accentColor] = useThemeColor(["accent"]);
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
        variant: "danger",
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
        variant: "danger",
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
        variant: "danger",
        label: t("notifications.tokenFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsGettingToken(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-10 md:px-6"
    >
      <View className="mx-auto w-full max-w-3xl gap-5">
        <Card>
          <Card.Body className="gap-4 p-5">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-3">
                <View className="size-10 items-center justify-center rounded-panel-inner bg-accent-soft">
                  <AppIcon name="notifications-outline" size={20} color={accentColor} />
                </View>
                <View className="flex-1 gap-1">
                  <Card.Title>{t("notifications.title")}</Card.Title>
                  {permission.status !== "granted" ? (
                    <Card.Description>{t("notifications.description")}</Card.Description>
                  ) : null}
                </View>
              </View>
              <Chip size="sm" variant="soft" color={statusColor}>
                <Chip.Label>
                  {permission.isLoading ? t("notifications.loading") : statusLabel}
                </Chip.Label>
              </Chip>
            </View>

            {permission.status !== "granted" ? (
              <Alert status={permission.status === "denied" ? "warning" : "accent"}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("notifications.permissionTitle")}</Alert.Title>
                  <Alert.Description>
                    {t(`notifications.descriptionByStatus.${permission.status}`)}
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}

            <View className="gap-3 pt-1">
              {permission.status === "undetermined" ||
              (permission.status === "denied" && permission.canAskAgain) ? (
                <Button
                  className="w-full"
                  isDisabled={permission.isLoading || permission.isRequesting}
                  onPress={handleRequest}
                >
                  <Button.Label>
                    {permission.isRequesting
                      ? t("notifications.requesting")
                      : t("notifications.allow")}
                  </Button.Label>
                </Button>
              ) : null}

              {permission.status === "denied" && !permission.canAskAgain ? (
                <Button className="w-full" onPress={handleOpenSettings}>
                  <Button.Label>{t("notifications.openSettings")}</Button.Label>
                </Button>
              ) : null}

              {permission.status === "granted" ? (
                !isProduction ? (
                  <>
                    <Button className="w-full" isDisabled={isSendingTest} onPress={handleSendTest}>
                      <Button.Label>
                        {isSendingTest
                          ? t("notifications.sendingTest")
                          : t("notifications.sendTest")}
                      </Button.Label>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      isDisabled={isGettingToken}
                      onPress={handleGetToken}
                    >
                      <Button.Label>
                        {isGettingToken
                          ? t("notifications.gettingToken")
                          : t("notifications.getToken")}
                      </Button.Label>
                    </Button>
                  </>
                ) : null
              ) : null}
            </View>

            {pushToken ? (
              <View className="rounded-panel bg-surface-secondary p-3">
                <Typography type="body-xs" weight="semibold">
                  {t("notifications.tokenLabel")}
                </Typography>
                <Typography selectable type="body-xs" color="muted" className="mt-1">
                  {pushToken}
                </Typography>
              </View>
            ) : null}
          </Card.Body>
        </Card>

        <Typography type="body-xs" color="muted" className="px-1">
          {t("notifications.localOnlyNotice")}
        </Typography>
      </View>
    </ScrollView>
  );
}

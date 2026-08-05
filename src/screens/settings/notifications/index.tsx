import AppIcon from "@/components/common/app-icon";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { scheduleTestNotification } from "@/services/notifications";
import { useTranslation } from "@/stores/use-locale";
import { Button, Card, Chip, Typography, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { Linking, ScrollView, View } from "react-native";

export default function NotificationsSettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mutedColor, accentColor, accentForegroundColor] = useThemeColor([
    "muted",
    "accent",
    "accent-foreground",
  ]);
  const permission = useNotificationPermission();
  const [isSendingTest, setIsSendingTest] = React.useState(false);

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
    } finally {
      setIsSendingTest(false);
    }
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

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 py-6 pb-10 md:px-6"
    >
      <View className="mx-auto w-full max-w-3xl gap-5">
        <Card>
          <Card.Body className="gap-5 p-5">
            <View className="flex-row items-start gap-4">
              <View className="size-12 items-center justify-center rounded-panel-inner bg-accent-soft">
                <AppIcon name="notifications-outline" size={22} color={accentColor} />
              </View>
              <View className="flex-1 gap-2">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <Card.Title>{t("notifications.title")}</Card.Title>
                  <Chip size="sm" variant="soft" color={statusColor}>
                    <Chip.Label>
                      {permission.isLoading ? t("notifications.loading") : statusLabel}
                    </Chip.Label>
                  </Chip>
                </View>
                <Card.Description>{t("notifications.description")}</Card.Description>
              </View>
            </View>

            <View className="rounded-panel bg-surface-secondary p-4">
              <Typography type="body-sm" weight="semibold">
                {t("notifications.permissionTitle")}
              </Typography>
              <Typography type="body-xs" color="muted" className="mt-1">
                {t(`notifications.descriptionByStatus.${permission.status}`)}
              </Typography>
            </View>
          </Card.Body>

          <Card.Footer className="flex-row flex-wrap gap-3 px-5 pb-5">
            {permission.status === "undetermined" ||
            (permission.status === "denied" && permission.canAskAgain) ? (
              <Button
                className="flex-1"
                isDisabled={permission.isLoading || permission.isRequesting}
                onPress={handleRequest}
              >
                <AppIcon name="notifications-outline" size={18} color={accentForegroundColor} />
                <Button.Label>
                  {permission.isRequesting
                    ? t("notifications.requesting")
                    : t("notifications.allow")}
                </Button.Label>
              </Button>
            ) : null}

            {permission.status === "denied" && !permission.canAskAgain ? (
              <Button className="flex-1" onPress={handleOpenSettings}>
                <AppIcon name="settings-outline" size={18} color={accentForegroundColor} />
                <Button.Label>{t("notifications.openSettings")}</Button.Label>
              </Button>
            ) : null}

            {permission.status === "granted" ? (
              <>
                <Button className="flex-1" isDisabled={isSendingTest} onPress={handleSendTest}>
                  <AppIcon name="paper-plane-outline" size={18} color={accentForegroundColor} />
                  <Button.Label>
                    {isSendingTest ? t("notifications.sendingTest") : t("notifications.sendTest")}
                  </Button.Label>
                </Button>
                <Button variant="outline" className="flex-1" onPress={handleOpenSettings}>
                  <AppIcon name="settings-outline" size={18} color={mutedColor} />
                  <Button.Label>{t("notifications.manageSettings")}</Button.Label>
                </Button>
              </>
            ) : null}
          </Card.Footer>
        </Card>

        <Typography type="body-xs" color="muted" className="px-1">
          {t("notifications.localOnlyNotice")}
        </Typography>
      </View>
    </ScrollView>
  );
}

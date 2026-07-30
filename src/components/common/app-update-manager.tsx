import AppIcon from "@/components/common/app-icon";
import * as Updates from "expo-updates";
import {
  Alert as HeroAlert,
  Button,
  Card,
  Spinner,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useState, type JSX } from "react";
import { Alert as NativeAlert, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type AppUpdateManagerProps = {
  mode: "banner" | "settings";
};

type UpdateActionStatus = "idle" | "checking" | "downloading" | "restarting";

const UPDATE_DATE_FORMATTERS = {
  en: new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }),
  id: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }),
} as const;

function shortId(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return value.slice(0, 8);
}

export default function AppUpdateManager({ mode }: AppUpdateManagerProps): JSX.Element | null {
  const { locale, t } = useTranslation();
  const updates = Updates.useUpdates();
  const [themeColorAccent, themeColorBackground] = useThemeColor(["accent", "background"]);
  const [actionStatus, setActionStatus] = useState<UpdateActionStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [dismissedUpdateId, setDismissedUpdateId] = useState<string | null>(null);

  const isBusy =
    updates.isChecking ||
    updates.isDownloading ||
    updates.isRestarting ||
    actionStatus === "checking" ||
    actionStatus === "downloading" ||
    actionStatus === "restarting";
  const isSupported = Updates.isEnabled && !__DEV__;
  const downloadedUpdateId = updates.downloadedUpdate?.updateId ?? "rollback";
  const notAvailable = t("updates.notAvailable");
  const dateFormatter = UPDATE_DATE_FORMATTERS[locale];
  const formatDate = (value?: Date | null): string =>
    value ? dateFormatter.format(value) : notAvailable;

  const statusText = (() => {
    if (!Updates.isEnabled) return t("updates.disabled");
    if (__DEV__) return t("updates.releaseOnly");
    if (updates.isRestarting || actionStatus === "restarting") return t("updates.restarting");
    if (updates.isDownloading || actionStatus === "downloading") return t("updates.downloading");
    if (updates.isChecking || actionStatus === "checking") return t("updates.checking");
    if (updates.isUpdatePending) return t("updates.pending");
    if (updates.isUpdateAvailable) return t("updates.available");
    if (message) return message;
    return t("updates.current");
  })();

  const restartApp = async () => {
    if (!isSupported) {
      NativeAlert.alert(t("updates.unavailableTitle"), statusText);
      return;
    }

    setActionStatus("restarting");
    setMessage(null);
    await Updates.reloadAsync({
      reloadScreenOptions: {
        backgroundColor: themeColorBackground,
        fade: true,
        spinner: {
          color: themeColorAccent,
          size: "large",
        },
      },
    });
  };

  const checkForUpdates = async () => {
    if (!isSupported) {
      setMessage(statusText);
      return;
    }

    try {
      setActionStatus("checking");
      setMessage(null);
      const result = await Updates.checkForUpdateAsync();

      if (result.isAvailable || result.isRollBackToEmbedded) {
        setActionStatus("downloading");
        const fetchResult = await Updates.fetchUpdateAsync();
        if (fetchResult.isNew || fetchResult.isRollBackToEmbedded) {
          setMessage(t("updates.downloaded"));
        } else {
          setMessage(t("updates.noNewDownload"));
        }
      } else {
        setMessage(t("updates.noneAvailable"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("updates.requestFailed"));
    }
    setActionStatus("idle");
  };

  if (mode === "banner") {
    if (!updates.isUpdatePending || dismissedUpdateId === downloadedUpdateId) {
      return null;
    }

    return (
      <View className="absolute left-4 right-4 bottom-4">
        <HeroAlert status="accent" className="items-center shadow-lg">
          <HeroAlert.Indicator />
          <HeroAlert.Content>
            <HeroAlert.Title>{t("updates.ready")}</HeroAlert.Title>
            <HeroAlert.Description>{t("updates.readyDescription")}</HeroAlert.Description>
          </HeroAlert.Content>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setDismissedUpdateId(downloadedUpdateId)}
            >
              <Button.Label>{t("updates.later")}</Button.Label>
            </Button>
            <Button size="sm" variant="primary" onPress={restartApp}>
              <Button.Label>{t("updates.restart")}</Button.Label>
            </Button>
          </View>
        </HeroAlert>
      </View>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <View className="gap-4 px-4 py-4">
        <View className="flex-row items-center gap-4">
          <View className="w-10 h-10 rounded-panel-inner bg-accent-soft items-center justify-center">
            {isBusy ? (
              <Spinner size="sm" color={themeColorAccent} />
            ) : (
              <AppIcon name="cloud-download-outline" size={20} color={themeColorAccent} />
            )}
          </View>
          <View className="flex-1 gap-0.5">
            <Typography type="body-sm" weight="semibold">
              {t("updates.title")}
            </Typography>
            <Typography type="body-xs" color="muted" numberOfLines={2}>
              {statusText}
            </Typography>
          </View>
        </View>

        {updates.downloadProgress ? (
          <View className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
            <View
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(updates.downloadProgress * 100)}%` }}
            />
          </View>
        ) : null}

        <View className="gap-2 rounded-panel-inner bg-surface-secondary px-3 py-3">
          <UpdateMetaRow
            label={t("updates.channel")}
            value={updates.currentlyRunning.channel ?? notAvailable}
          />
          <UpdateMetaRow
            label={t("updates.runtime")}
            value={updates.currentlyRunning.runtimeVersion ?? notAvailable}
          />
          <UpdateMetaRow
            label={t("updates.currentUpdate")}
            value={shortId(updates.currentlyRunning.updateId, notAvailable)}
          />
          <UpdateMetaRow
            label={t("updates.created")}
            value={formatDate(updates.currentlyRunning.createdAt)}
          />
        </View>

        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            onPress={checkForUpdates}
            isDisabled={isBusy || updates.isUpdatePending}
            className="flex-1"
          >
            <AppIcon name="refresh-outline" size={18} color={themeColorAccent} />
            <Button.Label>{t("updates.check")}</Button.Label>
          </Button>
          <Button
            variant="primary"
            onPress={restartApp}
            isDisabled={!updates.isUpdatePending || isBusy}
            className="flex-1"
          >
            <AppIcon name="reload-outline" size={18} color="white" />
            <Button.Label>{t("updates.restart")}</Button.Label>
          </Button>
        </View>
      </View>
    </Card>
  );
}

function UpdateMetaRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="flex-row items-center gap-3">
      <Typography type="body-xs" color="muted" className="w-28">
        {label}
      </Typography>
      <Typography type="body-xs" weight="medium" numberOfLines={1} className="flex-1">
        {value}
      </Typography>
    </View>
  );
}

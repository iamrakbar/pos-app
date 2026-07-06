import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { Alert as HeroAlert, Button, Card, Spinner, Typography, useThemeColor } from 'heroui-native';
import { useCallback, useMemo, useState, type JSX } from 'react';
import { Alert as NativeAlert, View } from 'react-native';

type AppUpdateManagerProps = {
    mode: 'banner' | 'settings';
};

type UpdateActionStatus = 'idle' | 'checking' | 'downloading' | 'restarting';

function formatDate(value?: Date | null): string {
    if (!value) return 'Not available';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(value);
}

function shortId(value?: string | null): string {
    if (!value) return 'Not available';
    return value.slice(0, 8);
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Unable to complete update request.';
}

export default function AppUpdateManager({ mode }: AppUpdateManagerProps): JSX.Element | null {
    const updates = Updates.useUpdates();
    const [themeColorAccent, themeColorBackground] = useThemeColor(['accent', 'background']);
    const [actionStatus, setActionStatus] = useState<UpdateActionStatus>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [dismissedUpdateId, setDismissedUpdateId] = useState<string | null>(null);

    const isBusy =
        updates.isChecking ||
        updates.isDownloading ||
        updates.isRestarting ||
        actionStatus === 'checking' ||
        actionStatus === 'downloading' ||
        actionStatus === 'restarting';
    const isSupported = Updates.isEnabled && !__DEV__;
    const downloadedUpdateId = updates.downloadedUpdate?.updateId ?? 'rollback';

    const statusText = useMemo(() => {
        if (!Updates.isEnabled) return 'Updates are not enabled for this build.';
        if (__DEV__) return 'Updates can be checked in release builds only.';
        if (updates.isRestarting || actionStatus === 'restarting') return 'Restarting app...';
        if (updates.isDownloading || actionStatus === 'downloading') return 'Downloading update...';
        if (updates.isChecking || actionStatus === 'checking') return 'Checking for updates...';
        if (updates.isUpdatePending) return 'Update downloaded and ready to install.';
        if (updates.isUpdateAvailable) return 'Update available for download.';
        if (message) return message;
        return 'App is up to date.';
    }, [
        actionStatus,
        message,
        updates.isChecking,
        updates.isDownloading,
        updates.isRestarting,
        updates.isUpdateAvailable,
        updates.isUpdatePending,
    ]);

    const restartApp = useCallback(async () => {
        if (!isSupported) {
            NativeAlert.alert('Updates unavailable', statusText);
            return;
        }

        setActionStatus('restarting');
        setMessage(null);
        await Updates.reloadAsync({
            reloadScreenOptions: {
                backgroundColor: themeColorBackground,
                fade: true,
                spinner: {
                    color: themeColorAccent,
                    size: 'large',
                },
            },
        });
    }, [isSupported, statusText, themeColorAccent, themeColorBackground]);

    const checkForUpdates = useCallback(async () => {
        if (!isSupported) {
            setMessage(statusText);
            return;
        }

        try {
            setActionStatus('checking');
            setMessage(null);
            const result = await Updates.checkForUpdateAsync();

            if (result.isAvailable || result.isRollBackToEmbedded) {
                setActionStatus('downloading');
                const fetchResult = await Updates.fetchUpdateAsync();
                if (fetchResult.isNew || fetchResult.isRollBackToEmbedded) {
                    setMessage('Update downloaded. Restart when the register is ready.');
                    return;
                }
                setMessage('No newer update was downloaded.');
                return;
            }

            setMessage('No update available.');
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setActionStatus('idle');
        }
    }, [isSupported, statusText]);

    if (mode === 'banner') {
        if (!updates.isUpdatePending || dismissedUpdateId === downloadedUpdateId) {
            return null;
        }

        return (
            <View className="absolute left-4 right-4 bottom-4">
                <HeroAlert status="accent" className="items-center shadow-lg">
                    <HeroAlert.Indicator />
                    <HeroAlert.Content>
                        <HeroAlert.Title>Update ready</HeroAlert.Title>
                        <HeroAlert.Description>
                            Restart to apply the downloaded app update.
                        </HeroAlert.Description>
                    </HeroAlert.Content>
                    <View className="flex-row gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setDismissedUpdateId(downloadedUpdateId)}
                        >
                            <Button.Label>Later</Button.Label>
                        </Button>
                        <Button size="sm" variant="primary" onPress={restartApp}>
                            <Button.Label>Restart</Button.Label>
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
                            <Ionicons name="cloud-download-outline" size={20} color={themeColorAccent} />
                        )}
                    </View>
                    <View className="flex-1 gap-0.5">
                        <Typography type="body-sm" weight="semibold">
                            App Updates
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
                    <UpdateMetaRow label="Channel" value={updates.currentlyRunning.channel ?? 'Not available'} />
                    <UpdateMetaRow label="Runtime" value={updates.currentlyRunning.runtimeVersion ?? 'Not available'} />
                    <UpdateMetaRow label="Current update" value={shortId(updates.currentlyRunning.updateId)} />
                    <UpdateMetaRow label="Created" value={formatDate(updates.currentlyRunning.createdAt)} />
                </View>

                <View className="flex-row gap-3">
                    <Button
                        variant="secondary"
                        onPress={checkForUpdates}
                        isDisabled={isBusy || updates.isUpdatePending}
                        className="flex-1"
                    >
                        <Ionicons name="refresh-outline" size={18} color={themeColorAccent} />
                        <Button.Label>Check</Button.Label>
                    </Button>
                    <Button
                        variant="primary"
                        onPress={restartApp}
                        isDisabled={!updates.isUpdatePending || isBusy}
                        className="flex-1"
                    >
                        <Ionicons name="reload-outline" size={18} color="white" />
                        <Button.Label>Restart</Button.Label>
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

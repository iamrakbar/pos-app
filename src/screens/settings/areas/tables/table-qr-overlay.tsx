import {
  Button as PanelButton,
  Dialog as PanelDialog,
  Typography,
  QRCode,
  useToast,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTranslation } from "@/stores/use-locale";
import { getTableOrderUrl } from "@/utils/table-order-url";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import React from "react";
import { Platform, View } from "react-native";
import { Image } from "expo-image";
import { captureRef } from "react-native-view-shot";

type TableData = App.Data.Merchant.Area.TableData;
type QrAction = "download" | "share" | null;

type TableQrOverlayProps = {
  table: TableData | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const QR_EXPORT_SIZE = 1024;
const QR_CODE_SIZE = 240;
const QR_LOGO_SIZE = 48;
const SOEAT_LOGO = require("../../../../../assets/images/logo.svg");

function getTableNumberLabel(tableName: string): string {
  const tableNumber = tableName.match(/\d+/)?.[0];
  if (tableNumber) return `TABLE ${tableNumber}`;

  const fallback = tableName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .slice(0, 10);
  return fallback || "TABLE";
}

function getQrFileName(tableName: string): string {
  const safeName = tableName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `table-${safeName || "order"}-qr.png`;
}

function downloadOnWeb(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareOnWeb(
  dataUrl: string,
  fileName: string,
  title: string,
  unavailableMessage: string
): Promise<void> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(unavailableMessage);
  const blob = await response.blob();
  const file = new globalThis.File([blob], fileName, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }

  throw new Error(unavailableMessage);
}

async function runQrAction(
  action: () => Promise<void>,
  onSuccess: () => void,
  onError: (error: unknown) => void,
  onFinally: () => void
): Promise<void> {
  try {
    await action();
    onSuccess();
  } catch (error) {
    onError(error);
  } finally {
    onFinally();
  }
}

export default function TableQrOverlay({
  table,
  isOpen,
  onOpenChange,
}: TableQrOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [foregroundColor, mutedColor, accentForegroundColor] = useCSSVariable([
    "--color-foreground",
    "--color-muted-foreground",
    "--color-primary-foreground",
  ]) as [string, string, string];
  const [activeAction, setActiveAction] = React.useState<QrAction>(null);
  const qrRef = React.useRef<View>(null);
  const orderUrl = table ? getTableOrderUrl(table.id) : null;
  const tableNumberLabel = table ? getTableNumberLabel(table.name) : "TABLE";
  const isUnavailable = !orderUrl;
  const { isPhonePortrait, sheetRef, handleDidDismiss } = useAdaptiveOverlayPresentation(
    isOpen && !!table,
    onOpenChange
  );

  const getQrDataUrl = async (): Promise<string> => {
    if (!qrRef.current) throw new Error(t("areasManagement.tableQrNotReady"));
    const base64 = await captureRef(qrRef, {
      format: "png",
      result: "base64",
      width: QR_EXPORT_SIZE,
      height: QR_EXPORT_SIZE,
    });
    return `data:image/png;base64,${base64}`;
  };

  const writeQrFile = async (fileName: string): Promise<ExpoFile> => {
    const dataUrl = await getQrDataUrl();
    const file = new ExpoFile(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(dataUrl.slice(dataUrl.indexOf(",") + 1), { encoding: EncodingType.Base64 });
    return file;
  };

  const handleDownload = async () => {
    if (!table || !orderUrl) return;
    setActiveAction("download");
    const fileName = getQrFileName(table.name);
    await runQrAction(
      async () => {
        if (Platform.OS === "web") {
          downloadOnWeb(await getQrDataUrl(), fileName);
        } else {
          const permission = await requestPermissionsAsync(true, ["photo"]);
          if (!permission.granted) {
            return Promise.reject(new Error(t("areasManagement.tableQrPermissionDenied")));
          }
          const file = await writeQrFile(fileName);
          await Asset.create(file.uri);
        }
      },
      () =>
        toast.show({
          variant: "success",
          label: t(
            Platform.OS === "web"
              ? "areasManagement.tableQrDownloaded"
              : "areasManagement.tableQrSaved"
          ),
        }),
      (error) =>
        toast.show({
          variant: "destructive",
          label: t("areasManagement.tableQrSaveFailed"),
          description: error instanceof Error ? error.message : undefined,
        }),
      () => setActiveAction(null)
    );
  };

  const handleShare = async () => {
    if (!table || !orderUrl) return;
    setActiveAction("share");
    const fileName = getQrFileName(table.name);
    const title = t("areasManagement.tableQrTitle", { table: table.name });
    const unavailableMessage = t("areasManagement.tableQrShareUnavailable");
    await runQrAction(
      async () => {
        if (Platform.OS === "web") {
          await shareOnWeb(await getQrDataUrl(), fileName, title, unavailableMessage);
        } else {
          if (!(await Sharing.isAvailableAsync())) {
            return Promise.reject(new Error(unavailableMessage));
          }
          const file = await writeQrFile(fileName);
          await Sharing.shareAsync(file.uri, {
            dialogTitle: title,
            mimeType: "image/png",
            UTI: "public.png",
          });
        }
      },
      () => toast.show({ variant: "success", label: t("areasManagement.tableQrShared") }),
      (error) =>
        toast.show({
          variant: "destructive",
          label: t("areasManagement.tableQrShareFailed"),
          description: error instanceof Error ? error.message : undefined,
        }),
      () => setActiveAction(null)
    );
  };

  const handlePreview = async () => {
    if (!orderUrl) return;
    await Linking.openURL(orderUrl).catch((error: unknown) => {
      toast.show({
        variant: "destructive",
        label: t("areasManagement.tableQrPreviewFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    });
  };

  if (!table) return <></>;

  const footer = (
    <View className="flex-row items-center gap-3 px-5 pb-5 pt-4">
      <PanelButton
        variant="outline"
        className="flex-1"
        accessibilityLabel={t("areasManagement.tableQrShareAccessibility", {
          table: table.name,
        })}
        disabled={isUnavailable || activeAction !== null}
        onPress={handleShare}
      >
        <AppIcon icon={AppIcons.share} size={18} color={mutedColor} />
        {activeAction === "share"
          ? t("areasManagement.tableQrSharing")
          : t("areasManagement.tableQrShare")}
      </PanelButton>
      <PanelButton
        className="flex-1"
        accessibilityLabel={t("areasManagement.tableQrDownloadAccessibility", {
          table: table.name,
        })}
        disabled={isUnavailable || activeAction !== null}
        onPress={handleDownload}
      >
        <AppIcon icon={AppIcons.download} size={18} color={accentForegroundColor} />
        {activeAction === "download"
          ? t("areasManagement.tableQrDownloading")
          : t("areasManagement.tableQrDownload")}
      </PanelButton>
    </View>
  );
  const content = (
    <View className="px-5 gap-4">
      {orderUrl ? (
        <View
          className="rounded-3xl border border-border bg-white p-4"
          accessible
          accessibilityRole="image"
          accessibilityLabel={t("areasManagement.tableQrImageAccessibility", {
            table: table.name,
          })}
        >
          <View className="items-center gap-1">
            <View ref={qrRef} collapsable={false}>
              <QRCode value={orderUrl} size="lg" errorCorrection="H">
                <QRCode.Panel>
                  <QRCode.Canvas pixelSize={QR_CODE_SIZE} />
                  <QRCode.Logo>
                    <Image
                      source={SOEAT_LOGO}
                      style={{ width: QR_LOGO_SIZE, height: QR_LOGO_SIZE }}
                      contentFit="contain"
                    />
                  </QRCode.Logo>
                </QRCode.Panel>
              </QRCode>
            </View>
            <Typography type="h6" weight="bold" className="text-center text-black">
              {tableNumberLabel}
            </Typography>
          </View>
        </View>
      ) : (
        <View className="w-full rounded-2xl border border-destructive/30 bg-destructive-soft p-4">
          <Typography type="body-sm" className="text-destructive-foreground">
            {t("areasManagement.tableQrUnavailable")}
          </Typography>
        </View>
      )}
      <View className="gap-1">
        <Typography type="body-xs" muted>
          {t("areasManagement.tableQrOrderLink")}
        </Typography>
        <View className="flex-row justify-center items-center w-full rounded-lg bg-surface-secondary ">
          <View className="flex-1 py-2 px-3 overflow-hidden">
            <Typography type="body-sm" selectable className="text-foreground">
              {orderUrl ?? t("areasManagement.tableQrUnavailable")}
            </Typography>
          </View>
          <PanelButton
            variant="ghost"
            size="icon"
            accessibilityLabel={t("areasManagement.tableQrPreviewAccessibility", {
              table: table.name,
            })}
            disabled={isUnavailable || activeAction !== null}
            onPress={handlePreview}
          >
            <AppIcon icon={AppIcons.open} size={16} color={foregroundColor} />
          </PanelButton>
        </View>
      </View>
    </View>
  );
  const title = t("areasManagement.tableQrTitle", { table: table.name });
  const description = t("areasManagement.tableQrDescription");

  if (isPhonePortrait) {
    return (
      <TrueSheet
        ref={sheetRef}
        detents={[0.9]}
        scrollable
        cornerRadius={24}
        grabber
        dimmed
        onDidDismiss={handleDidDismiss}
        header={
          <View className="bg-surface gap-1.5 px-5 pb-4 pr-14 pt-5">
            <Typography type="h4" weight="semibold">
              {title}
            </Typography>
            <Typography type="body-sm" muted>
              {description}
            </Typography>
            <PanelButton
              variant="ghost"
              size="sm"
              accessibilityLabel={t("common.close")}
              className="absolute right-3 top-3"
              onPress={() => onOpenChange(false)}
            >
              {t("common.close")}
            </PanelButton>
          </View>
        }
        footer={<View className="bg-surface">{footer}</View>}
      >
        {content}
      </TrueSheet>
    );
  }

  return (
    <PanelDialog open={isOpen} onOpenChange={onOpenChange}>
      <PanelDialog.Content
        dismissible={false}
        className="w-full max-w-lg self-center overflow-hidden p-0"
      >
        <PanelButton
          variant="ghost"
          size="sm"
          accessibilityLabel={t("common.close")}
          className="absolute right-3 top-3 z-50"
          onPress={() => onOpenChange(false)}
        >
          {t("common.close")}
        </PanelButton>
        <View className="gap-1.5 px-5 pb-4 pr-14 pt-5">
          <PanelDialog.Title>{title}</PanelDialog.Title>
          <PanelDialog.Description>{description}</PanelDialog.Description>
        </View>
        {content}
        {footer}
      </PanelDialog.Content>
    </PanelDialog>
  );
}

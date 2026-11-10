import FormSheet from "@/components/common/form-sheet";
import FormDialog from "@/components/common/form-dialog";
import { Button, Typography, QRCode, useToast } from "panelui-native";
import { useCSSVariable } from "uniwind";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTranslation } from "@/stores/use-locale";
import { getTableOrderUrl } from "@/utils/table-order-url";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import React from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyledImage as Image } from "@/components/common/styled-image";
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
const SOEAT_LOGO = require("../../../../../assets/images/logo.svg");

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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [foregroundColor, mutedColor, accentForegroundColor, surfaceColor] = useCSSVariable([
    "--color-foreground",
    "--color-muted-foreground",
    "--color-primary-foreground",
    "--color-surface",
  ]) as [string, string, string, string];
  const [activeAction, setActiveAction] = React.useState<QrAction>(null);
  const qrRef = React.useRef<React.ComponentRef<typeof View>>(null);
  const orderUrl = table ? getTableOrderUrl(table.id) : null;
  const isUnavailable = !orderUrl;
  const { isPhonePortrait, sheetRef, handleDidDismiss } = useAdaptiveOverlayPresentation(
    isOpen && !!table,
    onOpenChange
  );
  const qrCodeSize = isPhonePortrait
    ? Math.min(QR_CODE_SIZE, Math.max(1, width - 104))
    : QR_CODE_SIZE;

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
    <View
      className="flex-row items-center gap-3 px-5 pt-4"
      style={{ paddingBottom: isPhonePortrait ? Math.max(insets.bottom, 20) : 20 }}
    >
      <Button
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
      </Button>
      <Button
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
      </Button>
    </View>
  );
  const content = (
    <View className="px-5 gap-4">
      {orderUrl ? (
        <View
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
                  <QRCode.Canvas pixelSize={qrCodeSize} />
                  <QRCode.Logo>
                    <Image source={SOEAT_LOGO} className="size-12" contentFit="contain" />
                  </QRCode.Logo>
                </QRCode.Panel>
              </QRCode>
            </View>
            <Typography type="h6" weight="bold" align="center">
              {table.name}
            </Typography>
          </View>
        </View>
      ) : (
        <View className="w-full rounded-2xl border border-destructive/30 bg-destructive-soft p-4">
          <Typography type="body-sm" className="text-destructive">
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
            <Typography type="body-sm" selectable>
              {orderUrl ?? t("areasManagement.tableQrUnavailable")}
            </Typography>
          </View>
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel={t("areasManagement.tableQrPreviewAccessibility", {
              table: table.name,
            })}
            disabled={isUnavailable || activeAction !== null}
            onPress={handlePreview}
          >
            <AppIcon icon={AppIcons.open} size={16} color={foregroundColor} />
          </Button>
        </View>
      </View>
    </View>
  );
  const title = t("areasManagement.tableQrTitle", { table: table.name });
  const description = t("areasManagement.tableQrDescription");

  if (isPhonePortrait) {
    return (
      <FormSheet
        sheetRef={sheetRef}
        detents={[0.9]}
        backgroundColor={surfaceColor}
        onDidDismiss={handleDidDismiss}
        onClose={() => onOpenChange(false)}
        title={title}
        description={description}
        footer={footer}
      >
        <ScrollView className="bg-surface" contentContainerClassName="pb-4">
          {content}
        </ScrollView>
      </FormSheet>
    );
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      wide
    >
      {content}
    </FormDialog>
  );
}

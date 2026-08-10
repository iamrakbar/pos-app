import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import AppIcon from "@/components/common/app-icon";
import { useTranslation } from "@/stores/use-locale";
import { getTableOrderUrl } from "@/utils/table-order-url";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Button, Typography, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { Platform, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type TableData = App.Data.Merchant.Area.TableData;
type QrAction = "download" | "share" | null;
type QrSvgRef = {
  toDataURL: (callback: (base64: string) => void, options?: object) => void;
};

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
  const [foregroundColor, mutedColor, accentForegroundColor] = useThemeColor([
    "foreground",
    "muted",
    "accent-foreground",
  ]);
  const [activeAction, setActiveAction] = React.useState<QrAction>(null);
  const qrRef = React.useRef<QrSvgRef | null>(null);
  const orderUrl = table ? getTableOrderUrl(table.id) : null;
  const tableNumberLabel = table ? getTableNumberLabel(table.name) : "TABLE";
  const isUnavailable = !orderUrl;

  const getQrDataUrl = async (): Promise<string> => {
    if (!qrRef.current) throw new Error(t("areasManagement.tableQrNotReady"));
    const base64 = await new Promise<string>((resolve) => {
      qrRef.current?.toDataURL(resolve, {
        width: QR_EXPORT_SIZE,
        height: QR_EXPORT_SIZE,
      });
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
          variant: "danger",
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
          variant: "danger",
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
        variant: "danger",
        label: t("areasManagement.tableQrPreviewFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    });
  };

  if (!table) return <></>;

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("areasManagement.tableQrTitle", { table: table.name })}
      description={t("areasManagement.tableQrDescription")}
      maxWidthClassName="max-w-lg"
      footer={
        <View className="flex-row items-center gap-3 px-5 pb-5 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            accessibilityLabel={t("areasManagement.tableQrShareAccessibility", {
              table: table.name,
            })}
            isDisabled={isUnavailable || activeAction !== null}
            onPress={handleShare}
          >
            <AppIcon name="share-outline" size={18} color={mutedColor} />
            <Button.Label>
              {activeAction === "share"
                ? t("areasManagement.tableQrSharing")
                : t("areasManagement.tableQrShare")}
            </Button.Label>
          </Button>
          <Button
            className="flex-1"
            accessibilityLabel={t("areasManagement.tableQrDownloadAccessibility", {
              table: table.name,
            })}
            isDisabled={isUnavailable || activeAction !== null}
            onPress={handleDownload}
          >
            <AppIcon name="download-outline" size={18} color={accentForegroundColor} />
            <Button.Label>
              {activeAction === "download"
                ? t("areasManagement.tableQrDownloading")
                : t("areasManagement.tableQrDownload")}
            </Button.Label>
          </Button>
        </View>
      }
    >
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
              <QRCode
                value={orderUrl}
                size={QR_CODE_SIZE}
                quietZone={12}
                backgroundColor="#ffffff"
                color="#000000"
                ecl="H"
                logoSVG={SOEAT_LOGO}
                logoSize={QR_LOGO_SIZE}
                logoMargin={6}
                logoBackgroundColor="#ffffff"
                logoBorderRadius={12}
                getRef={(ref) => {
                  qrRef.current = ref as QrSvgRef | null;
                }}
              />
              <Typography type="h6" weight="bold" className="text-center text-black">
                {tableNumberLabel}
              </Typography>
            </View>
          </View>
        ) : (
          <View className="w-full rounded-panel border border-danger/30 bg-danger-soft p-4">
            <Typography type="body-sm" className="text-danger">
              {t("areasManagement.tableQrUnavailable")}
            </Typography>
          </View>
        )}
        <View className="gap-1">
          <Typography type="body-xs" color="muted">
            {t("areasManagement.tableQrOrderLink")}
          </Typography>
          <View className="flex-row justify-center items-center w-full rounded-lg bg-surface-secondary ">
            <View className="flex-1 py-2 px-3 overflow-hidden">
              <Typography type="body-sm" selectable className="text-foreground">
                {orderUrl ?? t("areasManagement.tableQrUnavailable")}
              </Typography>
            </View>
            <Button
              variant="ghost"
              isIconOnly
              accessibilityLabel={t("areasManagement.tableQrPreviewAccessibility", {
                table: table.name,
              })}
              isDisabled={isUnavailable || activeAction !== null}
              onPress={handlePreview}
            >
              <AppIcon name="open-outline" size={16} color={foregroundColor} />
            </Button>
          </View>
        </View>
      </View>
    </AdaptiveFormOverlay>
  );
}

import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import AppIcon from "@/components/common/app-icon";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useTranslation } from "@/stores/use-locale";
import { getTableOrderUrl } from "@/utils/table-order-url";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Button, Chip, Separator, Typography, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { Platform, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type TableData = App.Data.Merchant.Area.TableData;
type QrAction = "download" | "share" | null;
type QrSvgRef = {
  toDataURL: (callback: (base64: string) => void, options?: object) => void;
};

type TableQrOverlayProps = {
  table: TableData | null;
  areaName?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const QR_EXPORT_SIZE = 1024;

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
  const blob = await response.blob();
  const file = new globalThis.File([blob], fileName, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }

  throw new Error(unavailableMessage);
}

export default function TableQrOverlay({
  table,
  areaName,
  isOpen,
  onOpenChange,
}: TableQrOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isPhonePortrait } = useOverlayPresentation();
  const [mutedColor, accentForegroundColor] = useThemeColor(["muted", "accent-foreground"]);
  const [activeAction, setActiveAction] = React.useState<QrAction>(null);
  const qrRef = React.useRef<QrSvgRef | null>(null);
  const orderUrl = table ? getTableOrderUrl(table.id) : null;
  const isUnavailable = !orderUrl;

  const getQrDataUrl = React.useCallback(async (): Promise<string> => {
    if (!qrRef.current) throw new Error(t("areasManagement.tableQrNotReady"));
    const base64 = await new Promise<string>((resolve) => {
      qrRef.current?.toDataURL(resolve, {
        width: QR_EXPORT_SIZE,
        height: QR_EXPORT_SIZE,
      });
    });
    return `data:image/png;base64,${base64}`;
  }, [t]);

  const writeQrFile = React.useCallback(
    async (fileName: string): Promise<ExpoFile> => {
      const dataUrl = await getQrDataUrl();
      const file = new ExpoFile(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(dataUrl.slice(dataUrl.indexOf(",") + 1), { encoding: EncodingType.Base64 });
      return file;
    },
    [getQrDataUrl]
  );

  const handleDownload = async () => {
    if (!table || !orderUrl) return;
    setActiveAction("download");
    try {
      const fileName = getQrFileName(table.name);
      if (Platform.OS === "web") {
        downloadOnWeb(await getQrDataUrl(), fileName);
      } else {
        const permission = await requestPermissionsAsync(true, ["photo"]);
        if (!permission.granted) {
          throw new Error(t("areasManagement.tableQrPermissionDenied"));
        }
        const file = await writeQrFile(fileName);
        await Asset.create(file.uri);
      }
      toast.show({
        variant: "success",
        label: t(
          Platform.OS === "web"
            ? "areasManagement.tableQrDownloaded"
            : "areasManagement.tableQrSaved"
        ),
      });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("areasManagement.tableQrSaveFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleShare = async () => {
    if (!table || !orderUrl) return;
    setActiveAction("share");
    try {
      const fileName = getQrFileName(table.name);
      const title = t("areasManagement.tableQrTitle", { table: table.name });
      if (Platform.OS === "web") {
        await shareOnWeb(
          await getQrDataUrl(),
          fileName,
          title,
          t("areasManagement.tableQrShareUnavailable")
        );
      } else {
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error(t("areasManagement.tableQrShareUnavailable"));
        }
        const file = await writeQrFile(fileName);
        await Sharing.shareAsync(file.uri, {
          dialogTitle: title,
          mimeType: "image/png",
          UTI: "public.png",
        });
      }
      toast.show({ variant: "success", label: t("areasManagement.tableQrShared") });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("areasManagement.tableQrShareFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handlePreview = async () => {
    if (!orderUrl) return;
    try {
      await Linking.openURL(orderUrl);
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("areasManagement.tableQrPreviewFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  if (!table) return <></>;

  const seats = t(table.pax === 1 ? "areasManagement.seatOne" : "areasManagement.seatOther", {
    count: table.pax,
  });
  const status = table.active ? t("common.active") : t("common.inactive");

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("areasManagement.tableQrTitle", { table: table.name })}
      description={t("areasManagement.tableQrDescription")}
      maxWidthClassName="max-w-lg"
      footer={
        <View
          className={`gap-3 px-5 pb-5 pt-4 ${
            isPhonePortrait ? "items-stretch" : "flex-row items-center"
          }`}
        >
          <Button
            variant="outline"
            className="flex-1"
            accessibilityLabel={t("areasManagement.tableQrDownloadAccessibility", {
              table: table.name,
            })}
            isDisabled={isUnavailable || activeAction !== null}
            onPress={handleDownload}
          >
            <AppIcon name="download-outline" size={18} color={mutedColor} />
            <Button.Label>
              {activeAction === "download"
                ? t("areasManagement.tableQrDownloading")
                : t("areasManagement.tableQrDownload")}
            </Button.Label>
          </Button>
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
            accessibilityLabel={t("areasManagement.tableQrPreviewAccessibility", {
              table: table.name,
            })}
            isDisabled={isUnavailable || activeAction !== null}
            onPress={handlePreview}
          >
            <AppIcon name="open-outline" size={18} color={accentForegroundColor} />
            <Button.Label>{t("areasManagement.tableQrPreview")}</Button.Label>
          </Button>
        </View>
      }
    >
      <Separator />
      <ScrollView
        className={isPhonePortrait ? "min-h-0 flex-1" : "min-h-0"}
        contentContainerClassName="items-center gap-5 px-5 py-5"
        showsVerticalScrollIndicator={false}
      >
        {orderUrl ? (
          <View
            className="rounded-3xl border border-border bg-white p-4"
            accessible
            accessibilityRole="image"
            accessibilityLabel={t("areasManagement.tableQrImageAccessibility", {
              table: table.name,
            })}
          >
            <QRCode
              value={orderUrl}
              size={240}
              quietZone={12}
              backgroundColor="#ffffff"
              color="#000000"
              ecl="H"
              getRef={(ref) => {
                qrRef.current = ref as QrSvgRef | null;
              }}
            />
          </View>
        ) : (
          <View className="w-full rounded-panel border border-danger/30 bg-danger-soft p-4">
            <Typography type="body-sm" className="text-danger">
              {t("areasManagement.tableQrUnavailable")}
            </Typography>
          </View>
        )}

        <View className="w-full gap-4 rounded-panel bg-surface-secondary p-4">
          <View className="flex-row flex-wrap items-center gap-2">
            {areaName ? (
              <Chip size="sm" variant="soft">
                <Chip.Label>{areaName}</Chip.Label>
              </Chip>
            ) : null}
            <Chip size="sm" variant="soft">
              <Chip.Label>{seats}</Chip.Label>
            </Chip>
            <Chip size="sm" color={table.active ? "success" : "default"} variant="soft">
              <Chip.Label>{status}</Chip.Label>
            </Chip>
          </View>
          <View className="gap-1">
            <Typography type="body-xs" color="muted">
              {t("areasManagement.tableQrDestination")}
            </Typography>
            <Typography type="body-sm" weight="semibold">
              {t("areasManagement.tableQrDestinationValue")}
            </Typography>
          </View>
          <View className="gap-1">
            <Typography type="body-xs" color="muted">
              {t("areasManagement.tableQrOrderLink")}
            </Typography>
            <Typography type="body-xs" selectable className="text-foreground">
              {orderUrl ?? t("areasManagement.tableQrUnavailable")}
            </Typography>
          </View>
        </View>
      </ScrollView>
    </AdaptiveFormOverlay>
  );
}

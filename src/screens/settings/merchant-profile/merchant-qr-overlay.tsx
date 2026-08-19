import { getErrorMessage } from "@/api/api-error";
import AdaptiveFormOverlay from "@/components/common/adaptive-form-overlay";
import AppIcon from "@/components/common/app-icon";
import type { Translate } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { getMerchantOrderUrl } from "@/utils/merchant-order-url";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { Button, Typography, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { Platform, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type QrSvgRef = { toDataURL: (callback: (base64: string) => void, options?: object) => void };

type MerchantQrOverlayProps = {
  slug: string | null | undefined;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const QR_EXPORT_SIZE = 1024;
const QR_CODE_SIZE = 220;
const SOEAT_LOGO = require("../../../../assets/images/logo.svg");

async function downloadMerchantQr({
  slug,
  t,
  toast,
  getQrDataUrl,
}: {
  slug: string | null | undefined;
  t: Translate;
  toast: ReturnType<typeof useToast>["toast"];
  getQrDataUrl: () => Promise<string>;
}): Promise<void> {
  try {
    const dataUrl = await getQrDataUrl();
    const fileName = `merchant-${slug ?? "profile"}-qr.png`;
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      const permission = await requestPermissionsAsync(true, ["photo"]);
      if (!permission.granted) throw new Error(t("merchantProfile.permissionDenied"));
      const file = new ExpoFile(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(dataUrl.slice(dataUrl.indexOf(",") + 1), { encoding: EncodingType.Base64 });
      await Asset.create(file.uri);
    }
    toast.show({
      variant: "success",
      label: t(Platform.OS === "web" ? "merchantProfile.downloaded" : "merchantProfile.saved"),
    });
  } catch (error) {
    toast.show({
      variant: "danger",
      label: t("merchantProfile.saveFailed"),
      description: getErrorMessage(error),
    });
  }
}

export default function MerchantQrOverlay({
  slug,
  isOpen,
  onOpenChange,
}: MerchantQrOverlayProps): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [foregroundColor] = useThemeColor(["foreground"]);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const qrRef = React.useRef<QrSvgRef | null>(null);
  const orderUrl = getMerchantOrderUrl(slug);
  const isUnavailable = !orderUrl;

  const getQrDataUrl = async (): Promise<string> => {
    if (!qrRef.current) throw new Error(t("merchantProfile.notReady"));
    const base64 = await new Promise<string>((resolve) => {
      qrRef.current?.toDataURL(resolve, { width: QR_EXPORT_SIZE, height: QR_EXPORT_SIZE });
    });
    return `data:image/png;base64,${base64}`;
  };

  const handleDownload = async () => {
    if (!orderUrl) return;
    setIsDownloading(true);
    await downloadMerchantQr({ slug, t, toast, getQrDataUrl }).finally(() =>
      setIsDownloading(false)
    );
  };

  const handlePreview = async () => {
    if (!orderUrl) return;
    await Linking.openURL(orderUrl).catch((error: unknown) => {
      toast.show({
        variant: "danger",
        label: t("merchantProfile.previewFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    });
  };

  return (
    <AdaptiveFormOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("merchantProfile.qrTitle")}
      maxWidthClassName="max-w-sm"
      footer={
        <View className="px-5 pb-5 pt-4">
          <Button
            className="w-full"
            isDisabled={isUnavailable || isDownloading}
            onPress={handleDownload}
          >
            <AppIcon name="download-outline" size={18} color={foregroundColor} />
            <Button.Label>
              {isDownloading ? t("merchantProfile.downloading") : t("merchantProfile.download")}
            </Button.Label>
          </Button>
        </View>
      }
    >
      <View className="gap-4 px-5">
        {orderUrl ? (
          <View className="items-center self-center rounded-3xl border border-border bg-white p-4">
            <QRCode
              value={orderUrl}
              size={QR_CODE_SIZE}
              quietZone={10}
              backgroundColor="#ffffff"
              color="#000000"
              ecl="H"
              logoSVG={SOEAT_LOGO}
              logoSize={44}
              logoMargin={6}
              logoBackgroundColor="#ffffff"
              logoBorderRadius={10}
              getRef={(ref) => {
                qrRef.current = ref as QrSvgRef | null;
              }}
            />
          </View>
        ) : (
          <View className="w-full rounded-panel border border-danger/30 bg-danger-soft p-4">
            <Typography type="body-sm" className="text-danger">
              {t("merchantProfile.urlUnavailable")}
            </Typography>
          </View>
        )}
        <View className="w-full gap-1">
          <Typography type="body-xs" color="muted">
            {t("merchantProfile.orderUrl")}
          </Typography>
          <View className="w-full flex-row items-center rounded-lg bg-surface-secondary">
            <View className="flex-1 overflow-hidden px-3 py-2">
              <Typography type="body-sm" selectable numberOfLines={1}>
                {orderUrl ?? t("merchantProfile.urlUnavailable")}
              </Typography>
            </View>
            <Button
              variant="ghost"
              isIconOnly
              isDisabled={isUnavailable}
              onPress={handlePreview}
              accessibilityLabel={t("merchantProfile.orderUrl")}
            >
              <AppIcon name="open-outline" size={16} color={foregroundColor} />
            </Button>
          </View>
        </View>
      </View>
    </AdaptiveFormOverlay>
  );
}

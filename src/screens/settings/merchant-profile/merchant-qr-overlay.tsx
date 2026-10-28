import {
  Button as PanelButton,
  Dialog as PanelDialog,
  Typography,
  QRCode,
  useToast,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage } from "@/api/api-error";
import { useAdaptiveOverlayPresentation } from "@/hooks/use-adaptive-overlay-presentation";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import type { Translate } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { getMerchantOrderUrl } from "@/utils/merchant-order-url";
import { EncodingType, File as ExpoFile, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import React from "react";
import { Platform, View } from "react-native";
import { Image } from "expo-image";
import { captureRef } from "react-native-view-shot";

type MerchantQrOverlayProps = {
  slug: string | null | undefined;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const QR_EXPORT_SIZE = 1024;
const QR_CODE_SIZE = 240;
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
      variant: "destructive",
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
  const [foregroundColor, primaryForegroundColor] = useCSSVariable([
    "--color-foreground",
    "--color-primary-foreground",
  ]) as [string, string];
  const [isDownloading, setIsDownloading] = React.useState(false);
  const qrRef = React.useRef<View>(null);
  const orderUrl = getMerchantOrderUrl(slug);
  const isUnavailable = !orderUrl;
  const { isPhonePortrait, sheetRef, handleDidDismiss } = useAdaptiveOverlayPresentation(
    isOpen,
    onOpenChange
  );

  const getQrDataUrl = async (): Promise<string> => {
    if (!qrRef.current) throw new Error(t("merchantProfile.notReady"));
    const base64 = await captureRef(qrRef, {
      format: "png",
      result: "base64",
      width: QR_EXPORT_SIZE,
      height: QR_EXPORT_SIZE,
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
        variant: "destructive",
        label: t("merchantProfile.previewFailed"),
        description: error instanceof Error ? error.message : undefined,
      });
    });
  };

  const footer = (
    <View className="px-5 pb-5 pt-4">
      <PanelButton
        className="w-full"
        disabled={isUnavailable || isDownloading}
        onPress={handleDownload}
        startContent={<AppIcon icon={AppIcons.download} size={18} color={primaryForegroundColor} />}
      >
        {isDownloading ? t("merchantProfile.downloading") : t("merchantProfile.download")}
      </PanelButton>
    </View>
  );
  const content = (
    <View className="gap-4 px-5">
      {orderUrl ? (
        <View className="items-center self-center rounded-3xl border border-border bg-white p-4">
          <View ref={qrRef} collapsable={false}>
            <QRCode value={orderUrl} size="lg" errorCorrection="H">
              <QRCode.Panel>
                <QRCode.Canvas pixelSize={QR_CODE_SIZE} />
                <QRCode.Logo>
                  <Image
                    source={SOEAT_LOGO}
                    style={{ width: 44, height: 44 }}
                    contentFit="contain"
                  />
                </QRCode.Logo>
              </QRCode.Panel>
            </QRCode>
          </View>
        </View>
      ) : (
        <View className="w-full rounded-2xl border border-destructive/30 bg-destructive-soft p-4">
          <Typography type="body-sm" className="text-destructive-foreground">
            {t("merchantProfile.urlUnavailable")}
          </Typography>
        </View>
      )}
      <View className="w-full gap-1">
        <Typography type="body-xs" muted>
          {t("merchantProfile.orderUrl")}
        </Typography>
        <View className="w-full flex-row items-center rounded-lg bg-surface-secondary">
          <View className="flex-1 overflow-hidden px-3 py-2">
            <Typography type="body-sm" selectable numberOfLines={1}>
              {orderUrl ?? t("merchantProfile.urlUnavailable")}
            </Typography>
          </View>
          <PanelButton
            variant="ghost"
            size="icon"
            disabled={isUnavailable}
            onPress={handlePreview}
            accessibilityLabel={t("merchantProfile.orderUrl")}
          >
            <AppIcon icon={AppIcons.open} size={16} color={foregroundColor} />
          </PanelButton>
        </View>
      </View>
    </View>
  );

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
          <View className="bg-surface px-5 pb-4 pr-14 pt-5">
            <Typography type="h4" weight="semibold">
              {t("merchantProfile.qrTitle")}
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
        className="w-full max-w-sm self-center overflow-hidden p-0"
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
        <View className="px-5 pb-4 pr-14 pt-5">
          <PanelDialog.Title>{t("merchantProfile.qrTitle")}</PanelDialog.Title>
        </View>
        {content}
        {footer}
      </PanelDialog.Content>
    </PanelDialog>
  );
}

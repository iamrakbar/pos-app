import { ReceiptPaper, type ReceiptPreviewData } from "@/components/receipt/receipt-paper";
import { useAuth } from "@/stores/use-auth";
import { useMerchantProfile } from "@/hooks/db/use-merchant-profile";
import { useReceiptStore, type ReceiptSettings } from "@/stores/use-receipt-store";
import { usePrinterStore, type PaperWidth } from "@/stores/use-printer-store";
import { optimizeReceiptLogo } from "@/utils/receipt-logo";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Button,
  Input,
  ScrollShadow,
  Select,
  Separator,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React, { useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SplitView } from "heroui-native-pro";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useTranslation } from "@/stores/use-locale";
import type { Translate, TranslationKey } from "@/locales";

function getSampleReceipt(t: Translate): ReceiptPreviewData {
  return {
    code: "ORD-2026-0142",
    date: "17 Jul 2026, 14:32",
    orderType: t("receiptSettings.sampleDineIn"),
    table: "A-04",
    payment: "QRIS",
    paymentStatus: t("receiptSettings.samplePaid"),
    items: [
      {
        id: "sample-1",
        name: t("receiptSettings.sampleLatte"),
        qty: 2,
        price: 28000,
        originalPrice: 31000,
        discountLabel: t("receiptSettings.sampleDiscount"),
        discountAmount: 6000,
        subtotal: 62000,
        addOns: [
          {
            id: "sample-addon-1",
            group: t("receiptSettings.sampleMilk"),
            name: t("receiptSettings.sampleOatMilk"),
            price: 3000,
          },
        ],
      },
      {
        id: "sample-2",
        name: t("receiptSettings.sampleCroissant"),
        qty: 1,
        price: 24000,
        originalPrice: null,
        discountLabel: null,
        discountAmount: 0,
        subtotal: 24000,
        addOns: [],
      },
    ],
    subtotal: 86000,
    discounts: [{ id: "promo", name: t("receiptSettings.sampleDiscount"), amount: 5000 }],
    fees: [{ id: "service", name: t("receiptSettings.sampleService"), amount: 4300 }],
    tax: { name: "PB1 (10%)", amount: 8600 },
    total: 93900,
  };
}

const RECEIPT_LAYOUTS = [
  { value: "standard", key: "receiptSettings.standard" },
  { value: "compact", key: "receiptSettings.compact" },
  { value: "customer", key: "receiptSettings.customer" },
  { value: "kitchen", key: "receiptSettings.kitchen" },
] as const;

const PAPER_WIDTHS: PaperWidth[] = ["58mm", "80mm"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getMerchantHeader(merchant: unknown): string {
  const record = asRecord(merchant);
  const address = asRecord(record?.address);
  const addressLine = [
    address?.address,
    address?.district,
    address?.city,
    address?.province,
    address?.postcode,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(", ");
  const phone = typeof record?.phone === "string" ? record.phone : "";
  return [addressLine, phone].filter(Boolean).join("\n");
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography type="body-sm" weight="semibold" className="mb-1.5">
      {children}
    </Typography>
  );
}

function PrinterSetupButton({ color, onPress }: { color: string; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Button className="w-full" variant="outline" onPress={onPress}>
      <Ionicons name="print-outline" size={18} color={color} />
      <Button.Label>{t("receiptSettings.setupPrinter")}</Button.Label>
    </Button>
  );
}

function ReceiptPreviewSection({
  settings,
  previewPaperWidth,
  onPaperWidthChange,
  configuredPaperWidth,
  configuredCharactersPerLine,
  configuredLogoWidthDots,
  surfaceColor,
}: {
  settings: ReceiptSettings;
  previewPaperWidth: PaperWidth;
  onPaperWidthChange: (paperWidth: PaperWidth) => void;
  configuredPaperWidth: PaperWidth;
  configuredCharactersPerLine: string;
  configuredLogoWidthDots: string;
  surfaceColor: string;
}) {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();

  return (
    <View className="min-h-0 flex-1">
      <ScrollShadow
        className="flex-1 bg-surface-secondary"
        color={surfaceColor}
        orientation="vertical"
        LinearGradientComponent={LinearGradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between gap-3 p-4">
            <Typography className="text-sm font-semibold text-foreground">
              {t("receiptSettings.preview")}
            </Typography>
            <Select
              presentation={choicePresentation}
              value={{ value: previewPaperWidth, label: previewPaperWidth }}
              onValueChange={(option) => {
                if (option?.value) onPaperWidthChange(option.value as PaperWidth);
              }}
            >
              <Select.Trigger className="w-32">
                <Select.Value placeholder={t("receiptSettings.paperSize")} numberOfLines={1} />
                <Select.TriggerIndicator />
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content
                  presentation={choicePresentation}
                  width={choicePresentation === "popover" ? "trigger" : undefined}
                >
                  <Select.ListLabel className="mb-2">
                    {t("receiptSettings.previewSize")}
                  </Select.ListLabel>
                  {PAPER_WIDTHS.map((paperWidth, index) => (
                    <React.Fragment key={paperWidth}>
                      <Select.Item value={paperWidth} label={paperWidth} />
                      {index < PAPER_WIDTHS.length - 1 ? <Separator /> : null}
                    </React.Fragment>
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>
          </View>
          <ReceiptPaper
            settings={settings}
            data={getSampleReceipt(t)}
            paperWidth={previewPaperWidth}
            charactersPerLine={
              previewPaperWidth === configuredPaperWidth
                ? configuredCharactersPerLine
                : previewPaperWidth === "80mm"
                  ? "46"
                  : "32"
            }
            logoWidthDots={
              previewPaperWidth === configuredPaperWidth ? configuredLogoWidthDots : undefined
            }
          />
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}

function ReceiptSetupLayout({
  isPortrait,
  children,
}: React.PropsWithChildren<{ isPortrait: boolean }>) {
  const { t } = useTranslation();
  const [preview, form] = React.Children.toArray(children);

  if (!isPortrait) {
    return (
      <View className="min-h-0 flex-1 flex-row items-stretch">
        <View className="min-h-0 flex-1">{preview}</View>
        <View className="min-h-0 w-1/2 min-w-80">{form}</View>
      </View>
    );
  }

  return (
    <SplitView
      snapPoints={[0.32, 0.42, 0.52]}
      defaultSnapIndex={1}
      minHeight={0.28}
      maxHeight={0.58}
    >
      <SplitView.TopSection className="min-h-0">{preview}</SplitView.TopSection>
      <SplitView.DragArea accessibilityLabel={t("receiptSettings.resizePreview")}>
        <SplitView.DragHandle />
      </SplitView.DragArea>
      <SplitView.BottomSection className="min-h-0">{form}</SplitView.BottomSection>
    </SplitView>
  );
}

export default function ReceiptSetupScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const merchantProfile = useMerchantProfile();
  const settings = useReceiptStore((state) => state.settings);
  const updateSettings = useReceiptStore((state) => state.updateSettings);
  const configuredPaperWidth = usePrinterStore((state) => state.settings.paperWidth);
  const configuredCharactersPerLine = usePrinterStore((state) => state.settings.charactersPerLine);
  const configuredLogoWidthDots = usePrinterStore((state) => state.settings.logoWidthDots);
  const { isPortrait } = useResponsiveLayout();
  const { choicePresentation } = useOverlayPresentation();
  const [themeColorMuted, themeColorForeground, themeColorSurfaceSecondary] = useThemeColor([
    "muted",
    "foreground",
    "surface-secondary",
  ]);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [previewPaperWidth, setPreviewPaperWidth] = useState<PaperWidth>(configuredPaperWidth);
  const receiptLayouts = RECEIPT_LAYOUTS.map((item) => ({
    value: item.value,
    label: t(item.key as TranslationKey),
  }));

  useEffect(() => {
    const merchantDefaults = {
      id: activeMerchant?.id ?? null,
      name: merchantProfile.data?.name ?? activeMerchant?.name ?? "",
      logo: merchantProfile.data?.logo_url ?? activeMerchant?.logo_url ?? null,
    };
    if (!merchantDefaults.id || settings.initializedMerchantId === merchantDefaults.id) return;

    const shouldOptimizeMerchantLogo = !settings.storeLogo && !!merchantDefaults.logo;
    updateSettings({
      initializedMerchantId: merchantDefaults.id,
      storeName: settings.storeName || merchantDefaults.name,
      storeLogo: settings.storeLogo || merchantDefaults.logo,
      footer: settings.footer || t("receiptSettings.footerPlaceholder"),
    });

    if (shouldOptimizeMerchantLogo && merchantDefaults.logo) {
      optimizeReceiptLogo(merchantDefaults.logo)
        .then((storeLogo) => {
          if (useReceiptStore.getState().settings.storeLogo === merchantDefaults.logo) {
            updateSettings({ storeLogo });
          }
        })
        .catch(() => undefined);
    }
  }, [activeMerchant, merchantProfile.data, settings, t, updateSettings]);

  useEffect(() => {
    const merchantId = merchantProfile.data?.id;
    if (!merchantId || settings.headerInitializedMerchantId === merchantId) return;

    updateSettings({
      header: settings.header || getMerchantHeader(merchantProfile.data),
      headerInitializedMerchantId: merchantId,
    });
  }, [merchantProfile.data, settings.header, settings.headerInitializedMerchantId, updateSettings]);

  const handleSelectLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show({
        variant: "warning",
        label: t("receiptSettings.photoPermission"),
        description: t("receiptSettings.photoPermissionDescription"),
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    });
    if (result.canceled) return;

    setIsProcessingLogo(true);
    await optimizeReceiptLogo(result.assets[0].uri)
      .then(
        (storeLogo) => {
          updateSettings({ storeLogo });
          toast.show({ variant: "success", label: t("receiptSettings.logoUpdated") });
        },
        (error: unknown) => {
          toast.show({
            variant: "danger",
            label: t("receiptSettings.logoFailed"),
            description:
              error instanceof Error ? error.message : t("receiptSettings.logoFailedDescription"),
          });
        }
      )
      .finally(() => {
        setIsProcessingLogo(false);
      });
  };

  return (
    <>
      <View className="flex-1 bg-background">
        <View className="min-h-0 w-full flex-1 self-center">
          <ReceiptSetupLayout isPortrait={isPortrait}>
            <ReceiptPreviewSection
              settings={settings}
              previewPaperWidth={previewPaperWidth}
              onPaperWidthChange={setPreviewPaperWidth}
              configuredPaperWidth={configuredPaperWidth}
              configuredCharactersPerLine={configuredCharactersPerLine}
              configuredLogoWidthDots={configuredLogoWidthDots}
              surfaceColor={themeColorSurfaceSecondary}
            />

            <View className="min-h-0 flex-1 bg-surface overflow-hidden p-0">
              <KeyboardAwareScrollView
                className="flex-1"
                contentContainerClassName="px-5 pt-5"
                bottomOffset={88}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-1">
                  <Typography className="text-lg font-semibold text-foreground">
                    {t("receiptSettings.details")}
                  </Typography>
                  <Typography type="body-sm" color="muted">
                    {t("receiptSettings.detailsDescription")}
                  </Typography>
                </View>
                <View className="gap-5">
                  <View>
                    <FieldLabel>{t("receiptSettings.layout")}</FieldLabel>
                    <Select
                      presentation={choicePresentation}
                      value={receiptLayouts.find((item) => item.value === settings.layout)}
                      onValueChange={(option) => {
                        if (option) {
                          updateSettings({
                            layout: option.value as "standard" | "compact" | "customer" | "kitchen",
                          });
                        }
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder={t("receiptSettings.selectLayout")} />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content
                          presentation={choicePresentation}
                          width={choicePresentation === "popover" ? "trigger" : undefined}
                        >
                          {receiptLayouts.map((item) => (
                            <Select.Item key={item.value} value={item.value} label={item.label} />
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  </View>
                  <View>
                    <FieldLabel>{t("receiptSettings.storeLogo")}</FieldLabel>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("receiptSettings.changeLogoAccessibility")}
                      onPress={handleSelectLogo}
                      disabled={isProcessingLogo}
                      className="h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-secondary active:opacity-70"
                    >
                      {isProcessingLogo ? (
                        <View className="items-center gap-2">
                          <ActivityIndicator />
                          <Typography type="body-xs" color="muted">
                            {t("receiptSettings.optimizingLogo")}
                          </Typography>
                        </View>
                      ) : settings.storeLogo ? (
                        <>
                          <Image
                            source={{ uri: settings.storeLogo }}
                            style={{ width: 160, height: 80 }}
                            contentFit="contain"
                          />
                          <View className="absolute right-2 bottom-2 rounded-full bg-black/60 p-2">
                            <Ionicons name="camera" size={15} color="white" />
                          </View>
                        </>
                      ) : (
                        <View className="items-center gap-1.5">
                          <Ionicons name="image-outline" size={26} color={themeColorMuted} />
                          <Typography type="body-xs" color="muted">
                            {t("receiptSettings.chooseImage")}
                          </Typography>
                        </View>
                      )}
                    </Pressable>
                    <Typography type="body-xs" color="muted" className="mt-1.5">
                      {t("receiptSettings.logoDescription")}
                    </Typography>
                  </View>

                  <View>
                    <FieldLabel>{t("receiptSettings.storeName")}</FieldLabel>
                    <Input
                      value={settings.storeName}
                      onChangeText={(storeName) => updateSettings({ storeName })}
                      placeholder={t("receiptSettings.storeName")}
                      variant="secondary"
                    />
                  </View>

                  <View>
                    <FieldLabel>{t("receiptSettings.header")}</FieldLabel>
                    <Input
                      value={settings.header}
                      onChangeText={(header) => updateSettings({ header })}
                      placeholder={t("receiptSettings.headerPlaceholder")}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      variant="secondary"
                      className="min-h-24 py-3"
                    />
                  </View>

                  <View>
                    <FieldLabel>{t("receiptSettings.footer")}</FieldLabel>
                    <Input
                      value={settings.footer}
                      onChangeText={(footer) => updateSettings({ footer })}
                      placeholder={t("receiptSettings.footerPlaceholder")}
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      variant="secondary"
                      className="min-h-20 py-3"
                    />
                  </View>

                  <PrinterSetupButton
                    color={themeColorForeground}
                    onPress={() => router.push("/settings/printers")}
                  />
                </View>
              </KeyboardAwareScrollView>
              <View className="bg-surface px-5 py-4 pb-safe">
                <Button className="w-full" onPress={() => router.back()}>
                  <Button.Label>{t("common.done")}</Button.Label>
                </Button>
              </View>
            </View>
          </ReceiptSetupLayout>
        </View>
      </View>
    </>
  );
}

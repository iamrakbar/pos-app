import { ReceiptPaper, type ReceiptPreviewData } from "@/components/receipt/ReceiptPaper";
import { useAuth } from "@/stores/useAuth";
import { useMerchantProfile } from "@/hooks/db/useMerchantProfile";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { usePrinterStore, type PaperWidth } from "@/stores/usePrinterStore";
import { optimizeReceiptLogo } from "@/utils/receiptLogo";
import { getToolbarIcon } from "@/utils/toolbarIcons";
import { useNavigationTheme } from "@/utils/navigationTheme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import {
  Button,
  Input,
  Select,
  Separator,
  Surface,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

const SAMPLE_RECEIPT: ReceiptPreviewData = {
  code: "ORD-2026-0142",
  date: "17 Jul 2026, 14:32",
  orderType: "Dine-in",
  table: "A-04",
  payment: "QRIS",
  paymentStatus: "Paid",
  items: [
    {
      id: "sample-1",
      name: "Cafe Latte",
      qty: 2,
      price: 28000,
      originalPrice: 31000,
      discountLabel: "Discount",
      discountAmount: 6000,
      subtotal: 62000,
      addOns: [{ id: "sample-addon-1", group: "Milk", name: "Oat milk", price: 3000 }],
    },
    {
      id: "sample-2",
      name: "Butter Croissant",
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
  discounts: [{ id: "promo", name: "Discount", amount: 5000 }],
  fees: [{ id: "service", name: "Service", amount: 4300 }],
  tax: { name: "PB1 (10%)", amount: 8600 },
  total: 93900,
};

const RECEIPT_LAYOUTS = [
  { value: "standard", label: "Standard" },
  { value: "compact", label: "Compact" },
  { value: "customer", label: "Customer" },
  { value: "kitchen", label: "Kitchen" },
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

export default function ReceiptSetupScreen(): React.JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const activeMerchant = useAuth((state) => state.activeMerchant);
  const merchantProfile = useMerchantProfile();
  const settings = useReceiptStore((state) => state.settings);
  const updateSettings = useReceiptStore((state) => state.updateSettings);
  const configuredPaperWidth = usePrinterStore((state) => state.settings.paperWidth);
  const configuredCharactersPerLine = usePrinterStore((state) => state.settings.charactersPerLine);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const themeColorMuted = useThemeColor("muted");
  const navigationTheme = useNavigationTheme();
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [previewPaperWidth, setPreviewPaperWidth] = useState<PaperWidth>(configuredPaperWidth);

  const merchantDefaults = useMemo(
    () => ({
      id: activeMerchant?.id ?? null,
      name: merchantProfile.data?.name ?? activeMerchant?.name ?? "",
      logo: merchantProfile.data?.logo_url ?? activeMerchant?.logo_url ?? null,
    }),
    [activeMerchant, merchantProfile.data]
  );

  useEffect(() => {
    if (!merchantDefaults.id || settings.initializedMerchantId === merchantDefaults.id) return;

    const shouldOptimizeMerchantLogo = !settings.storeLogo && !!merchantDefaults.logo;
    updateSettings({
      initializedMerchantId: merchantDefaults.id,
      storeName: settings.storeName || merchantDefaults.name,
      storeLogo: settings.storeLogo || merchantDefaults.logo,
      footer: settings.footer || "Thank you!",
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
  }, [merchantDefaults, settings, updateSettings]);

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
        label: "Photo access required",
        description: "Allow photo access to select a receipt logo.",
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
    try {
      const storeLogo = await optimizeReceiptLogo(result.assets[0].uri);
      updateSettings({ storeLogo });
      toast.show({ variant: "success", label: "Receipt logo updated" });
    } catch (error: unknown) {
      toast.show({
        variant: "danger",
        label: "Logo processing failed",
        description: error instanceof Error ? error.message : "Choose another image and try again.",
      });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          {...getToolbarIcon("printer")}
          tintColor={navigationTheme.foreground}
          accessibilityLabel="Setup printers"
          onPress={() => router.push("/settings/printers")}
        />
      </Stack.Toolbar>

      <View className="flex-1 bg-background p-4">
        <View
          className={`w-full max-w-6xl flex-1 min-h-0 self-center ${isWide ? "flex-row-reverse items-stretch gap-6" : "gap-4"}`}
        >
          <Surface
            className={
              isWide
                ? "w-[480px] min-h-0 overflow-hidden p-0"
                : "w-full flex-[1.1] min-h-0 overflow-hidden p-0"
            }
          >
            <View className="px-5 pt-5 pb-4 gap-1">
              <Typography className="text-lg font-semibold text-foreground">
                Receipt details
              </Typography>
              <Typography type="body-sm" color="muted">
                Changes are saved automatically and used for future prints.
              </Typography>
            </View>

            <KeyboardAwareScrollView
              className="flex-1"
              contentContainerClassName="px-5 pb-5"
              bottomOffset={88}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-5">
                <View>
                  <FieldLabel>Receipt layout</FieldLabel>
                  <Select
                    value={RECEIPT_LAYOUTS.find((item) => item.value === settings.layout)}
                    onValueChange={(option) => {
                      if (option) {
                        updateSettings({
                          layout: option.value as "standard" | "compact" | "customer" | "kitchen",
                        });
                      }
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select layout" />
                      <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Overlay />
                      <Select.Content presentation="popover" width="trigger">
                        {RECEIPT_LAYOUTS.map((item) => (
                          <Select.Item key={item.value} value={item.value} label={item.label} />
                        ))}
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                </View>
                <View>
                  <FieldLabel>Store logo</FieldLabel>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Change store logo"
                    onPress={handleSelectLogo}
                    disabled={isProcessingLogo}
                    className="h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-secondary active:opacity-70"
                  >
                    {isProcessingLogo ? (
                      <View className="items-center gap-2">
                        <ActivityIndicator />
                        <Typography type="body-xs" color="muted">
                          Optimizing logo
                        </Typography>
                      </View>
                    ) : settings.storeLogo ? (
                      <>
                        <Image
                          source={{ uri: settings.storeLogo }}
                          className="h-20 w-40"
                          resizeMode="contain"
                        />
                        <View className="absolute right-2 bottom-2 rounded-full bg-black/60 p-2">
                          <Ionicons name="camera" size={15} color="white" />
                        </View>
                      </>
                    ) : (
                      <View className="items-center gap-1.5">
                        <Ionicons name="image-outline" size={26} color={themeColorMuted} />
                        <Typography type="body-xs" color="muted">
                          Choose image
                        </Typography>
                      </View>
                    )}
                  </Pressable>
                  <Typography type="body-xs" color="muted" className="mt-1.5">
                    Stored locally as a grayscale image optimized for thermal printing.
                  </Typography>
                </View>

                <View>
                  <FieldLabel>Store name</FieldLabel>
                  <Input
                    value={settings.storeName}
                    onChangeText={(storeName) => updateSettings({ storeName })}
                    placeholder="Store name"
                    variant="secondary"
                  />
                </View>

                <View>
                  <FieldLabel>Header</FieldLabel>
                  <Input
                    value={settings.header}
                    onChangeText={(header) => updateSettings({ header })}
                    placeholder="Address and phone number"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    variant="secondary"
                    className="min-h-24 py-3"
                  />
                </View>

                <View>
                  <FieldLabel>Footer</FieldLabel>
                  <Input
                    value={settings.footer}
                    onChangeText={(footer) => updateSettings({ footer })}
                    placeholder="Thank you!"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    variant="secondary"
                    className="min-h-20 py-3"
                  />
                </View>
              </View>
            </KeyboardAwareScrollView>

            <Separator />
            <View className="bg-surface px-5 py-4">
              <Button className="w-full" onPress={() => router.back()}>
                <Button.Label>Done</Button.Label>
              </Button>
            </View>
          </Surface>

          <View className="flex-1 min-h-0 gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Typography className="text-sm font-semibold text-foreground">
                Receipt preview
              </Typography>
              <Select
                value={{ value: previewPaperWidth, label: previewPaperWidth }}
                onValueChange={(option) => {
                  if (option?.value) setPreviewPaperWidth(option.value as PaperWidth);
                }}
              >
                <Select.Trigger className="w-28">
                  <Select.Value placeholder="Paper size" numberOfLines={1} />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    <Select.ListLabel className="mb-2">Preview size</Select.ListLabel>
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
            <ScrollView
              className="flex-1 rounded-lg bg-neutral-200 dark:bg-neutral-800"
              contentContainerClassName="p-4"
              showsVerticalScrollIndicator={false}
            >
              <ReceiptPaper
                settings={settings}
                data={SAMPLE_RECEIPT}
                paperWidth={previewPaperWidth}
                charactersPerLine={
                  previewPaperWidth === configuredPaperWidth
                    ? configuredCharactersPerLine
                    : previewPaperWidth === "80mm"
                      ? "46"
                      : "32"
                }
              />
            </ScrollView>
          </View>
        </View>
      </View>
    </>
  );
}

import { ReceiptPaper, type ReceiptPreviewData } from "@/components/receipt/ReceiptPaper";
import { useAuth } from "@/stores/useAuth";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { optimizeReceiptLogo } from "@/utils/receiptLogo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Button, Input, Surface, Typography, useThemeColor, useToast } from "heroui-native";
import React, { useEffect, useMemo, useState } from "react";
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
  items: [
    {
      id: "sample-1",
      name: "Cafe Latte",
      qty: 2,
      price: 28000,
      subtotal: 62000,
      addOns: [{ id: "sample-addon-1", group: "Milk", name: "Oat milk", price: 3000 }],
    },
    {
      id: "sample-2",
      name: "Butter Croissant",
      qty: 1,
      price: 24000,
      subtotal: 24000,
      addOns: [],
    },
  ],
  subtotal: 86000,
  fees: [{ id: "service", name: "Service", amount: 4300 }],
  total: 90300,
};

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
  const settings = useReceiptStore((state) => state.settings);
  const updateSettings = useReceiptStore((state) => state.updateSettings);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const themeColorMuted = useThemeColor("muted");
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  const merchantDefaults = useMemo(
    () => ({
      id: activeMerchant?.id ?? null,
      name: activeMerchant?.name ?? "",
      logo: activeMerchant?.logo_url ?? null,
      header: getMerchantHeader(activeMerchant),
    }),
    [activeMerchant]
  );

  useEffect(() => {
    if (!merchantDefaults.id || settings.initializedMerchantId === merchantDefaults.id) return;

    const shouldOptimizeMerchantLogo = !settings.storeLogo && !!merchantDefaults.logo;
    updateSettings({
      initializedMerchantId: merchantDefaults.id,
      storeName: settings.storeName || merchantDefaults.name,
      storeLogo: settings.storeLogo || merchantDefaults.logo,
      header: settings.header || merchantDefaults.header,
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
      aspect: [2, 1],
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
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`w-full max-w-6xl self-center ${isWide ? "flex-row items-start gap-6" : "gap-5"}`}
        >
          <Surface className={isWide ? "w-[380px] p-5" : "w-full p-5"}>
            <View className="mb-5 gap-1">
              <Typography className="text-lg font-semibold text-foreground">
                Receipt details
              </Typography>
              <Typography type="body-sm" color="muted">
                Changes are saved automatically and used for future prints.
              </Typography>
            </View>

            <View className="gap-5">
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
          </Surface>

          <View className="flex-1 gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Typography className="text-sm font-semibold text-foreground">
                Receipt preview
              </Typography>
              <Typography type="body-xs" color="muted">
                58 mm
              </Typography>
            </View>
            <View className="rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
              <ReceiptPaper settings={settings} data={SAMPLE_RECEIPT} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-surface px-4 py-3">
        <Button className="w-full max-w-6xl self-center" onPress={() => router.back()}>
          <Button.Label>Done</Button.Label>
        </Button>
      </View>
    </View>
  );
}

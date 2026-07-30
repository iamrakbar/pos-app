import AppIcon from "@/components/common/app-icon";
import { useRouter } from "expo-router";
import { Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, Pressable, View } from "react-native";
import LoadingState from "@/components/common/loading-state";
import CreateFAB from "@/components/common/create-fab";
import { usePrinterStore, type SavedPrinter } from "@/stores/use-printer-store";
import { EmptyState } from "heroui-native-pro";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";

function getPrinterTarget(printer: SavedPrinter, t: Translate) {
  if (printer.connection === "bluetooth") {
    return (
      printer.macAddress || printer.selectedDeviceId || t("printerManagement.noBluetoothAddress")
    );
  }

  return `${printer.ipAddress || t("printerManagement.noIpAddress")}:${printer.port || "9100"}`;
}

export default function PrintersScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const printers = usePrinterStore((state) => state.printers);
  const selectedPrinterId = usePrinterStore((state) => state.selectedPrinterId);
  const hasHydrated = usePrinterStore((state) => state.hasHydrated);
  const selectPrinter = usePrinterStore((state) => state.selectPrinter);
  const [themeColorMuted, themeColorAccent] = useThemeColor(["muted", "accent"]);

  return (
    <View className="flex-1 bg-background">
      {!hasHydrated ? (
        <LoadingState message={t("printerManagement.loading")} />
      ) : printers.length === 0 ? (
        <EmptyState className="py-20">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <AppIcon name="print-outline" size={20} color={themeColorMuted} />
            </EmptyState.Media>
            <EmptyState.Title>{t("printerManagement.empty")}</EmptyState.Title>
            <EmptyState.Description>
              {t("printerManagement.emptyDescription")}
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <FlatList
          data={printers}
          keyExtractor={(printer) => printer.id}
          contentContainerClassName="py-2 pb-24"
          ItemSeparatorComponent={() => <Separator className="mx-5" />}
          renderItem={({ item: printer }) => {
            const isSelected = printer.id === selectedPrinterId;

            return (
              <Pressable
                className="px-4 py-3 active:bg-surface-secondary md:px-6"
                onPress={() => router.push(`/settings/printers/${printer.id}` as never)}
                accessibilityRole="button"
                accessibilityLabel={t("printerManagement.openAccessibility", {
                  printer: printer.name || t("printerManagement.unnamed"),
                })}
              >
                <View className="flex-row items-start gap-3">
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      selectPrinter(printer.id);
                    }}
                    className="w-8 h-8 items-center justify-center"
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={t("printerManagement.selectAccessibility", {
                      printer: printer.name || t("printerManagement.unnamed"),
                    })}
                  >
                    <AppIcon
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? themeColorAccent : themeColorMuted}
                    />
                  </Pressable>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                        {printer.name || t("printerManagement.unnamed")}
                      </Typography>
                      <AppIcon name="chevron-forward" size={18} color={themeColorMuted} />
                    </View>
                    <Typography type="body-xs" color="muted" numberOfLines={1}>
                      {printer.connection === "bluetooth"
                        ? t("printerManagement.bluetooth")
                        : t("printerManagement.network")}{" "}
                      • {printer.paperWidth}
                    </Typography>
                    <Typography type="body-xs" color="muted" numberOfLines={1}>
                      {getPrinterTarget(printer, t)}
                    </Typography>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <CreateFAB
        accessibilityLabel={t("printerManagement.addAccessibility")}
        onPress={() => router.push("/settings/printers/new" as never)}
      />
    </View>
  );
}

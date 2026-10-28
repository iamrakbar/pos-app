import { Typography , Separator , Fab, PlusIcon, Skeleton as PanelListSkeleton , EmptyState } from "panelui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useRouter } from "expo-router";

import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { usePrinterStore, type SavedPrinter } from "@/stores/use-printer-store";
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
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const printers = usePrinterStore((state) => state.printers);
  const selectedPrinterId = usePrinterStore((state) => state.selectedPrinterId);
  const hasHydrated = usePrinterStore((state) => state.hasHydrated);
  const selectPrinter = usePrinterStore((state) => state.selectPrinter);
  const [themeColorMuted, themeColorAccent] = useCSSVariable([
    "--color-muted-foreground",
    "--color-primary",
  ]) as [string, string];

  return (
    <View className="flex-1 bg-background">
      {!hasHydrated ? (
        <View className="flex-1 gap-px py-2" accessibilityRole="progressbar">
          {Array.from({ length: 6 }, (_, index) => (
            <View
              key={`loading-row-${index}`}
              className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6"
            >
              <PanelListSkeleton className="size-11 shrink-0 rounded-xl" />
              <View className="flex-1 gap-2">
                <PanelListSkeleton className="h-4 w-3/5 rounded-md" />
                <PanelListSkeleton className="h-3 w-2/5 rounded-md" />
                <PanelListSkeleton className="h-3 w-1/3 rounded-md" />
              </View>
              <PanelListSkeleton className="size-4 rounded-full" />
            </View>
          ))}
        </View>
      ) : printers.length === 0 ? (
        <EmptyState className="py-20">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <AppIcon icon={AppIcons.print} size={20} color={themeColorMuted} />
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
                      icon={isSelected ? AppIcons.radioOn : AppIcons.radioOff}
                      size={20}
                      color={isSelected ? themeColorAccent : themeColorMuted}
                    />
                  </Pressable>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                        {printer.name || t("printerManagement.unnamed")}
                      </Typography>
                      <AppIcon icon={AppIcons.chevronForward} size={18} color={themeColorMuted} />
                    </View>
                    <Typography type="body-xs" muted numberOfLines={1}>
                      {printer.connection === "bluetooth"
                        ? t("printerManagement.bluetooth")
                        : t("printerManagement.network")}{" "}
                      • {printer.paperWidth}
                    </Typography>
                    <Typography type="body-xs" muted numberOfLines={1}>
                      {getPrinterTarget(printer, t)}
                    </Typography>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <Fab
        icon={<PlusIcon size={22} />}
        placement="bottom-right"
        style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
        accessibilityLabel={t("printerManagement.addAccessibility")}
        onPress={() => router.push("/settings/printers/new" as never)}
      />
    </View>
  );
}

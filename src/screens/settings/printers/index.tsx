import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, Pressable, View } from "react-native";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import { usePrinterStore, type SavedPrinter } from "@/stores/usePrinterStore";
import { useNavigationTheme } from "@/utils/navigationTheme";
import { getToolbarIcon } from "@/utils/toolbarIcons";

function getPrinterTarget(printer: SavedPrinter) {
  if (printer.connection === "bluetooth") {
    return printer.macAddress || printer.selectedDeviceId || "No Bluetooth address";
  }

  return `${printer.ipAddress || "No IP address"}:${printer.port || "9100"}`;
}

export default function PrintersScreen(): React.JSX.Element {
  const router = useRouter();
  const printers = usePrinterStore((state) => state.printers);
  const selectedPrinterId = usePrinterStore((state) => state.selectedPrinterId);
  const hasHydrated = usePrinterStore((state) => state.hasHydrated);
  const selectPrinter = usePrinterStore((state) => state.selectPrinter);
  const [themeColorMuted, themeColorAccent] = useThemeColor(["muted", "accent"]);
  const theme = useNavigationTheme();

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          {...getToolbarIcon("add")}
          tintColor={theme.foreground}
          accessibilityLabel="Add printer"
          onPress={() => router.push("/settings/printers/new" as never)}
        />
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        {!hasHydrated ? (
          <LoadingState message="Loading printers…" />
        ) : printers.length === 0 ? (
          <EmptyState icon="print-outline" message="No printers saved" />
        ) : (
          <FlatList
            data={printers}
            keyExtractor={(printer) => printer.id}
            contentContainerClassName="py-2"
            ItemSeparatorComponent={() => <Separator className="mx-5" />}
            renderItem={({ item: printer }) => {
              const isSelected = printer.id === selectedPrinterId;

              return (
                <Pressable
                  className="px-5 py-3 active:bg-surface-secondary"
                  onPress={() => router.push(`/settings/printers/${printer.id}` as never)}
                >
                  <View className="flex-row items-start gap-3">
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        selectPrinter(printer.id);
                      }}
                      className="w-8 h-8 items-center justify-center"
                    >
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={isSelected ? themeColorAccent : themeColorMuted}
                      />
                    </Pressable>
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between gap-3">
                        <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                          {printer.name || "Unnamed printer"}
                        </Typography>
                        <Ionicons name="chevron-forward" size={18} color={themeColorMuted} />
                      </View>
                      <Typography type="body-xs" color="muted" numberOfLines={1}>
                        {printer.connection === "bluetooth" ? "Bluetooth" : "Wi-Fi / LAN"} •{" "}
                        {printer.paperWidth}
                      </Typography>
                      <Typography type="body-xs" color="muted" numberOfLines={1}>
                        {getPrinterTarget(printer)}
                      </Typography>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </>
  );
}

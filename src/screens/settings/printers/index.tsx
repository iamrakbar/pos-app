import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Card, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { usePrinterStore, type SavedPrinter } from "@/stores/usePrinterStore";

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
  const [themeColorMuted, themeColorAccent, themeColorForeground] = useThemeColor([
    "muted",
    "accent",
    "foreground",
  ]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {!hasHydrated ? (
          <View className="py-10 items-center">
            <Typography type="body-sm" color="muted">
              Loading printers...
            </Typography>
          </View>
        ) : printers.length === 0 ? (
          <Card className="p-6 items-center gap-3">
            <View className="w-12 h-12 rounded-panel bg-surface-secondary items-center justify-center">
              <Ionicons name="print-outline" size={24} color={themeColorMuted} />
            </View>
            <View className="gap-1 items-center">
              <Typography type="body-sm" weight="semibold">
                No printers saved
              </Typography>
              <Typography type="body-xs" color="muted" className="text-center">
                Add a Bluetooth or network printer before printing receipts.
              </Typography>
            </View>
            <Button onPress={() => router.push("/settings/printers/new" as never)}>
              <Ionicons name="add" size={18} color="white" />
              <Button.Label>Add Printer</Button.Label>
            </Button>
          </Card>
        ) : (
          <View className="gap-3">
            {printers.map((printer) => {
              const isSelected = printer.id === selectedPrinterId;

              return (
                <Card key={printer.id} className="p-0 overflow-hidden">
                  <Pressable
                    className="px-4 py-4 active:bg-surface-secondary"
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
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="px-4 pb-6 pt-3 bg-surface-secondary">
        <Button className="w-full" onPress={() => router.push("/settings/printers/new" as never)}>
          <Ionicons name="add" size={18} color="white" />
          <Button.Label>Add Printer</Button.Label>
        </Button>
        {printers.length > 0 ? (
          <Button className="w-full mt-2" variant="outline" onPress={() => router.back()}>
            <Ionicons name="checkmark" size={18} color={themeColorForeground} />
            <Button.Label>Done</Button.Label>
          </Button>
        ) : null}
      </View>
    </View>
  );
}

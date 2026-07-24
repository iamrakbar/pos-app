import { Ionicons } from "@expo/vector-icons";
import {
  Alignment,
  BLEPrinter,
  COMMANDS,
  type IBLEPrinter,
  type INetPrinter,
  NetPrinter,
} from "@haroldtran/react-native-thermal-printer";
import { useRouter } from "expo-router";
import {
  Button,
  Dialog,
  Input,
  Select,
  Separator,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import React from "react";
import { Linking, PermissionsAndroid, Platform, Pressable, ScrollView, View } from "react-native";
import type { ConnectionType, PaperWidth } from "@/stores/usePrinterStore";
import { usePrinterStore } from "@/stores/usePrinterStore";
import DialogCloseButton from "@/components/common/DialogCloseButton";
import { EmptyState } from "heroui-native-pro";

// ─── Types & constants ────────────────────────────────────────────────────────

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
  { value: "bluetooth", label: "Bluetooth" },
  { value: "wifi", label: "Wi-Fi / LAN" },
];

const PAPER_WIDTHS: { value: PaperWidth; label: string }[] = [
  { value: "58mm", label: "58mm" },
  { value: "80mm", label: "80mm" },
];

type DiscoveredDevice = { id: string; name: string };
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type PermissionStatus = "unknown" | "granted" | "denied";
type PromptState = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};
type PrinterDriver = typeof BLEPrinter | typeof NetPrinter;

const PORT = "9100";

const paperWidthConfig: Record<
  PaperWidth,
  {
    dottedLine: string;
    billColumnWidth: [number, number];
    billImageWidth: number;
  }
> = {
  "58mm": {
    dottedLine: COMMANDS.HORIZONTAL_LINE.HR3_58MM.slice(0, 32),
    billColumnWidth: [20, 12],
    billImageWidth: 200,
  },
  "80mm": {
    dottedLine: COMMANDS.HORIZONTAL_LINE.HR3_80MM.slice(0, 46),
    billColumnWidth: [30, 16],
    billImageWidth: 260,
  },
};

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return (
    <Typography type="body-sm" weight="semibold" className="mb-1.5">
      {label}
    </Typography>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrinterSettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const [themeColorForeground, themeColorAccent] = useThemeColor(["foreground", "accent"]);

  const settings = usePrinterStore((s) => s.settings);
  const updateSettings = usePrinterStore((s) => s.updateSettings);

  const {
    connection,
    name,
    macAddress,
    ipAddress,
    port,
    paperWidth,
    cutReceipt,
    openDrawer,
    selectedDeviceId,
  } = settings;

  const [scanning, setScanning] = React.useState(false);
  const [devices, setDevices] = React.useState<DiscoveredDevice[]>([]);
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>("idle");
  const [permissionStatus, setPermissionStatus] = React.useState<PermissionStatus>("unknown");
  const [prompt, setPrompt] = React.useState<PromptState | null>(null);
  const [printing, setPrinting] = React.useState(false);

  const activePaperWidthConfig = paperWidthConfig[paperWidth];
  const isConnected = connectionStatus === "connected";
  const selectedBluetoothDevice = devices.find((device) => device.id === selectedDeviceId);
  const bluetoothTarget = macAddress || selectedBluetoothDevice?.id || "";
  const canConnect =
    connection === "bluetooth"
      ? !!bluetoothTarget
      : !!ipAddress.trim() && !!String(port || PORT).trim();

  const openAppSettings = React.useCallback(async () => {
    await Linking.openSettings();
  }, []);

  const openBluetoothSettings = React.useCallback(async () => {
    if (Platform.OS === "android") {
      try {
        const IntentLauncher =
          require("expo-intent-launcher") as typeof import("expo-intent-launcher");
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS);
        return;
      } catch {
        await Linking.openSettings();
        return;
      }
    }

    await Linking.openSettings();
  }, []);

  const showMessage = React.useCallback((title: string, message?: string) => {
    setPrompt({ title, message });
  }, []);

  const showActionPrompt = React.useCallback((nextPrompt: PromptState) => {
    setPrompt(nextPrompt);
  }, []);

  const getActivePrinterDriver = React.useCallback(
    (): PrinterDriver => (connection === "bluetooth" ? BLEPrinter : NetPrinter),
    [connection]
  );

  const handleConnectionChange = (type: ConnectionType) => {
    updateSettings({ connection: type, selectedDeviceId: "" });
    setConnectionStatus("idle");
    if (type === "wifi") {
      setDevices([]);
    }
  };

  const updatePrinterSettings = React.useCallback(
    (patch: Parameters<typeof updateSettings>[0]) => {
      updateSettings(patch);
      setConnectionStatus("idle");
    },
    [updateSettings]
  );

  const getBluetoothPermissions = React.useCallback(() => {
    if (Platform.OS !== "android") return [];

    if (Number(Platform.Version) >= 31) {
      return [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];
    }

    return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  }, []);

  const checkBluetoothPermissions = React.useCallback(async () => {
    const permissions = getBluetoothPermissions();
    if (permissions.length === 0) {
      setPermissionStatus("granted");
      return true;
    }

    const results = await Promise.all(
      permissions.map((permission) => PermissionsAndroid.check(permission))
    );
    const granted = results.every(Boolean);
    setPermissionStatus(granted ? "granted" : "denied");
    return granted;
  }, [getBluetoothPermissions]);

  const requestBluetoothPermissions = React.useCallback(async () => {
    const permissions = getBluetoothPermissions();
    if (permissions.length === 0) {
      setPermissionStatus("granted");
      return true;
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const granted = permissions.every(
      (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
    );
    const blocked = permissions.some(
      (permission) => results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    );

    setPermissionStatus(granted ? "granted" : "denied");

    if (!granted) {
      const message = blocked
        ? "Bluetooth printer access is blocked. Enable Bluetooth permissions in system settings."
        : "Bluetooth printer access is required to scan and connect to Bluetooth printers.";
      showActionPrompt({
        title: "Bluetooth permission required",
        message,
        actionLabel: "Open Settings",
        onAction: openAppSettings,
      });
    }

    return granted;
  }, [getBluetoothPermissions, openAppSettings, showActionPrompt]);

  const ensureBluetoothReady = React.useCallback(
    async (requestPermission: boolean) => {
      const hasPermission = requestPermission
        ? await requestBluetoothPermissions()
        : await checkBluetoothPermissions();
      if (!hasPermission) return false;

      try {
        await BLEPrinter.init();
        return true;
      } catch (err: unknown) {
        setConnectionStatus("error");
        showActionPrompt({
          title: "Bluetooth unavailable",
          message:
            err instanceof Error
              ? err.message
              : "Turn on Bluetooth and make sure printer access is allowed.",
          actionLabel: Platform.OS === "android" ? "Open Bluetooth Settings" : "Open Settings",
          onAction: openBluetoothSettings,
        });
        return false;
      }
    },
    [
      checkBluetoothPermissions,
      openBluetoothSettings,
      requestBluetoothPermissions,
      showActionPrompt,
    ]
  );

  const parseNetworkTarget = React.useCallback(() => {
    const host = ipAddress.trim();
    const parsedPort = Number(port || PORT);

    if (!host) {
      throw new Error("Enter the printer IP address first.");
    }

    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      throw new Error("Enter a valid printer port between 1 and 65535.");
    }

    return { host, port: parsedPort };
  }, [ipAddress, port]);

  const handleScan = React.useCallback(
    async (clearSelection = true, requestPermission = true) => {
      setScanning(true);
      setDevices([]);
      if (clearSelection) {
        updateSettings({ selectedDeviceId: "" });
      }
      setConnectionStatus("idle");

      try {
        const ready = await ensureBluetoothReady(requestPermission);
        if (!ready) return;

        const results = await BLEPrinter.getDeviceList();
        setDevices(
          results?.map((device: IBLEPrinter) => {
            const id = device.inner_mac_address || device.device_name;
            return {
              id,
              name: device.device_name || id,
            };
          }) ?? []
        );
      } catch (err: unknown) {
        showMessage(
          "Scan failed",
          err instanceof Error ? err.message : "Could not scan for Bluetooth printers."
        );
      } finally {
        setScanning(false);
      }
    },
    [ensureBluetoothReady, showMessage, updateSettings]
  );

  React.useEffect(() => {
    if (connection === "wifi") {
      void NetPrinter.init().catch(() => undefined);
    }
  }, [connection]);

  const handleConnect = async () => {
    setConnectionStatus("connecting");

    try {
      if (connection === "bluetooth") {
        const ready = await ensureBluetoothReady(true);
        if (!ready) {
          setConnectionStatus("error");
          return;
        }

        if (!bluetoothTarget) {
          throw new Error("Select a Bluetooth printer or enter a MAC address first.");
        }

        const connectedPrinter = await BLEPrinter.connectPrinter(bluetoothTarget);
        updateSettings({
          macAddress: connectedPrinter.inner_mac_address || bluetoothTarget,
          name: connectedPrinter.device_name || name,
          selectedDeviceId: connectedPrinter.inner_mac_address || selectedDeviceId,
        });
      } else {
        const target = parseNetworkTarget();
        await NetPrinter.init();

        const connectedPrinter: INetPrinter = await NetPrinter.connectPrinter(
          target.host,
          target.port
        );
        updateSettings({
          name: connectedPrinter.device_name || name,
          ipAddress: connectedPrinter.host || target.host,
          port: String(connectedPrinter.port || target.port),
        });
      }

      setConnectionStatus("connected");
      showMessage("Printer connected", `${name || "Printer"} is ready.`);
    } catch (err: unknown) {
      setConnectionStatus("error");
      showMessage(
        "Connection failed",
        err instanceof Error ? err.message : "Could not connect to the printer."
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await getActivePrinterDriver().closeConn();
    } finally {
      setConnectionStatus("idle");
    }
  };

  const withPrintGuard = (fn: () => Promise<void>) => async () => {
    if (!isConnected) {
      showMessage("Not connected", "Connect to a printer before printing.");
      return;
    }

    setPrinting(true);
    try {
      await fn();
      showMessage("Sent to printer");
    } catch (err: unknown) {
      showMessage(
        "Print failed",
        err instanceof Error ? err.message : "An error occurred while printing."
      );
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintSample = withPrintGuard(async () => {
    const PrinterDriver = getActivePrinterDriver();
    const reportPrintError = (error: Error) => showMessage("Print failed", error.message);

    PrinterDriver.printText("<C><B>Hi from Soeat!</B></C>\n", {
      cut: false,
      onError: reportPrintError,
    });
    PrinterDriver.printImage("https://www.soeat.id/favicon-96x96.png", {
      imageWidth: activePaperWidthConfig.billImageWidth,
      onError: reportPrintError,
    });
    PrinterDriver.printText("<C><B>PRINT TEST</B></C>\n", {
      onError: reportPrintError,
    });
    PrinterDriver.printText(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n",
      { onError: reportPrintError }
    );
    PrinterDriver.printText(
      "!@#$%^&*()_+-=[]{}|;:'\",.<>/?~` - wrap test - wrap test - wrap test\n",
      { onError: reportPrintError }
    );
    PrinterDriver.printText(
      "Line 01: The quick brown fox jumps over the lazy dog.\n" +
        "Line 02: The quick brown fox jumps over the lazy dog.\n" +
        "Line 03: The quick brown fox jumps over the lazy dog.\n" +
        "Line 04: The quick brown fox jumps over the lazy dog.\n" +
        "Line 05: The quick brown fox jumps over the lazy dog.\n",
      { onError: reportPrintError }
    );
    PrinterDriver.printBill("\n<C>--- END OF PRINT TEST ---</C>", {
      cut: cutReceipt,
      beep: true,
      onError: reportPrintError,
    });
  });

  const handlePrintBill = withPrintGuard(async () => {
    const PrinterDriver = getActivePrinterDriver();
    const boldOn = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
    const boldOff = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
    const center = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
    const left = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
    const size2h = COMMANDS.TEXT_FORMAT.TXT_2HEIGHT;
    const sizeNormal = COMMANDS.TEXT_FORMAT.TXT_NORMAL;
    const dashed = activePaperWidthConfig.dottedLine;
    const columnWidths = activePaperWidthConfig.billColumnWidth;
    const columnAlign: Alignment[] = ["left", "right"];
    const reportPrintError = (error: Error) => showMessage("Print failed", error.message);

    const orderItems = [
      { name: "americano", qty: 1, unitPrice: "28.000", total: "28.000" },
      { name: "roti bakar butter wisman", qty: 1, unitPrice: "25.000", total: "25.000" },
      { name: "lemon tea", qty: 1, unitPrice: "25.000", total: "25.000" },
    ];
    const totalQty = orderItems.reduce((acc, item) => acc + item.qty, 0);

    PrinterDriver.printText(`${center}${boldOn}${size2h}SOEAT POS${sizeNormal}${boldOff}\n`, {
      onError: reportPrintError,
    });
    PrinterDriver.printText(`${center}Sample receipt\n`, { onError: reportPrintError });
    PrinterDriver.printText(`${center}${dashed}`, { onError: reportPrintError });
    PrinterDriver.printText(`${left}Nomor Ref    : 00201001`, { onError: reportPrintError });
    PrinterDriver.printText("Tanggal      : 28-03-2026 10:51:26", { onError: reportPrintError });
    PrinterDriver.printText("Kasir        : SOEAT", { onError: reportPrintError });
    PrinterDriver.printText("Tipe pesanan : DINE IN", { onError: reportPrintError });
    PrinterDriver.printText(`${dashed}`, { onError: reportPrintError });

    for (const item of orderItems) {
      PrinterDriver.printText(item.name, { onError: reportPrintError });
      PrinterDriver.printColumnsText(
        [`${item.qty} x ${item.unitPrice}`, item.total],
        columnWidths,
        columnAlign,
        ["", ""],
        { onError: reportPrintError }
      );
    }

    PrinterDriver.printText(`${dashed}`, { onError: reportPrintError });
    PrinterDriver.printColumnsText(["Subtotal", "78.000"], columnWidths, columnAlign, ["", ""], {
      onError: reportPrintError,
    });
    PrinterDriver.printText(`Item = ${orderItems.length} - Qty = ${totalQty}`, {
      onError: reportPrintError,
    });
    PrinterDriver.printText("TOTAL", { onError: reportPrintError });
    PrinterDriver.printText(`${boldOn}${size2h}78.000${sizeNormal}${boldOff}\n`, {
      onError: reportPrintError,
    });
    PrinterDriver.printBill(`${center}${boldOn}TERIMA KASIH${boldOff}`, {
      cut: cutReceipt,
      beep: true,
      onError: reportPrintError,
    });
  });

  const handleSave = () => {
    router.back();
  };

  const handlePromptAction = async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-6 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* Connection */}
        <View>
          <FieldLabel label="Connection" />
          <Select
            value={CONNECTION_TYPES.find((c) => c.value === connection)}
            onValueChange={(opt) => {
              if (opt) handleConnectionChange(opt.value as ConnectionType);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select connection" numberOfLines={1} />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="popover" width="trigger">
                <Select.ListLabel className="mb-2">Connection type</Select.ListLabel>
                {CONNECTION_TYPES.map((c, i, arr) => (
                  <React.Fragment key={c.value}>
                    <Select.Item value={c.value} label={c.label} />
                    {i < arr.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>

        {/* Name */}
        <View>
          <FieldLabel label="Name" />
          <Input
            value={name}
            onChangeText={(v) => updatePrinterSettings({ name: v })}
            placeholder="Printer name"
            variant="secondary"
          />
        </View>

        {/* MAC Address (Bluetooth only) */}
        {connection === "bluetooth" && (
          <View>
            <FieldLabel label="MAC Address" />
            <Input
              value={macAddress}
              onChangeText={(v) => updatePrinterSettings({ macAddress: v })}
              placeholder="00:00:00:00:00:00"
              autoCapitalize="characters"
              variant="secondary"
            />
          </View>
        )}

        {/* IP Address (Wi-Fi only) */}
        {connection === "wifi" && (
          <View>
            <FieldLabel label="IP Address" />
            <Input
              value={ipAddress}
              onChangeText={(v) => updatePrinterSettings({ ipAddress: v })}
              placeholder="192.168.1.100"
              keyboardType="decimal-pad"
              variant="secondary"
            />
          </View>
        )}

        {/* Port (Wi-Fi only) */}
        {connection === "wifi" && (
          <View>
            <FieldLabel label="Port" />
            <Input
              value={port || PORT}
              onChangeText={(v) => updatePrinterSettings({ port: v })}
              placeholder={PORT}
              keyboardType="number-pad"
              variant="secondary"
            />
          </View>
        )}

        {/* Receipt Size */}
        <View>
          <FieldLabel label="Receipt Size" />
          <Select
            value={PAPER_WIDTHS.find((w) => w.value === paperWidth)}
            onValueChange={(opt) => {
              if (opt) updatePrinterSettings({ paperWidth: opt.value as PaperWidth });
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select size" numberOfLines={1} />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="popover" width="trigger">
                <Select.ListLabel className="mb-2">Receipt size</Select.ListLabel>
                {PAPER_WIDTHS.map((w, i, arr) => (
                  <React.Fragment key={w.value}>
                    <Select.Item value={w.value} label={w.label} />
                    {i < arr.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>

        {/* Cut receipt toggle */}
        <Pressable
          className="flex-row items-center justify-between"
          onPress={() => updatePrinterSettings({ cutReceipt: !cutReceipt })}
        >
          <View className="flex-1 mr-4">
            <Typography type="body-sm" weight="semibold">
              Cut receipt after printing
            </Typography>
            <Typography type="body-xs" color="muted" className="mt-0.5">
              Only enable this option if your printer supports it.
            </Typography>
          </View>
          <Switch
            isSelected={cutReceipt}
            onSelectedChange={(v) => updatePrinterSettings({ cutReceipt: v })}
          />
        </Pressable>

        {/* Open drawer toggle */}
        <Pressable
          className="flex-row items-center justify-between"
          onPress={() => updatePrinterSettings({ openDrawer: !openDrawer })}
        >
          <View className="flex-1 mr-4">
            <Typography type="body-sm" weight="semibold">
              Open drawer after printing
            </Typography>
            <Typography type="body-xs" color="muted" className="mt-0.5">
              Only enable this option if your printer supports it.
            </Typography>
          </View>
          <Switch
            isSelected={openDrawer}
            onSelectedChange={(v) => updatePrinterSettings({ openDrawer: v })}
          />
        </Pressable>

        {/* Device list (Bluetooth only) */}
        {connection === "bluetooth" && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <FieldLabel label="Device" />
              <Pressable
                onPress={() => handleScan()}
                disabled={scanning}
                className="active:opacity-60 p-1"
              >
                <Ionicons name="refresh" size={18} color={themeColorForeground} />
              </Pressable>
            </View>

            <View className="bg-surface-secondary rounded-panel overflow-hidden">
              {scanning ? (
                <View className="py-6 items-center">
                  <Typography type="body-sm" color="muted">
                    Scanning…
                  </Typography>
                </View>
              ) : devices.length === 0 ? (
                <EmptyState className="px-4 py-6">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <Ionicons name="bluetooth-outline" size={20} color={themeColorForeground} />
                    </EmptyState.Media>
                    <EmptyState.Title>
                      {permissionStatus === "denied"
                        ? "Bluetooth permission required"
                        : "No Bluetooth printers found"}
                    </EmptyState.Title>
                    <EmptyState.Description>
                      {permissionStatus === "denied"
                        ? "Tap refresh to request access again."
                        : "Turn on the printer, then tap refresh."}
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              ) : (
                devices.map((device, i) => (
                  <React.Fragment key={device.id}>
                    <Pressable
                      className="flex-row items-center justify-between px-4 py-3.5 active:bg-surface-tertiary"
                      onPress={() => {
                        updatePrinterSettings({
                          selectedDeviceId: device.id,
                          macAddress: device.id,
                          name: device.name,
                        });
                      }}
                    >
                      <Typography type="body-sm" weight="medium">
                        {device.name}
                      </Typography>
                      {selectedDeviceId === device.id && (
                        <Ionicons name="checkmark" size={18} color={themeColorAccent} />
                      )}
                    </Pressable>
                    {i < devices.length - 1 && <Separator className="mx-4" />}
                  </React.Fragment>
                ))
              )}
            </View>
          </View>
        )}

        {/* Printer actions */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <FieldLabel label="Printer Actions" />
            <Typography
              type="body-xs"
              color={isConnected ? undefined : "muted"}
              className={isConnected ? "text-success" : undefined}
            >
              {connectionStatus === "connecting"
                ? "Connecting…"
                : isConnected
                  ? "Connected"
                  : connectionStatus === "error"
                    ? "Connection failed"
                    : "Not connected"}
            </Typography>
          </View>
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              variant="outline"
              onPress={isConnected ? handleDisconnect : handleConnect}
              isDisabled={
                connectionStatus === "connecting" || printing || (!isConnected && !canConnect)
              }
            >
              <Ionicons
                name={isConnected ? "wifi-outline" : "link-outline"}
                size={16}
                color={themeColorForeground}
              />
              <Button.Label className="ml-1.5">
                {connectionStatus === "connecting"
                  ? "Connecting…"
                  : isConnected
                    ? "Disconnect"
                    : "Connect"}
              </Button.Label>
            </Button>
            <Button
              className="flex-1"
              onPress={handlePrintSample}
              isDisabled={!isConnected || printing}
            >
              <Ionicons name="print-outline" size={16} color="white" />
              <Button.Label className="ml-1.5">
                {printing ? "Printing…" : "Test Print"}
              </Button.Label>
            </Button>
          </View>
          <Button variant="outline" onPress={handlePrintBill} isDisabled={!isConnected || printing}>
            <Ionicons name="receipt-outline" size={16} color={themeColorForeground} />
            <Button.Label className="ml-1.5">Print Sample Bill</Button.Label>
          </Button>
        </View>
      </ScrollView>

      {/* Save button */}
      <View className="px-4 pb-6 pt-3 bg-surface-secondary">
        <Button className="w-full" onPress={handleSave}>
          <Button.Label>Save</Button.Label>
        </Button>
      </View>

      <Dialog isOpen={prompt !== null} onOpenChange={(open) => !open && setPrompt(null)}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
            <DialogCloseButton />
            <View className="mb-5 gap-1.5 pr-10">
              <Dialog.Title>{prompt?.title}</Dialog.Title>
              {prompt?.message ? <Dialog.Description>{prompt.message}</Dialog.Description> : null}
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setPrompt(null)}>
                <Button.Label>{prompt?.actionLabel ? "Cancel" : "Close"}</Button.Label>
              </Button>
              {prompt?.actionLabel ? (
                <Button size="sm" onPress={handlePromptAction}>
                  <Button.Label>{prompt.actionLabel}</Button.Label>
                </Button>
              ) : null}
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}

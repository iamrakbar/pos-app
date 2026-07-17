import { Ionicons } from "@expo/vector-icons";
import {
  BLEPrinter,
  NetPrinter,
  type IBLEPrinter,
  type INetPrinter,
} from "@haroldtran/react-native-thermal-printer";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Dialog,
  Input,
  Select,
  Separator,
  Spinner,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Linking, PermissionsAndroid, Platform, Pressable, ScrollView, View } from "react-native";
import { printerSchema, type PrinterFormValues } from "@/schemas/printer";
import {
  DEFAULT_PRINTER_SETTINGS,
  usePrinterStore,
  type ConnectionType,
  type PaperWidth,
  type PrinterSettings,
} from "@/stores/usePrinterStore";
import { getToolbarIcon } from "@/utils/toolbarIcons";
import { printCalibrationReceipt } from "@/services/printer/PrintService";

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
  { value: "bluetooth", label: "Bluetooth" },
  { value: "wifi", label: "Wi-Fi / LAN" },
];

const PAPER_WIDTHS: { value: PaperWidth; label: string }[] = [
  { value: "58mm", label: "58mm" },
  { value: "80mm", label: "80mm" },
];

type DiscoveredDevice = { id: string; name: string };
type PromptState = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

const PORT = "9100";

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Typography type="body-sm" weight="semibold" className="mb-1.5">
      {label}
      {required ? <Typography className="text-danger"> *</Typography> : null}
    </Typography>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Typography type="body-xs" className="text-danger mt-1">
      {message}
    </Typography>
  );
}

function toPrinterSettings(values: PrinterFormValues): PrinterSettings {
  return {
    ...values,
    port: values.port || PORT,
  };
}

export default function PrinterFormScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isCreate = id === "new";
  const printers = usePrinterStore((state) => state.printers);
  const addPrinter = usePrinterStore((state) => state.addPrinter);
  const updatePrinter = usePrinterStore((state) => state.updatePrinter);
  const deletePrinter = usePrinterStore((state) => state.deletePrinter);
  const selectPrinter = usePrinterStore((state) => state.selectPrinter);
  const hasHydrated = usePrinterStore((state) => state.hasHydrated);
  const printer = printers.find((item) => item.id === id);
  const [themeColorMuted, themeColorForeground, themeColorAccent, themeColorDanger] = useThemeColor(
    ["muted", "foreground", "accent", "danger"]
  );

  const [devices, setDevices] = React.useState<DiscoveredDevice[]>([]);
  const [scanning, setScanning] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [printingCalibration, setPrintingCalibration] = React.useState(false);
  const [prompt, setPrompt] = React.useState<PromptState | null>(null);
  const [deletePromptOpen, setDeletePromptOpen] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema) as never,
    defaultValues: {
      ...DEFAULT_PRINTER_SETTINGS,
      ...(printer ?? {}),
      port: printer?.port || PORT,
    },
  });

  const connection = watch("connection");
  const paperWidth = watch("paperWidth");
  const selectedDeviceId = watch("selectedDeviceId");
  const currentName = watch("name");

  React.useEffect(() => {
    if (!hasHydrated) return;

    if (!isCreate && !printer) {
      router.replace("/settings/printers" as never);
    }
  }, [hasHydrated, isCreate, printer, router]);

  React.useEffect(() => {
    if (!hasHydrated || isCreate || !printer) return;

    reset({
      ...DEFAULT_PRINTER_SETTINGS,
      ...printer,
      port: printer.port || PORT,
    });
  }, [hasHydrated, isCreate, printer, reset]);

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

  const requestBluetoothPermissions = React.useCallback(async () => {
    const permissions = getBluetoothPermissions();
    if (permissions.length === 0) return true;

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const granted = permissions.every(
      (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
    );
    const blocked = permissions.some(
      (permission) => results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    );

    if (!granted) {
      setPrompt({
        title: "Bluetooth permission required",
        message: blocked
          ? "Bluetooth printer access is blocked. Enable Bluetooth permissions in system settings."
          : "Bluetooth printer access is required to scan and connect to Bluetooth printers.",
        actionLabel: "Open Settings",
        onAction: openAppSettings,
      });
    }

    return granted;
  }, [getBluetoothPermissions, openAppSettings]);

  const handleScan = React.useCallback(async () => {
    setScanning(true);
    setDevices([]);

    try {
      const granted = await requestBluetoothPermissions();
      if (!granted) return;

      await BLEPrinter.init();
      const results = await BLEPrinter.getDeviceList();
      setDevices(
        results?.map((device: IBLEPrinter) => {
          const deviceId = device.inner_mac_address || device.device_name;
          return {
            id: deviceId,
            name: device.device_name || deviceId,
          };
        }) ?? []
      );
    } catch (err: unknown) {
      setPrompt({
        title: "Scan failed",
        message: err instanceof Error ? err.message : "Could not scan for Bluetooth printers.",
        actionLabel: Platform.OS === "android" ? "Open Bluetooth Settings" : "Open Settings",
        onAction: openBluetoothSettings,
      });
    } finally {
      setScanning(false);
    }
  }, [openBluetoothSettings, requestBluetoothPermissions]);

  React.useEffect(() => {
    if (connection === "bluetooth") {
      void handleScan();
    } else {
      setDevices([]);
      void NetPrinter.init().catch(() => undefined);
    }
  }, [connection, handleScan]);

  const handleSelectDevice = (device: DiscoveredDevice) => {
    setValue("selectedDeviceId", device.id, { shouldDirty: true, shouldValidate: true });
    setValue("macAddress", device.id, { shouldDirty: true, shouldValidate: true });
    setValue("name", device.name, { shouldDirty: true, shouldValidate: true });
  };

  const handleSave = (values: PrinterFormValues) => {
    if (isCreate) {
      const savedPrinter = addPrinter(toPrinterSettings(values));
      selectPrinter(savedPrinter.id);
    } else if (printer) {
      updatePrinter(printer.id, toPrinterSettings(values));
    }

    router.replace("/settings/printers" as never);
  };

  const handleDelete = async () => {
    if (!printer) return;
    try {
      if (printer.connection === "bluetooth") {
        await BLEPrinter.closeConn();
      } else {
        await NetPrinter.closeConn();
      }
    } catch {
      // App-level removal must still succeed if the native socket is already gone.
    }
    deletePrinter(printer.id);
    setDeletePromptOpen(false);
    router.replace("/settings/printers" as never);
  };

  const handleTestConnection = handleSubmit(async (values) => {
    setConnecting(true);

    try {
      if (values.connection === "bluetooth") {
        const granted = await requestBluetoothPermissions();
        if (!granted) return;

        const address = values.macAddress || values.selectedDeviceId;
        await BLEPrinter.init();
        await BLEPrinter.closeConn();
        const connectedPrinter = await BLEPrinter.connectPrinter(address);
        setValue("macAddress", connectedPrinter.inner_mac_address || address, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("selectedDeviceId", connectedPrinter.inner_mac_address || address, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("name", connectedPrinter.device_name || values.name, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else {
        const host = values.ipAddress.trim();
        const parsedPort = Number(values.port || PORT);
        await NetPrinter.init();
        await NetPrinter.closeConn();
        const connectedPrinter: INetPrinter = await NetPrinter.connectPrinter(host, parsedPort);
        setValue("ipAddress", connectedPrinter.host || host, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("port", String(connectedPrinter.port || parsedPort), {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("name", connectedPrinter.device_name || values.name, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setPrompt({
        title: "Printer connected",
        message: `${currentName || values.name || "Printer"} is ready.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not connect to the printer.";
      setPrompt({
        title: "Connection failed",
        message,
        actionLabel:
          values.connection === "bluetooth" && /bluetooth/i.test(message)
            ? Platform.OS === "android"
              ? "Open Bluetooth Settings"
              : "Open Settings"
            : undefined,
        onAction:
          values.connection === "bluetooth" && /bluetooth/i.test(message)
            ? openBluetoothSettings
            : undefined,
      });
    } finally {
      setConnecting(false);
    }
  });

  const handlePrintCalibration = handleSubmit(async (values) => {
    setPrintingCalibration(true);
    try {
      await printCalibrationReceipt(toPrinterSettings(values));
      setPrompt({
        title: "Calibration sent",
        message: "Check that the numbered ruler prints on one line without clipping or wrapping.",
      });
    } catch (error) {
      setPrompt({
        title: "Calibration failed",
        message:
          error instanceof Error ? error.message : "Could not print the calibration receipt.",
      });
    }
    setPrintingCalibration(false);
  });

  const handlePromptAction = async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isCreate ? "Add Printer" : "Edit Printer",
        }}
      />

      {!isCreate ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={themeColorDanger}
            accessibilityLabel="Delete printer"
            onPress={() => setDeletePromptOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}

      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-6 gap-5"
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <FieldLabel label="Connection" required />
            <Controller
              control={control}
              name="connection"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={CONNECTION_TYPES.find((item) => item.value === value)}
                  onValueChange={(option) => {
                    if (!option) return;
                    onChange(option.value);
                    setValue("selectedDeviceId", "", { shouldDirty: true });
                    setValue("macAddress", "", { shouldDirty: true, shouldValidate: true });
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
                      {CONNECTION_TYPES.map((item, index, arr) => (
                        <React.Fragment key={item.value}>
                          <Select.Item value={item.value} label={item.label} />
                          {index < arr.length - 1 ? <Separator /> : null}
                        </React.Fragment>
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
              )}
            />
          </View>

          <View>
            <FieldLabel label="Name" required />
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Printer name"
                  variant="secondary"
                />
              )}
            />
            <FieldError message={errors.name?.message} />
          </View>

          {connection === "bluetooth" ? (
            <View className="gap-3">
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <FieldLabel label="Device" />
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    onPress={handleScan}
                    isDisabled={scanning}
                  >
                    <Ionicons name="refresh" size={18} color={themeColorForeground} />
                  </Button>
                </View>

                <View className="bg-surface-secondary rounded-panel overflow-hidden">
                  {scanning ? (
                    <View className="py-6 items-center">
                      <Typography type="body-sm" color="muted">
                        Scanning...
                      </Typography>
                    </View>
                  ) : devices.length === 0 ? (
                    <View className="py-6 px-4 items-center gap-1">
                      <Typography type="body-sm" color="muted" className="text-center">
                        No Bluetooth printers found.
                      </Typography>
                      <Typography type="body-xs" color="muted" className="text-center">
                        Turn on the printer, then tap refresh.
                      </Typography>
                    </View>
                  ) : (
                    devices.map((device, index) => (
                      <React.Fragment key={device.id}>
                        <Pressable
                          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-tertiary"
                          onPress={() => handleSelectDevice(device)}
                        >
                          <Ionicons
                            name={
                              selectedDeviceId === device.id
                                ? "radio-button-on"
                                : "radio-button-off"
                            }
                            size={20}
                            color={
                              selectedDeviceId === device.id ? themeColorAccent : themeColorMuted
                            }
                          />
                          <View className="flex-1">
                            <Typography type="body-sm" weight="medium" numberOfLines={1}>
                              {device.name}
                            </Typography>
                            <Typography type="body-xs" color="muted" numberOfLines={1}>
                              {device.id}
                            </Typography>
                          </View>
                        </Pressable>
                        {index < devices.length - 1 ? <Separator className="mx-4" /> : null}
                      </React.Fragment>
                    ))
                  )}
                </View>
              </View>

              <View>
                <FieldLabel label="MAC Address" />
                <Controller
                  control={control}
                  name="macAddress"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="00:00:00:00:00:00"
                      autoCapitalize="characters"
                      variant="secondary"
                    />
                  )}
                />
                <FieldError message={errors.macAddress?.message} />
              </View>
            </View>
          ) : (
            <View className="gap-5">
              <View>
                <FieldLabel label="IP Address" required />
                <Controller
                  control={control}
                  name="ipAddress"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="192.168.1.100"
                      keyboardType="decimal-pad"
                      variant="secondary"
                    />
                  )}
                />
                <FieldError message={errors.ipAddress?.message} />
              </View>

              <View>
                <FieldLabel label="Port" required />
                <Controller
                  control={control}
                  name="port"
                  render={({ field: { value, onChange } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder={PORT}
                      keyboardType="number-pad"
                      variant="secondary"
                    />
                  )}
                />
                <FieldError message={errors.port?.message} />
              </View>
            </View>
          )}

          <View>
            <FieldLabel label="Receipt Size" required />
            <Controller
              control={control}
              name="paperWidth"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={PAPER_WIDTHS.find((item) => item.value === value)}
                  onValueChange={(option) => {
                    if (!option) return;
                    onChange(option.value);
                    setValue("charactersPerLine", option.value === "80mm" ? "46" : "32", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("logoWidthDots", option.value === "80mm" ? "380" : "300", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
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
                      {PAPER_WIDTHS.map((item, index, arr) => (
                        <React.Fragment key={item.value}>
                          <Select.Item value={item.value} label={item.label} />
                          {index < arr.length - 1 ? <Separator /> : null}
                        </React.Fragment>
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
              )}
            />
          </View>

          <View>
            <FieldLabel label="Characters per line" required />
            <Controller
              control={control}
              name="charactersPerLine"
              render={({ field: { value, onChange } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder={paperWidth === "80mm" ? "46" : "32"}
                  keyboardType="number-pad"
                  variant="secondary"
                />
              )}
            />
            <Typography type="body-xs" color="muted" className="mt-1">
              Recommended: 32 for 58mm, 46 for 80mm. Use calibration to verify.
            </Typography>
            <FieldError message={errors.charactersPerLine?.message} />
          </View>

          <View>
            <FieldLabel label="Logo width (dots)" required />
            <Controller
              control={control}
              name="logoWidthDots"
              render={({ field: { value, onChange } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder={paperWidth === "80mm" ? "380" : "300"}
                  keyboardType="number-pad"
                  variant="secondary"
                />
              )}
            />
            <Typography type="body-xs" color="muted" className="mt-1">
              Recommended: 300 for 58mm, 380 for 80mm.
            </Typography>
            <FieldError message={errors.logoWidthDots?.message} />
          </View>

          <Controller
            control={control}
            name="cutReceipt"
            render={({ field: { value, onChange } }) => (
              <Pressable
                className="flex-row items-center justify-between"
                onPress={() => onChange(!value)}
              >
                <View className="flex-1 mr-4">
                  <Typography type="body-sm" weight="semibold">
                    Cut receipt after printing
                  </Typography>
                  <Typography type="body-xs" color="muted" className="mt-0.5">
                    Only enable this option if your printer supports it.
                  </Typography>
                </View>
                <Switch isSelected={value} onSelectedChange={onChange} />
              </Pressable>
            )}
          />

          <Controller
            control={control}
            name="openDrawer"
            render={({ field: { value, onChange } }) => (
              <Pressable
                className="flex-row items-center justify-between"
                onPress={() => onChange(!value)}
              >
                <View className="flex-1 mr-4">
                  <Typography type="body-sm" weight="semibold">
                    Open drawer after printing
                  </Typography>
                  <Typography type="body-xs" color="muted" className="mt-0.5">
                    Only enable this option if your printer supports it.
                  </Typography>
                </View>
                <Switch isSelected={value} onSelectedChange={onChange} />
              </Pressable>
            )}
          />

          <Button variant="outline" onPress={handleTestConnection} isDisabled={connecting}>
            <Ionicons name="link-outline" size={16} color={themeColorForeground} />
            <Button.Label>{connecting ? "Connecting..." : "Test Connection"}</Button.Label>
          </Button>
          <Button
            variant="outline"
            onPress={handlePrintCalibration}
            isDisabled={printingCalibration || connecting}
          >
            {printingCalibration ? (
              <Spinner size="sm" />
            ) : (
              <Ionicons name="receipt-outline" size={16} color={themeColorForeground} />
            )}
            <Button.Label>
              {printingCalibration ? "Printing calibration..." : "Print Calibration"}
            </Button.Label>
          </Button>
        </ScrollView>

        <View className="px-4 pb-6 pt-3 bg-surface-secondary">
          <Button className="w-full" onPress={handleSubmit(handleSave)} isDisabled={isSubmitting}>
            <Button.Label>{isCreate ? "Save Printer" : "Update Printer"}</Button.Label>
          </Button>
        </View>

        <Dialog isOpen={prompt !== null} onOpenChange={(open) => !open && setPrompt(null)}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
              <Dialog.Close variant="ghost" />
              <View className="mb-5 gap-1.5">
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

        <Dialog isOpen={deletePromptOpen} onOpenChange={setDeletePromptOpen}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
              <Dialog.Close variant="ghost" />
              <View className="mb-5 gap-1.5">
                <Dialog.Title>Delete printer?</Dialog.Title>
                <Dialog.Description>
                  This printer will be removed from saved printers.
                </Dialog.Description>
              </View>
              <View className="flex-row justify-end gap-3">
                <Button variant="ghost" size="sm" onPress={() => setDeletePromptOpen(false)}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button variant="danger" size="sm" onPress={handleDelete}>
                  <Button.Label>Delete</Button.Label>
                </Button>
              </View>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </View>
    </>
  );
}

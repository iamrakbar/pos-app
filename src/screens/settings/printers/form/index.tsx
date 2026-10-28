import {
  Typography,
  Separator,
  Button as PanelButton,
  Dialog as PanelDialog,
  Input as PanelInput,
  Label as PanelLabel,
  Switch as PanelSwitch,
  Select as PanelSelect,
  EmptyState,
  Card,
  cn,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import {
  BLEPrinter,
  NetPrinter,
  type IBLEPrinter,
  type INetPrinter,
} from "@haroldtran/react-native-thermal-printer";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  Controller,
  useController,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormReset,
  type UseFormSetValue,
} from "react-hook-form";
import { Linking, PermissionsAndroid, Platform, Pressable, View } from "react-native";
import { createPrinterSchema, type PrinterFormValues } from "@/schemas/printer";
import {
  DEFAULT_PRINTER_SETTINGS,
  usePrinterStore,
  type ConnectionType,
  type PaperWidth,
  type PrinterSettings,
} from "@/stores/use-printer-store";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { printCalibrationReceipt } from "@/services/printer/print-service";
import { useLocalizedNumberInput } from "@/hooks/use-localized-number-input";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

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
const INTEGER_FORMAT = {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header className="p-0">
      <View className="gap-1">
        <Card.Title>{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </View>
    </Card.Header>
  );
}

function toPrinterSettings(values: PrinterFormValues): PrinterSettings {
  return {
    ...values,
    port: values.port || PORT,
  };
}

type PrinterFieldsProps = {
  control: Control<PrinterFormValues>;
  errors: FieldErrors<PrinterFormValues>;
  setValue: UseFormSetValue<PrinterFormValues>;
};

function PrinterDetailsCard({
  control,
  errors,
  setValue,
  onConnectionChange,
}: PrinterFieldsProps & {
  onConnectionChange: (connection: ConnectionType) => void;
}) {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();

  return (
    <Card className="p-4">
      <SectionHeading
        title={t("printerForm.details")}
        description={t("printerForm.detailsDescription")}
      />
      <Card.Content className="gap-4 p-0">
        <View>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <PanelInput
                label={t("printerForm.name")}
                isRequired
                errorMessage={errors.name?.message}
                value={value}
                onChangeText={onChange}
                placeholder={t("printerForm.namePlaceholder")}
                variant="filled"
              />
            )}
          />
        </View>

        <View>
          <PanelLabel isRequired className="mb-1.5">
            {t("printerForm.connection")}
          </PanelLabel>
          <Controller
            control={control}
            name="connection"
            render={({ field: { value, onChange } }) => (
              <PanelSelect
                triggerClassName="h-12"
                value={value}
                presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
                placeholder={t("printerForm.selectConnection")}
                title={t("printerForm.connectionType")}
                onValueChange={(next) => {
                  onChange(next);
                  setValue("selectedDeviceId", "", { shouldDirty: true });
                  setValue("macAddress", "", { shouldDirty: true, shouldValidate: true });
                  onConnectionChange(next as ConnectionType);
                }}
              >
                {CONNECTION_TYPES.map((option) => (
                  <PanelSelect.Item key={option.value} {...option} />
                ))}
              </PanelSelect>
            )}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

function PrinterConnectionCard({
  control,
  errors,
  connection,
  devices,
  scanning,
  selectedDeviceId,
  colors,
  onScan,
  onSelectDevice,
}: Pick<PrinterFieldsProps, "control" | "errors"> & {
  connection: ConnectionType;
  devices: DiscoveredDevice[];
  scanning: boolean;
  selectedDeviceId: string;
  colors: { muted: string; foreground: string; accent: string };
  onScan: () => void;
  onSelectDevice: (device: DiscoveredDevice) => void;
}) {
  const { t } = useTranslation();
  const {
    field: {
      value: portFieldValue,
      onChange: portFieldChange,
      onBlur: portFieldBlur,
      ref: portFieldRef,
    },
  } = useController({ control, name: "port" });
  const { localizedInputProps: portInput } = useLocalizedNumberInput({
    value: portFieldValue,
    onChange: portFieldChange,
    formatOptions: INTEGER_FORMAT,
    minValue: 1,
    maxValue: 65535,
    inputProps: { onBlur: portFieldBlur },
  });

  return (
    <Card className="p-4">
      <SectionHeading
        title={t("printerForm.connection")}
        description={
          connection === "bluetooth"
            ? t("printerForm.connectionBluetoothDescription")
            : t("printerForm.connectionNetworkDescription")
        }
      />
      <Card.Content className="gap-4 p-0">
        {connection === "bluetooth" ? (
          <View className="gap-3">
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <PanelLabel>{t("printerForm.device")}</PanelLabel>
                <PanelButton
                  variant="ghost"
                  size="icon"

                  onPress={onScan}
                  disabled={scanning}
                  accessibilityLabel={t("printerForm.scanAccessibility")}
                >
                  <AppIcon icon={AppIcons.refresh} size={18} color={colors.foreground} />
                </PanelButton>
              </View>

              <View className="bg-surface-secondary rounded-2xl overflow-hidden">
                {scanning ? (
                  <View className="py-6 items-center">
                    <Typography type="body-sm" muted>
                      {t("printerForm.scanning")}
                    </Typography>
                  </View>
                ) : devices.length === 0 ? (
                  <EmptyState className="px-4 py-6">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <AppIcon icon={AppIcons.bluetooth} size={20} color={colors.foreground} />
                      </EmptyState.Media>
                      <EmptyState.Title>{t("printerForm.noBluetoothPrinters")}</EmptyState.Title>
                      <EmptyState.Description>
                        {t("printerForm.noBluetoothPrintersDescription")}
                      </EmptyState.Description>
                    </EmptyState.Header>
                  </EmptyState>
                ) : (
                  devices.map((device, index) => (
                    <React.Fragment key={device.id}>
                      <Pressable
                        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-tertiary"
                        onPress={() => onSelectDevice(device)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selectedDeviceId === device.id }}
                        accessibilityLabel={t("printerForm.selectDeviceAccessibility", {
                          device: device.name,
                        })}
                      >
                        <AppIcon
                          icon={
                            selectedDeviceId === device.id ? AppIcons.radioOn : AppIcons.radioOff
                          }
                          size={20}
                          color={selectedDeviceId === device.id ? colors.accent : colors.muted}
                        />
                        <View className="flex-1">
                          <Typography type="body-sm" weight="medium" numberOfLines={1}>
                            {device.name}
                          </Typography>
                          <Typography type="body-xs" muted numberOfLines={1}>
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
              <Controller
                control={control}
                name="macAddress"
                render={({ field: { value, onChange } }) => (
                  <PanelInput
                    label={t("printerForm.macAddress")}
                    errorMessage={errors.macAddress?.message}
                    value={value}
                    onChangeText={onChange}
                    placeholder="00:00:00:00:00:00"
                    autoCapitalize="characters"
                    variant="filled"
                  />
                )}
              />
            </View>
          </View>
        ) : (
          <View className="gap-5">
            <View>
              <Controller
                control={control}
                name="ipAddress"
                render={({ field: { value, onChange } }) => (
                  <PanelInput
                    label={t("printerForm.ipAddress")}
                    isRequired
                    errorMessage={errors.ipAddress?.message}
                    value={value}
                    onChangeText={onChange}
                    placeholder="192.168.1.100"
                    keyboardType="decimal-pad"
                    variant="filled"
                  />
                )}
              />
            </View>

            <View>
              <PanelInput
                ref={portFieldRef}
                label={t("printerForm.port")}
                placeholder={PORT}
                variant="filled"
                isRequired
                errorMessage={errors.port?.message}
                keyboardType="numeric"
                {...portInput}
              />
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

function ReceiptSetupCard({
  control,
  errors,
  setValue,
  paperWidth,
}: PrinterFieldsProps & { paperWidth: PaperWidth }) {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const {
    field: {
      value: charactersFieldValue,
      onChange: charactersFieldChange,
      onBlur: charactersFieldBlur,
      ref: charactersFieldRef,
    },
  } = useController({ control, name: "charactersPerLine" });
  const {
    field: {
      value: logoWidthFieldValue,
      onChange: logoWidthFieldChange,
      onBlur: logoWidthFieldBlur,
      ref: logoWidthFieldRef,
    },
  } = useController({ control, name: "logoWidthDots" });
  const { localizedInputProps: charactersInput } = useLocalizedNumberInput({
    value: charactersFieldValue,
    onChange: charactersFieldChange,
    formatOptions: INTEGER_FORMAT,
    minValue: 24,
    maxValue: 64,
    inputProps: { onBlur: charactersFieldBlur },
  });
  const { localizedInputProps: logoWidthInput } = useLocalizedNumberInput({
    value: logoWidthFieldValue,
    onChange: logoWidthFieldChange,
    formatOptions: INTEGER_FORMAT,
    minValue: 100,
    maxValue: paperWidth === "80mm" ? 280 : 200,
    inputProps: { onBlur: logoWidthFieldBlur },
  });

  return (
    <Card className="p-4">
      <SectionHeading
        title={t("printerForm.receiptSetup")}
        description={t("printerForm.receiptSetupDescription")}
      />
      <Card.Content className="gap-4 p-0">
        <View>
          <PanelLabel isRequired className="mb-1.5">
            {t("printerForm.receiptSize")}
          </PanelLabel>
          <Controller
            control={control}
            name="paperWidth"
            render={({ field: { value, onChange } }) => (
              <PanelSelect
                triggerClassName="h-12"
                value={value}
                presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
                placeholder={t("printerForm.selectSize")}
                title={t("printerForm.receiptSize")}
                onValueChange={(next) => {
                  onChange(next);
                  setValue("charactersPerLine", next === "80mm" ? "46" : "32", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("logoWidthDots", next === "80mm" ? "280" : "200", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                {PAPER_WIDTHS.map((option) => (
                  <PanelSelect.Item key={option.value} {...option} />
                ))}
              </PanelSelect>
            )}
          />
        </View>

        <View>
          <PanelInput
            ref={charactersFieldRef}
            label={t("printerForm.charactersPerLine")}
            description={t("printerForm.charactersRecommendation")}
            errorMessage={errors.charactersPerLine?.message}
            placeholder={paperWidth === "80mm" ? "46" : "32"}
            variant="filled"
            isRequired
            keyboardType="numeric"
            {...charactersInput}
          />
        </View>

        <View>
          <PanelInput
            ref={logoWidthFieldRef}
            label={t("printerForm.logoWidth")}
            description={t("printerForm.logoRecommendation")}
            errorMessage={errors.logoWidthDots?.message}
            placeholder={paperWidth === "80mm" ? "280" : "200"}
            variant="filled"
            isRequired
            keyboardType="numeric"
            {...logoWidthInput}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

function HardwareOptionsCard({ control }: Pick<PrinterFieldsProps, "control">) {
  const { t } = useTranslation();

  return (
    <Card className="p-4">
      <SectionHeading
        title={t("printerForm.hardwareOptions")}
        description={t("printerForm.hardwareDescription")}
      />
      <Card.Content className="gap-4 p-0">
        {(["cutReceipt", "openDrawer"] as const).map((name, index) => (
          <React.Fragment key={name}>
            {index > 0 ? <Separator /> : null}
            <Controller
              control={control}
              name={name}
              render={({ field: { value, onChange } }) => (
                <Pressable
                  className="flex-row items-center justify-between"
                  onPress={() => onChange(!value)}
                >
                  <View className="flex-1 mr-4">
                    <Typography type="body-sm" weight="semibold">
                      {name === "cutReceipt"
                        ? t("printerForm.cutReceipt")
                        : t("printerForm.openDrawer")}
                    </Typography>
                    <Typography type="body-xs" muted className="mt-0.5">
                      {t("printerForm.hardwareOptionDescription")}
                    </Typography>
                  </View>
                  <PanelSwitch
                    value={value}
                    onValueChange={onChange}
                    accessibilityLabel={
                      name === "cutReceipt"
                        ? t("printerForm.cutReceipt")
                        : t("printerForm.openDrawer")
                    }
                  />
                </Pressable>
              )}
            />
          </React.Fragment>
        ))}
      </Card.Content>
    </Card>
  );
}

function PrinterDiagnosticsCard({
  connecting,
  printingCalibration,
  foregroundColor,
  onTestConnection,
  onPrintCalibration,
}: {
  connecting: boolean;
  printingCalibration: boolean;
  foregroundColor: string;
  onTestConnection: () => void;
  onPrintCalibration: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 p-4">
      <SectionHeading
        title={t("printerForm.diagnostics")}
        description={t("printerForm.diagnosticsDescription")}
      />
      <Card.Content className="gap-3 p-0">
        <PanelButton
          variant="outline"
          onPress={onTestConnection}
          disabled={connecting}
          startContent={<AppIcon icon={AppIcons.link} size={16} color={foregroundColor} />}
        >
          {connecting ? t("printerForm.connecting") : t("printerForm.testConnection")}
        </PanelButton>
        <PanelButton
          variant="outline"
          onPress={onPrintCalibration}
          disabled={printingCalibration || connecting}
          loading={printingCalibration}
          startContent={<AppIcon icon={AppIcons.receipt} size={16} color={foregroundColor} />}
        >
          {printingCalibration
            ? t("printerForm.printingCalibration")
            : t("printerForm.printCalibration")}
        </PanelButton>
      </Card.Content>
    </Card>
  );
}

async function openAppSettings() {
  await Linking.openSettings();
}

async function openBluetoothSettings() {
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
}

function getBluetoothPermissions() {
  if (Platform.OS !== "android") return [];

  if (Number(Platform.Version) >= 31) {
    return [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ];
  }

  return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

async function requestBluetoothPermissions(
  setPrompt: React.Dispatch<React.SetStateAction<PromptState | null>>,
  t: Translate
) {
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
      title: t("printer.permissionRequired"),
      message: blocked ? t("printerForm.permissionBlocked") : t("printerForm.permissionRequired"),
      actionLabel: t("printer.openSettings"),
      onAction: openAppSettings,
    });
  }

  return granted;
}

function PrinterDialogs({
  prompt,
  deletePromptOpen,
  setPrompt,
  setDeletePromptOpen,
  onDelete,
}: {
  prompt: PromptState | null;
  deletePromptOpen: boolean;
  setPrompt: React.Dispatch<React.SetStateAction<PromptState | null>>;
  setDeletePromptOpen: (open: boolean) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const handlePromptAction = async () => {
    const action = prompt?.onAction;
    setPrompt(null);
    await action?.();
  };

  return (
    <>
      <PanelDialog open={prompt !== null} onOpenChange={(open) => !open && setPrompt(null)}>
        <PanelDialog.Content>
          <PanelDialog.Title>{prompt?.title}</PanelDialog.Title>
          {prompt?.message ? (
            <PanelDialog.Description>{prompt.message}</PanelDialog.Description>
          ) : null}
          <PanelDialog.Footer>
            <PanelDialog.Close>
              <PanelButton variant="ghost" size="sm">
                {prompt?.actionLabel ? t("common.cancel") : t("common.close")}
              </PanelButton>
            </PanelDialog.Close>
            {prompt?.actionLabel ? (
              <PanelButton size="sm" onPress={handlePromptAction}>
                {prompt.actionLabel}
              </PanelButton>
            ) : null}
          </PanelDialog.Footer>
        </PanelDialog.Content>
      </PanelDialog>
      <PanelDialog open={deletePromptOpen} onOpenChange={setDeletePromptOpen}>
        <PanelDialog.Content>
          <PanelDialog.Title>{t("printerForm.deleteTitle")}</PanelDialog.Title>
          <PanelDialog.Description>{t("printerForm.deleteDescription")}</PanelDialog.Description>
          <PanelDialog.Footer>
            <PanelDialog.Close>
              <PanelButton variant="ghost" size="sm">
                {t("common.cancel")}
              </PanelButton>
            </PanelDialog.Close>
            <PanelButton variant="destructive" size="sm" onPress={onDelete}>
              {t("common.delete")}
            </PanelButton>
          </PanelDialog.Footer>
        </PanelDialog.Content>
      </PanelDialog>
    </>
  );
}

function useSyncPrinterForm({
  hasHydrated,
  isCreate,
  printer,
  reset,
}: {
  hasHydrated: boolean;
  isCreate: boolean;
  printer: PrinterSettings | undefined;
  reset: UseFormReset<PrinterFormValues>;
}) {
  const router = useRouter();

  React.useEffect(() => {
    if (hasHydrated && !isCreate && !printer) {
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
}

function initializeConnection(
  connection: ConnectionType,
  clearDevices: () => void,
  scan: () => Promise<void>
) {
  if (connection === "bluetooth") {
    void scan();
  } else {
    clearDevices();
    void NetPrinter.init().catch(() => undefined);
  }
}

async function printCalibration(
  values: PrinterFormValues,
  setPrompt: React.Dispatch<React.SetStateAction<PromptState | null>>,
  setPrinting: (printing: boolean) => void,
  t: Translate
) {
  setPrinting(true);
  try {
    await printCalibrationReceipt(toPrinterSettings(values));
    setPrompt({
      title: t("printerForm.calibrationSent"),
      message: t("printerForm.calibrationSentDescription"),
    });
  } catch (error) {
    setPrompt({
      title: t("printerForm.calibrationFailed"),
      message:
        error instanceof Error ? error.message : t("printerForm.calibrationFailedDescription"),
    });
  }
  setPrinting(false);
}

type PrinterFormViewProps = PrinterFieldsProps & {
  isCreate: boolean;
  isCompact: boolean;
  connection: ConnectionType;
  devices: DiscoveredDevice[];
  scanning: boolean;
  selectedDeviceId: string;
  paperWidth: PaperWidth;
  connecting: boolean;
  printingCalibration: boolean;
  isSubmitting: boolean;
  colors: { muted: string; foreground: string; accent: string; danger: string };
  prompt: PromptState | null;
  deletePromptOpen: boolean;
  setPrompt: React.Dispatch<React.SetStateAction<PromptState | null>>;
  setDeletePromptOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConnectionChange: (connection: ConnectionType) => void;
  onScan: () => void;
  onSelectDevice: (device: DiscoveredDevice) => void;
  onTestConnection: () => void;
  onPrintCalibration: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void | Promise<void>;
};

function PrinterFormView(props: PrinterFormViewProps) {
  const { t } = useTranslation();
  const {
    control,
    errors,
    setValue,
    isCreate,
    isCompact,
    connection,
    devices,
    scanning,
    selectedDeviceId,
    paperWidth,
    connecting,
    printingCalibration,
    isSubmitting,
    colors,
    prompt,
    deletePromptOpen,
    setPrompt,
    setDeletePromptOpen,
  } = props;

  return (
    <>
      <Stack.Screen
        options={{ title: isCreate ? t("printerForm.addTitle") : t("printerForm.editTitle") }}
      />
      {!isCreate ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            {...getToolbarIcon("trash")}
            tintColor={colors.danger}
            accessibilityLabel={t("printerForm.deleteAccessibility")}
            onPress={() => setDeletePromptOpen(true)}
          />
        </Stack.Toolbar>
      ) : null}
      <View className="flex-1 bg-background">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerClassName="items-center px-4 py-6 pb-10 md:px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-3xl gap-4">
            <PrinterDetailsCard
              control={control}
              errors={errors}
              setValue={setValue}
              onConnectionChange={props.onConnectionChange}
            />
            <PrinterConnectionCard
              control={control}
              errors={errors}
              connection={connection}
              devices={devices}
              scanning={scanning}
              selectedDeviceId={selectedDeviceId}
              colors={colors}
              onScan={props.onScan}
              onSelectDevice={props.onSelectDevice}
            />
            <ReceiptSetupCard
              control={control}
              errors={errors}
              setValue={setValue}
              paperWidth={paperWidth}
            />
            <HardwareOptionsCard control={control} />
            <PrinterDiagnosticsCard
              connecting={connecting}
              printingCalibration={printingCalibration}
              foregroundColor={colors.foreground}
              onTestConnection={props.onTestConnection}
              onPrintCalibration={props.onPrintCalibration}
            />
            <View className="gap-3 pt-2">
              {errors.root?.server?.message ? (
                <Typography type="body-xs" className="text-destructive mt-1">
                  {errors.root.server.message}
                </Typography>
              ) : null}
              <View className={cn("gap-3", !isCompact && "flex-row")}>
                <PanelButton variant="ghost" onPress={props.onCancel}>
                  {t("common.cancel")}
                </PanelButton>
                <PanelButton className="flex-1" onPress={props.onSave} disabled={isSubmitting}>
                  {isCreate ? t("printerForm.save") : t("printerForm.update")}
                </PanelButton>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
        <PrinterDialogs
          prompt={prompt}
          deletePromptOpen={deletePromptOpen}
          setPrompt={setPrompt}
          setDeletePromptOpen={setDeletePromptOpen}
          onDelete={props.onDelete}
        />
      </View>
    </>
  );
}

export default function PrinterFormScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
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
  const [themeColorMuted, themeColorForeground, themeColorAccent, themeColorDanger] =
    useCSSVariable([
      "--color-muted-foreground",
      "--color-foreground",
      "--color-primary",
      "--color-destructive",
    ]) as [string, string, string, string];

  const [devices, setDevices] = React.useState<DiscoveredDevice[]>([]);
  const [scanning, setScanning] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [printingCalibration, setPrintingCalibration] = React.useState(false);
  const [prompt, setPrompt] = React.useState<PromptState | null>(null);
  const [deletePromptOpen, setDeletePromptOpen] = React.useState(false);
  const printerSchema = createPrinterSchema(t);

  const {
    control,
    clearErrors,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema) as never,
    defaultValues: {
      ...DEFAULT_PRINTER_SETTINGS,
      ...(printer ?? {}),
      port: printer?.port || PORT,
    },
  });

  React.useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  const connection = useWatch({ control, name: "connection" });
  const paperWidth = useWatch({ control, name: "paperWidth" });
  const selectedDeviceId = useWatch({ control, name: "selectedDeviceId" });
  const currentName = useWatch({ control, name: "name" });

  useSyncPrinterForm({
    hasHydrated,
    isCreate,
    printer,
    reset,
  });

  const handleScan = async () => {
    setScanning(true);
    setDevices([]);

    try {
      const granted = await requestBluetoothPermissions(setPrompt, t);
      if (granted) {
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
      }
    } catch (err: unknown) {
      setPrompt({
        title: t("printerForm.scanFailed"),
        message: err instanceof Error ? err.message : t("printerForm.scanFailedDescription"),
        actionLabel:
          Platform.OS === "android"
            ? t("printerForm.openBluetoothSettings")
            : t("printer.openSettings"),
        onAction: openBluetoothSettings,
      });
    }
    setScanning(false);
  };

  const handleSelectDevice = (device: DiscoveredDevice) => {
    setValue("selectedDeviceId", device.id, { shouldDirty: true, shouldValidate: true });
    setValue("macAddress", device.id, { shouldDirty: true, shouldValidate: true });
    setValue("name", device.name, { shouldDirty: true, shouldValidate: true });
  };

  const handleSave = (values: PrinterFormValues) => {
    try {
      if (isCreate) {
        const savedPrinter = addPrinter(toPrinterSettings(values));
        selectPrinter(savedPrinter.id);
      } else if (printer) {
        updatePrinter(printer.id, toPrinterSettings(values));
      } else {
        const message = t("printerForm.printerNotFound");
        setError("root.server", { type: "server", message });
        setPrompt({ title: t("printerForm.saveFailed"), message });
        return;
      }
      router.replace("/settings/printers" as never);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("printerForm.saveFailedDescription");
      setError("root.server", { type: "server", message });
      setPrompt({ title: t("printerForm.saveFailed"), message });
    }
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
        const granted = await requestBluetoothPermissions(setPrompt, t);
        if (!granted) {
          setConnecting(false);
          return;
        }
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
        title: t("printerForm.connected"),
        message: t("printerForm.ready", {
          printer: currentName || values.name || t("printerForm.defaultName"),
        }),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("printerForm.connectionFailedDescription");
      setPrompt({
        title: t("printerForm.connectionFailed"),
        message,
        actionLabel:
          values.connection === "bluetooth" && /bluetooth/i.test(message)
            ? Platform.OS === "android"
              ? t("printerForm.openBluetoothSettings")
              : t("printer.openSettings")
            : undefined,
        onAction:
          values.connection === "bluetooth" && /bluetooth/i.test(message)
            ? openBluetoothSettings
            : undefined,
      });
    }
    setConnecting(false);
  });

  const handlePrintCalibration = handleSubmit((values) =>
    printCalibration(values, setPrompt, setPrintingCalibration, t)
  );

  return (
    <PrinterFormView
      control={control}
      errors={errors}
      setValue={setValue}
      isCreate={isCreate}
      isCompact={isCompact}
      connection={connection}
      devices={devices}
      scanning={scanning}
      selectedDeviceId={selectedDeviceId}
      paperWidth={paperWidth}
      connecting={connecting}
      printingCalibration={printingCalibration}
      isSubmitting={isSubmitting}
      colors={{
        muted: themeColorMuted,
        foreground: themeColorForeground,
        accent: themeColorAccent,
        danger: themeColorDanger,
      }}
      prompt={prompt}
      deletePromptOpen={deletePromptOpen}
      setPrompt={setPrompt}
      setDeletePromptOpen={setDeletePromptOpen}
      onConnectionChange={(nextConnection) =>
        initializeConnection(nextConnection, () => setDevices([]), handleScan)
      }
      onScan={handleScan}
      onSelectDevice={handleSelectDevice}
      onTestConnection={handleTestConnection}
      onPrintCalibration={handlePrintCalibration}
      onSave={handleSubmit(handleSave)}
      onCancel={() => router.back()}
      onDelete={handleDelete}
    />
  );
}

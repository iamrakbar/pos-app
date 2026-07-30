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
  Card,
  Input,
  Select,
  Separator,
  Spinner,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import React from "react";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormReset,
  type UseFormSetValue,
} from "react-hook-form";
import { Linking, PermissionsAndroid, Platform, Pressable, ScrollView, View } from "react-native";
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
import ActionDialog from "@/components/common/action-dialog";
import StringNumberField from "@/components/common/string-number-field";
import { EmptyState } from "heroui-native-pro";
import { useTranslation } from "@/stores/use-locale";
import type { Translate } from "@/locales";

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

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Card.Header>
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
    <Card>
      <SectionHeading
        title={t("printerForm.details")}
        description={t("printerForm.detailsDescription")}
      />
      <Card.Body className="gap-4">
        <View>
          <FieldLabel label={t("printerForm.name")} required />
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={t("printerForm.namePlaceholder")}
                variant="secondary"
              />
            )}
          />
          <FieldError message={errors.name?.message} />
        </View>

        <View>
          <FieldLabel label={t("printerForm.connection")} required />
          <Controller
            control={control}
            name="connection"
            render={({ field: { value, onChange } }) => (
              <Select
                presentation={choicePresentation}
                value={CONNECTION_TYPES.find((item) => item.value === value)}
                onValueChange={(option) => {
                  if (!option) return;
                  const nextConnection = option.value as ConnectionType;
                  onChange(nextConnection);
                  setValue("selectedDeviceId", "", { shouldDirty: true });
                  setValue("macAddress", "", { shouldDirty: true, shouldValidate: true });
                  onConnectionChange(nextConnection);
                }}
              >
                <Select.Trigger>
                  <Select.Value placeholder={t("printerForm.selectConnection")} numberOfLines={1} />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content
                    presentation={choicePresentation}
                    width={choicePresentation === "popover" ? "trigger" : undefined}
                  >
                    <Select.ListLabel className="mb-2">
                      {t("printerForm.connectionType")}
                    </Select.ListLabel>
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
      </Card.Body>
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

  return (
    <Card>
      <SectionHeading
        title={t("printerForm.connection")}
        description={
          connection === "bluetooth"
            ? t("printerForm.connectionBluetoothDescription")
            : t("printerForm.connectionNetworkDescription")
        }
      />
      <Card.Body className="gap-4">
        {connection === "bluetooth" ? (
          <View className="gap-3">
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <FieldLabel label={t("printerForm.device")} />
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={onScan}
                  isDisabled={scanning}
                  accessibilityLabel={t("printerForm.scanAccessibility")}
                >
                  <Ionicons name="refresh" size={18} color={colors.foreground} />
                </Button>
              </View>

              <View className="bg-surface-secondary rounded-panel overflow-hidden">
                {scanning ? (
                  <View className="py-6 items-center">
                    <Typography type="body-sm" color="muted">
                      {t("printerForm.scanning")}
                    </Typography>
                  </View>
                ) : devices.length === 0 ? (
                  <EmptyState className="px-4 py-6">
                    <EmptyState.Header>
                      <EmptyState.Media variant="icon">
                        <Ionicons name="bluetooth-outline" size={20} color={colors.foreground} />
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
                        <Ionicons
                          name={
                            selectedDeviceId === device.id ? "radio-button-on" : "radio-button-off"
                          }
                          size={20}
                          color={selectedDeviceId === device.id ? colors.accent : colors.muted}
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
              <FieldLabel label={t("printerForm.macAddress")} />
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
              <FieldLabel label={t("printerForm.ipAddress")} required />
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
              <Controller
                control={control}
                name="port"
                render={({ field: { value, onChange } }) => (
                  <StringNumberField
                    label={t("printerForm.port")}
                    value={value}
                    onChange={onChange}
                    placeholder={PORT}
                    inputVariant="secondary"
                    minValue={1}
                    maxValue={65535}
                    isRequired
                    isInvalid={Boolean(errors.port)}
                  />
                )}
              />
              <FieldError message={errors.port?.message} />
            </View>
          </View>
        )}
      </Card.Body>
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

  return (
    <Card>
      <SectionHeading
        title={t("printerForm.receiptSetup")}
        description={t("printerForm.receiptSetupDescription")}
      />
      <Card.Body className="gap-4">
        <View>
          <FieldLabel label={t("printerForm.receiptSize")} required />
          <Controller
            control={control}
            name="paperWidth"
            render={({ field: { value, onChange } }) => (
              <Select
                presentation={choicePresentation}
                value={PAPER_WIDTHS.find((item) => item.value === value)}
                onValueChange={(option) => {
                  if (!option) return;
                  onChange(option.value);
                  setValue("charactersPerLine", option.value === "80mm" ? "46" : "32", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("logoWidthDots", option.value === "80mm" ? "280" : "200", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <Select.Trigger>
                  <Select.Value placeholder={t("printerForm.selectSize")} numberOfLines={1} />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content
                    presentation={choicePresentation}
                    width={choicePresentation === "popover" ? "trigger" : undefined}
                  >
                    <Select.ListLabel className="mb-2">
                      {t("printerForm.receiptSize")}
                    </Select.ListLabel>
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
          <Controller
            control={control}
            name="charactersPerLine"
            render={({ field: { value, onChange } }) => (
              <StringNumberField
                label={t("printerForm.charactersPerLine")}
                value={value}
                onChange={onChange}
                placeholder={paperWidth === "80mm" ? "46" : "32"}
                inputVariant="secondary"
                minValue={24}
                maxValue={64}
                isRequired
                isInvalid={Boolean(errors.charactersPerLine)}
              />
            )}
          />
          <Typography type="body-xs" color="muted" className="mt-1">
            {t("printerForm.charactersRecommendation")}
          </Typography>
          <FieldError message={errors.charactersPerLine?.message} />
        </View>

        <View>
          <Controller
            control={control}
            name="logoWidthDots"
            render={({ field: { value, onChange } }) => (
              <StringNumberField
                label={t("printerForm.logoWidth")}
                value={value}
                onChange={onChange}
                placeholder={paperWidth === "80mm" ? "280" : "200"}
                inputVariant="secondary"
                minValue={100}
                maxValue={paperWidth === "80mm" ? 280 : 200}
                step={10}
                isRequired
                isInvalid={Boolean(errors.logoWidthDots)}
              />
            )}
          />
          <Typography type="body-xs" color="muted" className="mt-1">
            {t("printerForm.logoRecommendation")}
          </Typography>
          <FieldError message={errors.logoWidthDots?.message} />
        </View>
      </Card.Body>
    </Card>
  );
}

function HardwareOptionsCard({ control }: Pick<PrinterFieldsProps, "control">) {
  const { t } = useTranslation();

  return (
    <Card>
      <SectionHeading
        title={t("printerForm.hardwareOptions")}
        description={t("printerForm.hardwareDescription")}
      />
      <Card.Body className="gap-4">
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
                    <Typography type="body-xs" color="muted" className="mt-0.5">
                      {t("printerForm.hardwareOptionDescription")}
                    </Typography>
                  </View>
                  <Switch isSelected={value} onSelectedChange={onChange} />
                </Pressable>
              )}
            />
          </React.Fragment>
        ))}
      </Card.Body>
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
    <Card className="gap-3">
      <SectionHeading
        title={t("printerForm.diagnostics")}
        description={t("printerForm.diagnosticsDescription")}
      />
      <Card.Body className="gap-3">
        <Button variant="outline" onPress={onTestConnection} isDisabled={connecting}>
          <Ionicons name="link-outline" size={16} color={foregroundColor} />
          <Button.Label>
            {connecting ? t("printerForm.connecting") : t("printerForm.testConnection")}
          </Button.Label>
        </Button>
        <Button
          variant="outline"
          onPress={onPrintCalibration}
          isDisabled={printingCalibration || connecting}
        >
          {printingCalibration ? (
            <Spinner size="sm" />
          ) : (
            <Ionicons name="receipt-outline" size={16} color={foregroundColor} />
          )}
          <Button.Label>
            {printingCalibration
              ? t("printerForm.printingCalibration")
              : t("printerForm.printCalibration")}
          </Button.Label>
        </Button>
      </Card.Body>
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
      <ActionDialog
        isOpen={prompt !== null}
        onOpenChange={(open) => !open && setPrompt(null)}
        title={prompt?.title}
        description={prompt?.message}
        cancelLabel={prompt?.actionLabel ? t("common.cancel") : t("common.close")}
        actionLabel={prompt?.actionLabel}
        onAction={handlePromptAction}
      />

      <ActionDialog
        isOpen={deletePromptOpen}
        onOpenChange={setDeletePromptOpen}
        title={t("printerForm.deleteTitle")}
        description={t("printerForm.deleteDescription")}
        actionLabel={t("common.delete")}
        actionVariant="danger"
        onAction={onDelete}
      />
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
        <ScrollView
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
                <FieldError message={errors.root.server.message} />
              ) : null}
              <View className={`gap-3 ${isCompact ? "" : "flex-row"}`}>
                <Button variant="ghost" onPress={props.onCancel}>
                  <Button.Label>{t("common.cancel")}</Button.Label>
                </Button>
                <Button className="flex-1" onPress={props.onSave} isDisabled={isSubmitting}>
                  <Button.Label>
                    {isCreate ? t("printerForm.save") : t("printerForm.update")}
                  </Button.Label>
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
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
  const [themeColorMuted, themeColorForeground, themeColorAccent, themeColorDanger] = useThemeColor(
    ["muted", "foreground", "accent", "danger"]
  );

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

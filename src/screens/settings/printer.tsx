import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Alert,
    Button,
    Card,
    Chip,
    Select,
    Separator,
    Spinner,
    Typography,
} from 'heroui-native';
import React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

// ─── Types & constants ────────────────────────────────────────────────────────

type PrinterType = 'ble' | 'net' | 'usb';
type PaperWidth = '58mm' | '80mm';
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

const PRINTER_TYPES: { value: PrinterType; label: string }[] = [
    { value: 'ble', label: 'BLE (Bluetooth)' },
    { value: 'net', label: 'Network (TCP/IP)' },
    { value: 'usb', label: 'USB' },
];

const PAPER_WIDTHS: { value: PaperWidth; label: string }[] = [
    { value: '58mm', label: '58 mm' },
    { value: '80mm', label: '80 mm' },
];

// ─── Status config ────────────────────────────────────────────────────────────

type StatusConfig = {
    label: string;
    color: 'success' | 'danger' | 'default' | 'warning' | 'accent';
    icon: React.ReactNode;
};

// ─── Mock discovered device ───────────────────────────────────────────────────

type DiscoveredDevice = { id: string; name: string };

const MOCK_BLE_DEVICES: DiscoveredDevice[] = [
    { id: 'aa:bb:cc:dd:ee:01', name: 'TP-BT58A' },
    { id: 'aa:bb:cc:dd:ee:02', name: 'RPP300BT' },
];

const MOCK_USB_DEVICES: DiscoveredDevice[] = [
    { id: 'usb-1234-5678', name: 'EPSON TM-T82X' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrinterSettingsScreen(): React.JSX.Element {
    const router = useRouter();

    const [printerType, setPrinterType] = React.useState<PrinterType>('ble');
    const [paperWidth, setPaperWidth] = React.useState<PaperWidth>('58mm');
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>('idle');
    const [selectedDeviceId, setSelectedDeviceId] = React.useState('');
    const [scanning, setScanning] = React.useState(false);
    const [devices, setDevices] = React.useState<DiscoveredDevice[]>(MOCK_BLE_DEVICES);
    const [netHost, setNetHost] = React.useState('192.168.0.101');
    const [netPort, setNetPort] = React.useState('9100');

    const isConnected = connectionStatus === 'connected';

    const statusConfig: Record<ConnectionStatus, StatusConfig> = {
        idle: {
            label: 'Not connected',
            color: 'default',
            icon: <Ionicons name="wifi-outline" size={12} />,
        },
        connecting: {
            label: 'Connecting…',
            color: 'warning',
            icon: <Spinner size="sm" />,
        },
        connected: {
            label: 'Connected',
            color: 'success',
            icon: <Ionicons name="checkmark-circle-outline" size={12} />,
        },
        error: {
            label: 'Failed',
            color: 'danger',
            icon: <Ionicons name="close-circle-outline" size={12} />,
        },
    };
    const status = statusConfig[connectionStatus];

    // ─── Handlers (no-op for UI) ──────────────────────────────────────────────

    const handleScan = () => {
        setScanning(true);
        setDevices([]);
        setSelectedDeviceId('');
        setConnectionStatus('idle');
        setTimeout(() => {
            setDevices(printerType === 'usb' ? MOCK_USB_DEVICES : MOCK_BLE_DEVICES);
            setScanning(false);
        }, 1500);
    };

    const handleConnect = () => {
        setConnectionStatus('connecting');
        setTimeout(() => setConnectionStatus('connected'), 1200);
    };

    const handleDisconnect = () => {
        setConnectionStatus('idle');
        setSelectedDeviceId('');
    };

    const handlePrinterTypeChange = (type: PrinterType) => {
        setPrinterType(type);
        setConnectionStatus('idle');
        setSelectedDeviceId('');
        setDevices(type === 'usb' ? MOCK_USB_DEVICES : MOCK_BLE_DEVICES);
    };

    const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="p-4 gap-4 pb-10"
            keyboardShouldPersistTaps="handled"
        >
            {/* Back row */}
            <Pressable
                onPress={() => router.back()}
                className="flex-row items-center gap-1 self-start active:opacity-70"
            >
                <Ionicons name="chevron-back" size={18} color="hsl(var(--primary))" />
                <Typography className="text-sm text-primary">Settings</Typography>
            </Pressable>

            {/* ── Configuration ── */}
            <Card>
                <Card.Header>
                    <Card.Title>Configuration</Card.Title>
                </Card.Header>
                <Card.Body className="gap-4">
                    {/* Printer type */}
                    <View className="gap-1.5">
                        <Card.Description className="text-xs font-semibold uppercase tracking-wide">
                            Printer type
                        </Card.Description>
                        <Select
                            value={PRINTER_TYPES.find((t) => t.value === printerType)}
                            onValueChange={(opt) => {
                                if (opt) handlePrinterTypeChange(opt.value as PrinterType);
                            }}
                        >
                            <Select.Trigger>
                                <Select.Value placeholder="Select type" numberOfLines={1} />
                                <Select.TriggerIndicator />
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Overlay />
                                <Select.Content presentation="popover" width="trigger">
                                    <Select.ListLabel className="mb-2">Printer type</Select.ListLabel>
                                    {PRINTER_TYPES.map((t, i, arr) => (
                                        <React.Fragment key={t.value}>
                                            <Select.Item value={t.value} label={t.label} />
                                            {i < arr.length - 1 && <Separator />}
                                        </React.Fragment>
                                    ))}
                                </Select.Content>
                            </Select.Portal>
                        </Select>
                    </View>

                    {/* Paper width */}
                    <View className="gap-1.5">
                        <Card.Description className="text-xs font-semibold uppercase tracking-wide">
                            Paper width
                        </Card.Description>
                        <Select
                            value={PAPER_WIDTHS.find((w) => w.value === paperWidth)}
                            onValueChange={(opt) => {
                                if (opt) setPaperWidth(opt.value as PaperWidth);
                            }}
                        >
                            <Select.Trigger>
                                <Select.Value placeholder="Select paper width" numberOfLines={1} />
                                <Select.TriggerIndicator />
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Overlay />
                                <Select.Content presentation="popover" width="trigger">
                                    <Select.ListLabel className="mb-2">Paper width</Select.ListLabel>
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
                </Card.Body>
            </Card>

            {/* ── Printer / Connection ── */}
            <Card>
                <Card.Header>
                    <View className="flex-row items-center justify-between">
                        <Card.Title>Printer</Card.Title>
                        <Chip color={status.color} size="sm" variant="soft">
                            {status.icon}
                            <Chip.Label className="ml-1">{status.label}</Chip.Label>
                        </Chip>
                    </View>
                </Card.Header>

                <Card.Body className="gap-4">
                    {printerType === 'net' ? (
                        /* ── Network printer ── */
                        <View className="gap-3">
                            <Alert status="default">
                                <Alert.Indicator />
                                <Alert.Content>
                                    <Alert.Title>Network printer</Alert.Title>
                                    <Alert.Description>Enter the IP address and port of your printer.</Alert.Description>
                                </Alert.Content>
                            </Alert>
                            <View className="flex-row gap-3">
                                <View className="flex-1 gap-1.5">
                                    <Card.Description className="text-xs font-semibold uppercase tracking-wide">
                                        IP address
                                    </Card.Description>
                                    <TextInput
                                        value={netHost}
                                        onChangeText={setNetHost}
                                        placeholder="192.168.0.101"
                                        keyboardType="decimal-pad"
                                        className="border border-border rounded-xl h-11 px-3 text-sm text-foreground bg-background"
                                    />
                                </View>
                                <View className="w-24 gap-1.5">
                                    <Card.Description className="text-xs font-semibold uppercase tracking-wide">
                                        Port
                                    </Card.Description>
                                    <TextInput
                                        value={netPort}
                                        onChangeText={setNetPort}
                                        placeholder="9100"
                                        keyboardType="number-pad"
                                        className="border border-border rounded-xl h-11 px-3 text-sm text-foreground bg-background"
                                    />
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* ── BLE / USB device list ── */
                        <View className="gap-1.5">
                            <View className="flex-row items-center justify-between">
                                <Card.Description className="text-xs font-semibold uppercase tracking-wide">
                                    Available devices
                                    {scanning && (
                                        <Card.Description className="text-xs font-normal"> — scanning…</Card.Description>
                                    )}
                                </Card.Description>
                                <Pressable onPress={handleScan} className="active:opacity-70">
                                    <Ionicons
                                        name={scanning ? 'ellipsis-horizontal' : 'refresh-outline'}
                                        size={18}
                                        color="hsl(var(--primary))"
                                    />
                                </Pressable>
                            </View>

                            {scanning ? (
                                <View className="items-center py-6">
                                    <Spinner size="sm" />
                                    <Typography className="text-xs text-muted-foreground mt-2">
                                        Scanning for devices…
                                    </Typography>
                                </View>
                            ) : (
                                <Select
                                    value={
                                        selectedDeviceId
                                            ? { value: selectedDeviceId, label: selectedDevice?.name ?? selectedDeviceId }
                                            : undefined
                                    }
                                    onValueChange={(opt) => {
                                        setSelectedDeviceId(opt?.value ?? '');
                                        setConnectionStatus('idle');
                                    }}
                                >
                                    <Select.Trigger>
                                        <Select.Value
                                            placeholder={devices.length === 0 ? 'No devices found' : 'Select a printer'}
                                            numberOfLines={1}
                                        />
                                        <Select.TriggerIndicator />
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Overlay />
                                        <Select.Content presentation="popover" width="trigger">
                                            <Select.ListLabel className="mb-2">Devices</Select.ListLabel>
                                            {devices.map((device, i, arr) => (
                                                <React.Fragment key={device.id}>
                                                    <Select.Item value={device.id} label={device.name} />
                                                    {i < arr.length - 1 && <Separator />}
                                                </React.Fragment>
                                            ))}
                                        </Select.Content>
                                    </Select.Portal>
                                </Select>
                            )}
                        </View>
                    )}

                    <Separator />

                    {/* Connect / Disconnect */}
                    <View className="flex-row gap-2">
                        <Button
                            className="flex-1"
                            size="sm"
                            isDisabled={
                                (printerType !== 'net' && !selectedDeviceId) ||
                                connectionStatus === 'connecting' ||
                                connectionStatus === 'connected'
                            }
                            onPress={handleConnect}
                        >
                            {connectionStatus === 'connecting' ? (
                                <Spinner size="sm" />
                            ) : (
                                <Ionicons name="power-outline" size={16} color="white" />
                            )}
                            <Button.Label className="ml-1.5">
                                {connectionStatus === 'connecting' ? 'Connecting…' : 'Connect'}
                            </Button.Label>
                        </Button>

                        <Button
                            className="flex-1"
                            size="sm"
                            variant="outline"
                            isDisabled={!isConnected}
                            onPress={handleDisconnect}
                        >
                            <Ionicons
                                name="close-circle-outline"
                                size={16}
                                color={isConnected ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                            />
                            <Button.Label className="ml-1.5">Disconnect</Button.Label>
                        </Button>
                    </View>
                </Card.Body>
            </Card>

            {/* ── Print actions ── */}
            <Card>
                <Card.Header>
                    <View className="flex-row items-center justify-between">
                        <Card.Title>Print Actions</Card.Title>
                        {!isConnected && (
                            <Card.Description className="text-xs">Connect first</Card.Description>
                        )}
                    </View>
                </Card.Header>
                <Card.Body className="gap-2.5">
                    <Button isDisabled={!isConnected} onPress={() => {}}>
                        <Ionicons name="print-outline" size={16} color="white" />
                        <Button.Label className="ml-1.5">Print sample</Button.Label>
                    </Button>
                    <Button isDisabled={!isConnected} variant="outline" onPress={() => {}}>
                        <Ionicons
                            name="receipt-outline"
                            size={16}
                            color={isConnected ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                        />
                        <Button.Label className="ml-1.5">Print test bill</Button.Label>
                    </Button>
                </Card.Body>
            </Card>
        </ScrollView>
    );
}

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Button,
    Select,
    Separator,
    Switch,
    Typography,
} from 'heroui-native';
import React from 'react';
import { Pressable, ScrollView, Switch as RNSwitch, TextInput, View } from 'react-native';

// ─── Types & constants ────────────────────────────────────────────────────────

type ConnectionType = 'bluetooth' | 'wifi';
type PaperWidth = '58mm' | '80mm';

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'wifi', label: 'Wi-Fi / LAN' },
];

const PAPER_WIDTHS: { value: PaperWidth; label: string }[] = [
    { value: '58mm', label: '58mm' },
    { value: '80mm', label: '80mm' },
];

type DiscoveredDevice = { id: string; name: string };

const MOCK_BT_DEVICES: DiscoveredDevice[] = [
    { id: 'amazfit-6f9af', name: 'Amazfit Bip 6-F9AF' },
    { id: '58printer', name: '58Printer' },
    { id: 'nakamichi-tw018enc', name: 'Nakamichi TW018ENC' },
    { id: 'ble-t7-1570-le', name: 'Ble T7+1570-LE' },
];

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
    return (
        <Typography className="text-sm font-semibold text-foreground mb-1.5">
            {label}
        </Typography>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrinterSettingsScreen(): React.JSX.Element {
    const router = useRouter();

    const [connection, setConnection] = React.useState<ConnectionType>('bluetooth');
    const [name, setName] = React.useState('58Printer');
    const [macAddress, setMacAddress] = React.useState('');
    const [ipAddress, setIpAddress] = React.useState('');
    const [paperWidth, setPaperWidth] = React.useState<PaperWidth>('58mm');
    const [cutReceipt, setCutReceipt] = React.useState(false);
    const [openDrawer, setOpenDrawer] = React.useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = React.useState('58printer');
    const [scanning, setScanning] = React.useState(false);
    const [devices, setDevices] = React.useState<DiscoveredDevice[]>(MOCK_BT_DEVICES);

    const handleConnectionChange = (type: ConnectionType) => {
        setConnection(type);
        setSelectedDeviceId('');
    };

    const handleScan = () => {
        setScanning(true);
        setDevices([]);
        setSelectedDeviceId('');
        setTimeout(() => {
            setDevices(MOCK_BT_DEVICES);
            setScanning(false);
        }, 1500);
    };

    const handleSave = () => {
        router.back();
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
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Printer name"
                        className="border border-border rounded-2xl h-12 px-4 text-sm text-foreground bg-content1"
                    />
                </View>

                {/* MAC Address (Bluetooth only) */}
                {connection === 'bluetooth' && (
                    <View>
                        <FieldLabel label="MAC Address" />
                        <TextInput
                            value={macAddress}
                            onChangeText={setMacAddress}
                            placeholder="00:00:00:00:00:00"
                            autoCapitalize="characters"
                            className="border border-border rounded-2xl h-12 px-4 text-sm text-foreground bg-content1"
                        />
                    </View>
                )}

                {/* IP Address (Wi-Fi only) */}
                {connection === 'wifi' && (
                    <View>
                        <FieldLabel label="IP Address" />
                        <TextInput
                            value={ipAddress}
                            onChangeText={setIpAddress}
                            placeholder="192.168.1.100"
                            keyboardType="decimal-pad"
                            className="border border-border rounded-2xl h-12 px-4 text-sm text-foreground bg-content1"
                        />
                    </View>
                )}

                {/* Receipt Size */}
                <View>
                    <FieldLabel label="Receipt Size" />
                    <Select
                        value={PAPER_WIDTHS.find((w) => w.value === paperWidth)}
                        onValueChange={(opt) => {
                            if (opt) setPaperWidth(opt.value as PaperWidth);
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
                    onPress={() => setCutReceipt((v) => !v)}
                >
                    <View className="flex-1 mr-4">
                        <Typography className="text-sm font-semibold text-foreground">
                            Cut receipt after printing
                        </Typography>
                        <Typography className="text-xs text-muted-foreground mt-0.5">
                            Only enable this option if your printer supports it.
                        </Typography>
                    </View>
                    <RNSwitch
                        value={cutReceipt}
                        onValueChange={setCutReceipt}
                    />
                </Pressable>

                {/* Open drawer toggle */}
                <Pressable
                    className="flex-row items-center justify-between"
                    onPress={() => setOpenDrawer((v) => !v)}
                >
                    <View className="flex-1 mr-4">
                        <Typography className="text-sm font-semibold text-foreground">
                            Open drawer after printing
                        </Typography>
                        <Typography className="text-xs text-muted-foreground mt-0.5">
                            Only enable this option if your printer supports it.
                        </Typography>
                    </View>
                    <RNSwitch
                        value={openDrawer}
                        onValueChange={setOpenDrawer}
                    />
                </Pressable>

                {/* Device list (Bluetooth only) */}
                {connection === 'bluetooth' && (
                    <View>
                        <View className="flex-row items-center justify-between mb-2">
                            <FieldLabel label="Device" />
                            <Pressable
                                onPress={handleScan}
                                disabled={scanning}
                                className="active:opacity-60 p-1"
                            >
                                <Ionicons
                                    name="refresh"
                                    size={18}
                                    color="hsl(var(--foreground))"
                                />
                            </Pressable>
                        </View>

                        <View className="bg-content1 rounded-2xl overflow-hidden border border-border">
                            {scanning ? (
                                <View className="py-6 items-center">
                                    <Typography className="text-sm text-muted-foreground">
                                        Scanning…
                                    </Typography>
                                </View>
                            ) : (
                                devices.map((device, i) => (
                                    <React.Fragment key={device.id}>
                                        <Pressable
                                            className="flex-row items-center justify-between px-4 py-3.5 active:opacity-70"
                                            onPress={() => setSelectedDeviceId(device.id)}
                                        >
                                            <Typography className="text-sm font-medium text-foreground">
                                                {device.name}
                                            </Typography>
                                            {selectedDeviceId === device.id && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="hsl(var(--foreground))"
                                                />
                                            )}
                                        </Pressable>
                                        {i < devices.length - 1 && (
                                            <View className="h-px bg-border mx-4" />
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Save button */}
            <View className="px-4 pb-6 pt-2 bg-background border-t border-border">
                <Button className="w-full" onPress={handleSave}>
                    <Button.Label>SAVE</Button.Label>
                </Button>
            </View>
        </View>
    );
}

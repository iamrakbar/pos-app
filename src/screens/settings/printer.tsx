import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Button,
    Input,
    Select,
    Separator,
    Switch,
    Typography,
} from 'heroui-native';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { ConnectionType, PaperWidth } from '@/stores/usePrinterStore';
import { usePrinterStore } from '@/stores/usePrinterStore';

// ─── Types & constants ────────────────────────────────────────────────────────

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
        <Typography type="body-sm" weight="semibold" className="mb-1.5">
            {label}
        </Typography>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrinterSettingsScreen(): React.JSX.Element {
    const router = useRouter();

    const settings = usePrinterStore((s) => s.settings);
    const updateSettings = usePrinterStore((s) => s.updateSettings);

    const { connection, name, macAddress, ipAddress, paperWidth, cutReceipt, openDrawer, selectedDeviceId } = settings;

    const [scanning, setScanning] = React.useState(false);
    const [devices, setDevices] = React.useState<DiscoveredDevice[]>(MOCK_BT_DEVICES);

    const handleConnectionChange = (type: ConnectionType) => {
        updateSettings({ connection: type, selectedDeviceId: '' });
    };

    const handleScan = () => {
        setScanning(true);
        setDevices([]);
        updateSettings({ selectedDeviceId: '' });
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
                    <Input
                        value={name}
                        onChangeText={(v) => updateSettings({ name: v })}
                        placeholder="Printer name"
                        variant="secondary"
                    />
                </View>

                {/* MAC Address (Bluetooth only) */}
                {connection === 'bluetooth' && (
                    <View>
                        <FieldLabel label="MAC Address" />
                        <Input
                            value={macAddress}
                            onChangeText={(v) => updateSettings({ macAddress: v })}
                            placeholder="00:00:00:00:00:00"
                            autoCapitalize="characters"
                            variant="secondary"
                        />
                    </View>
                )}

                {/* IP Address (Wi-Fi only) */}
                {connection === 'wifi' && (
                    <View>
                        <FieldLabel label="IP Address" />
                        <Input
                            value={ipAddress}
                            onChangeText={(v) => updateSettings({ ipAddress: v })}
                            placeholder="192.168.1.100"
                            keyboardType="decimal-pad"
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
                            if (opt) updateSettings({ paperWidth: opt.value as PaperWidth });
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
                    onPress={() => updateSettings({ cutReceipt: !cutReceipt })}
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
                        onSelectedChange={(v) => updateSettings({ cutReceipt: v })}
                    />
                </Pressable>

                {/* Open drawer toggle */}
                <Pressable
                    className="flex-row items-center justify-between"
                    onPress={() => updateSettings({ openDrawer: !openDrawer })}
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
                        onSelectedChange={(v) => updateSettings({ openDrawer: v })}
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

                        <View className="bg-surface-secondary rounded-panel overflow-hidden">
                            {scanning ? (
                                <View className="py-6 items-center">
                                    <Typography type="body-sm" color="muted">
                                        Scanning…
                                    </Typography>
                                </View>
                            ) : (
                                devices.map((device, i) => (
                                    <React.Fragment key={device.id}>
                                        <Pressable
                                            className="flex-row items-center justify-between px-4 py-3.5 active:bg-surface-tertiary"
                                            onPress={() => updateSettings({ selectedDeviceId: device.id })}
                                        >
                                            <Typography type="body-sm" weight="medium">
                                                {device.name}
                                            </Typography>
                                            {selectedDeviceId === device.id && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="hsl(var(--accent))"
                                                />
                                            )}
                                        </Pressable>
                                        {i < devices.length - 1 && (
                                            <Separator className="mx-4" />
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Save button */}
            <View className="px-4 pb-6 pt-3 bg-surface-secondary">
                <Button className="w-full" onPress={handleSave}>
                    <Button.Label>Save</Button.Label>
                </Button>
            </View>
        </View>
    );
}

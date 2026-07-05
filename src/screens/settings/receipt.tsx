import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Input, Select, Separator, Switch, Typography } from 'heroui-native';
import React from 'react';
import {
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import type { Alignment, InvoiceFormat, ReceiptSettings, SignatureType, TextSize } from '@/stores/useReceiptStore';
import { useReceiptStore } from '@/stores/useReceiptStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'top' | 'bottom' | 'preview';

// Re-export types used by sub-components (sourced from store)
export type { TextSize, Alignment, InvoiceFormat, SignatureType, ReceiptSettings };

// ─── Options ──────────────────────────────────────────────────────────────────

const TEXT_SIZE_OPTIONS = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
];
const ALIGNMENT_OPTIONS = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
];
const INVOICE_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'text', label: 'Text' },
    { value: 'barcode', label: 'Barcode' },
    { value: 'qr', label: 'QR Code' },
];
const SIGNATURE_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'customer', label: 'Customer' },
    { value: 'cashier', label: 'Cashier' },
];

const TABS: { id: Tab; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
    { id: 'general', icon: 'settings-outline', label: 'General' },
    { id: 'top', icon: 'arrow-up-outline', label: 'Top' },
    { id: 'bottom', icon: 'arrow-down-outline', label: 'Bottom' },
    { id: 'preview', icon: 'scan-outline', label: 'Preview' },
];

const TAB_ORDER: Tab[] = ['general', 'top', 'bottom', 'preview'];

// ─── Mock order for preview ───────────────────────────────────────────────────

const MOCK_ORDER = {
    date: 'Feb 14, 2009 06:31',
    notes: 'No chilli sauce',
    items: [
        {
            name: 'FRENCH FRIES',
            qty: 2,
            price: 100,
            total: 200,
            addons: [
                { name: 'SIZE: JUMBO', charge: 6 },
                { name: 'EXTRA: KETCHUP', charge: 0 },
            ],
        },
        { name: 'HAMBURGER', qty: 1, price: 2000, total: 2000, addons: [] },
        { name: 'CHOCOLATE PUDDING', qty: 80, price: 15, total: 1200, addons: [] },
    ],
    subtotal: 3400,
    delivery: 5,
    serviceRate: 5,
    taxRate: 10,
    grandTotal: 3933,
    queue: 42,
    invoiceNumber: 'IN/200902142/GE8-B3D',
    printDate: 'Jun 30, 2026 19:35',
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
    return (
        <Typography type="body-sm" weight="semibold" className="mb-1.5">
            {label}
        </Typography>
    );
}

function ToggleRow({
    label,
    description,
    value,
    onToggle,
}: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: (v: boolean) => void;
}) {
    return (
        <Pressable
            className="flex-row items-center justify-between py-3"
            onPress={() => onToggle(!value)}
        >
            <View className="flex-1 mr-4">
                <Typography type="body-sm" weight="semibold">{label}</Typography>
                {description && (
                    <Typography type="body-xs" color="muted" className="mt-0.5">
                        {description}
                    </Typography>
                )}
            </View>
            <Switch isSelected={value} onSelectedChange={onToggle} />
        </Pressable>
    );
}

function SectionHeader({
    icon,
    title,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
}) {
    return (
        <View className="flex-row items-center gap-2 mt-3 mb-1">
            <Ionicons name={icon} size={18} color="hsl(var(--muted))" />
            <Typography type="body-sm" weight="semibold">
                {title}
            </Typography>
        </View>
    );
}

function SelectField<T extends string>({
    value,
    options,
    listLabel,
    onValueChange,
}: {
    value: T;
    options: { value: string; label: string }[];
    listLabel: string;
    onValueChange: (v: T) => void;
}) {
    return (
        <Select
            value={options.find((o) => o.value === value)}
            onValueChange={(opt) => {
                if (opt) onValueChange(opt.value as T);
            }}
        >
            <Select.Trigger>
                <Select.Value placeholder="Select…" numberOfLines={1} />
                <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                    <Select.ListLabel className="mb-2">{listLabel}</Select.ListLabel>
                    {options.map((o, i, arr) => (
                        <React.Fragment key={o.value}>
                            <Select.Item value={o.value} label={o.label} />
                            {i < arr.length - 1 && <Separator />}
                        </React.Fragment>
                    ))}
                </Select.Content>
            </Select.Portal>
        </Select>
    );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
    active,
    onPress,
}: {
    active: Tab;
    onPress: (tab: Tab) => void;
}) {
    return (
        <View className="px-4 pt-4">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="flex-row gap-2"
            >
                {TABS.map((tab) => {
                    const isActive = tab.id === active;
                    return (
                        <Pressable
                            key={tab.id}
                            onPress={() => onPress(tab.id)}
                            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full active:opacity-70 ${
                                isActive ? 'bg-surface-secondary' : ''
                            }`}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={14}
                                color={
                                    isActive
                                        ? 'hsl(var(--foreground))'
                                        : 'hsl(var(--muted))'
                                }
                            />
                            <Typography
                                type="body-xs"
                                weight={isActive ? 'semibold' : 'medium'}
                                color={isActive ? 'default' : 'muted'}
                            >
                                {tab.label}
                            </Typography>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ─── General tab ─────────────────────────────────────────────────────────────

function GeneralTab({
    settings,
    onChange,
}: {
    settings: ReceiptSettings;
    onChange: (patch: Partial<ReceiptSettings>) => void;
}) {
    return (
        <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pt-4 pb-6"
            keyboardShouldPersistTaps="handled"
        >
            <View className="mb-4">
                <FieldLabel label="Text Size" />
                <SelectField
                    value={settings.textSize}
                    options={TEXT_SIZE_OPTIONS}
                    listLabel="Text size"
                    onValueChange={(v) => onChange({ textSize: v })}
                />
            </View>

            <ToggleRow
                label="Compact Mode"
                description="Less information will be shown"
                value={settings.compactMode}
                onToggle={(v) => onChange({ compactMode: v })}
            />

            <SectionHeader icon="people-outline" title="Customer" />

            <ToggleRow
                label="Print customer's name"
                value={settings.printCustomerName}
                onToggle={(v) => onChange({ printCustomerName: v })}
            />
            <ToggleRow
                label="Print customer's phone"
                value={settings.printCustomerPhone}
                onToggle={(v) => onChange({ printCustomerPhone: v })}
            />
            <ToggleRow
                label="Print customer's address"
                value={settings.printCustomerAddress}
                onToggle={(v) => onChange({ printCustomerAddress: v })}
            />
        </ScrollView>
    );
}

// ─── Top tab ──────────────────────────────────────────────────────────────────

async function pickAndSaveLogo(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library access is needed to select images.');
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [2, 1],
        quality: 1,
    });
    const rawUri = result.canceled ? null : result.assets[0].uri;

    if (!rawUri) return null;

    const processed = await manipulateAsync(
        rawUri,
        [{ resize: { width: 600 } }],
        { compress: 0.85, format: SaveFormat.JPEG },
    );

    const dir = new Directory(Paths.document, 'store-images');
    if (!dir.exists) dir.create({ intermediates: true });

    const dest = new File(dir, `logo_${Date.now()}.jpg`);
    await new File(processed.uri).move(dest);

    return dest.uri;
}

function TopTab({
    settings,
    onChange,
}: {
    settings: ReceiptSettings;
    onChange: (patch: Partial<ReceiptSettings>) => void;
}) {
    const handlePickLogo = async () => {
        const uri = await pickAndSaveLogo();
        if (uri) onChange({ storeLogo: uri });
    };

    return (
        <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pt-4 pb-6 gap-4"
            keyboardShouldPersistTaps="handled"
        >
            {/* Info banner */}
            <View className="flex-row items-center gap-3 bg-accent-soft rounded-panel-inner p-3">
                <View className="w-10 h-10 rounded-lg bg-background/70 items-center justify-center shrink-0">
                    <Ionicons name="help-outline" size={20} color="hsl(var(--accent-soft-foreground))" />
                </View>
                <Typography type="body-sm" className="flex-1">
                    Your store information will be printed on the receipt.
                </Typography>
            </View>

            {/* Store Logo */}
            <View>
                <FieldLabel label="Store Logo" />
                <View className="flex-row gap-3 items-start">
                    <Pressable
                        onPress={handlePickLogo}
                        className="w-36 h-20 bg-surface-secondary rounded-panel-inner overflow-hidden active:opacity-70"
                    >
                        {settings.storeLogo ? (
                            <>
                                <Image
                                    source={{ uri: settings.storeLogo }}
                                    style={{ width: 144, height: 80 }}
                                    resizeMode="contain"
                                />
                                <View className="absolute inset-0 items-end justify-end p-2">
                                    <View className="bg-black/50 rounded-full p-1.5">
                                        <Ionicons name="camera" size={14} color="white" />
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View className="flex-1 items-center justify-center gap-1">
                                <Ionicons name="camera-outline" size={24} color="hsl(var(--muted))" />
                                <Typography type="body-xs" color="muted">Add logo</Typography>
                            </View>
                        )}
                    </Pressable>
                    <Typography type="body-xs" color="muted" className="flex-1 mt-1">
                        The maximum size for the logo is 300 x 150 pixels.
                    </Typography>
                </View>
            </View>

            {/* Store Name */}
            <View>
                <FieldLabel label="Store Name" />
                <Input
                    value={settings.storeName}
                    onChangeText={(v) => onChange({ storeName: v })}
                    placeholder="Store name"
                    variant="secondary"
                />
            </View>

            {/* Store Address */}
            <View>
                <FieldLabel label="Store Address" />
                <Input
                    value={settings.storeAddress1}
                    onChangeText={(v) => onChange({ storeAddress1: v })}
                    placeholder="Address line 1"
                    variant="secondary"
                    className="mb-2"
                />
                <Input
                    value={settings.storeAddress2}
                    onChangeText={(v) => onChange({ storeAddress2: v })}
                    placeholder="Address line 2"
                    variant="secondary"
                />
            </View>

            {/* Store Phone */}
            <View>
                <FieldLabel label="Store Phone Number" />
                <Input
                    value={settings.storePhone}
                    onChangeText={(v) => onChange({ storePhone: v })}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                    variant="secondary"
                />
            </View>
        </ScrollView>
    );
}

// ─── Bottom tab ───────────────────────────────────────────────────────────────

function BottomTab({
    settings,
    onChange,
}: {
    settings: ReceiptSettings;
    onChange: (patch: Partial<ReceiptSettings>) => void;
}) {
    return (
        <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pt-4 pb-6 gap-4"
            keyboardShouldPersistTaps="handled"
        >
            {/* Footer text */}
            <View>
                <FieldLabel label="Footer" />
                <Input
                    value={settings.footer}
                    onChangeText={(v) => onChange({ footer: v })}
                    placeholder="Footer text"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    variant="secondary"
                    className="min-h-20 py-3"
                />
                <Typography type="body-xs" color="muted" className="mt-1">
                    Displayed on the bottom of your receipt
                </Typography>
            </View>

            {/* Alignment */}
            <View>
                <FieldLabel label="Alignment" />
                <SelectField
                    value={settings.alignment}
                    options={ALIGNMENT_OPTIONS}
                    listLabel="Text alignment"
                    onValueChange={(v) => onChange({ alignment: v })}
                />
            </View>

            {/* Invoice Number */}
            <View>
                <FieldLabel label="Invoice Number" />
                <SelectField
                    value={settings.invoiceFormat}
                    options={INVOICE_OPTIONS}
                    listLabel="Invoice number format"
                    onValueChange={(v) => onChange({ invoiceFormat: v })}
                />
            </View>

            {/* Signature */}
            <View>
                <FieldLabel label="Signature" />
                <SelectField
                    value={settings.signatureType}
                    options={SIGNATURE_OPTIONS}
                    listLabel="Signature"
                    onValueChange={(v) => onChange({ signatureType: v })}
                />
            </View>

            <ToggleRow
                label="Show print date"
                value={settings.showPrintDate}
                onToggle={(v) => onChange({ showPrintDate: v })}
            />
            <ToggleRow
                label="Show total quantity"
                description="Will be hidden if the quantity is zero"
                value={settings.showTotalQuantity}
                onToggle={(v) => onChange({ showTotalQuantity: v })}
            />
        </ScrollView>
    );
}

// ─── Receipt preview ──────────────────────────────────────────────────────────

function ReceiptPreview({ settings }: { settings: ReceiptSettings }) {
    const order = MOCK_ORDER;
    const service = Math.round(order.subtotal * (order.serviceRate / 100));
    const tax = Math.round((order.subtotal + order.delivery + service) * (order.taxRate / 100));
    const grandTotal = order.subtotal + order.delivery + service + tax;
    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

    const baseFontSize = settings.textSize === 'small' ? 11 : settings.textSize === 'large' ? 15 : 13;
    const smallFontSize = baseFontSize - 1;
    const textAlign = settings.alignment;

    const rt = StyleSheet.create({
        base: {
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            color: '#111',
            fontSize: baseFontSize,
        },
        small: {
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            color: '#111',
            fontSize: smallFontSize,
        },
    });

    const Dash = () => (
        <Text style={[rt.small, { marginVertical: 5, color: '#555' }]}>
            {'- - - - - - - - - - - - - - - - - - - - - - -'}
        </Text>
    );

    return (
        <View className="bg-neutral-200 rounded-xl p-4">
            {/* Logo */}
            {settings.storeLogo && (
                <View className="items-center mb-3">
                    <Image
                        source={{ uri: settings.storeLogo }}
                        style={{ width: 150, height: 75 }}
                        resizeMode="contain"
                    />
                </View>
            )}

            {/* Store header */}
            {!!settings.storeName && (
                <Text style={[rt.base, { fontWeight: 'bold', textAlign: 'center', marginBottom: 1 }]}>
                    {settings.storeName}
                </Text>
            )}
            {!!settings.storeAddress1 && (
                <Text style={[rt.small, { textAlign: 'center' }]}>{settings.storeAddress1}</Text>
            )}
            {!!settings.storeAddress2 && (
                <Text style={[rt.small, { textAlign: 'center' }]}>{settings.storeAddress2}</Text>
            )}
            {!!settings.storePhone && (
                <Text style={[rt.small, { textAlign: 'center', marginBottom: 2 }]}>
                    {settings.storePhone}
                </Text>
            )}

            <Dash />

            {/* Order info */}
            <Text style={rt.small}>Date: {order.date}</Text>
            {!settings.compactMode && (
                <Text style={[rt.small, { marginBottom: 2 }]}>Notes: {order.notes}</Text>
            )}

            <Dash />

            {/* Items */}
            {order.items.map((item, i) => (
                <View key={i} className="mb-0.5">
                    <Text style={[rt.base, { fontWeight: 'bold' }]}>{item.name}</Text>
                    <View className="flex-row justify-between">
                        <Text style={rt.small}>{item.qty}pcs</Text>
                        <View className="flex-row gap-4">
                            <Text style={rt.small}>{item.price.toLocaleString()}</Text>
                            <Text style={[rt.base, { fontWeight: 'bold' }]}>
                                {item.total.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    {!settings.compactMode &&
                        item.addons.map((addon, j) => (
                            <View key={j} className="flex-row justify-between pl-2">
                                <Text style={[rt.small, { fontWeight: 'bold' }]}>{addon.name}</Text>
                                {addon.charge > 0 && (
                                    <Text style={[rt.small, { fontWeight: 'bold' }]}>
                                        {addon.charge}
                                    </Text>
                                )}
                            </View>
                        ))}
                </View>
            ))}

            <Dash />

            {/* Subtotals */}
            {[
                { label: 'Subtotal', value: order.subtotal.toLocaleString() },
                { label: 'Delivery', value: order.delivery.toLocaleString() },
                { label: `Service (${order.serviceRate}%)`, value: service.toLocaleString() },
                { label: `Tax (${order.taxRate}%)`, value: tax.toLocaleString() },
            ].map(({ label, value }) => (
                <View key={label} className="flex-row justify-between">
                    <Text style={rt.small}>{label}</Text>
                    <Text style={rt.small}>{value}</Text>
                </View>
            ))}

            <View className="h-2" />

            {/* Grand total block */}
            {[
                { label: 'Grand Total', value: `Rp${grandTotal.toLocaleString()}` },
                { label: 'Payment', value: `Rp${grandTotal.toLocaleString()}` },
                { label: 'Change', value: 'Rp0' },
            ].map(({ label, value }) => (
                <View key={label} className="flex-row justify-between">
                    <Text style={[rt.base, { fontWeight: 'bold' }]}>{label}</Text>
                    <Text style={[rt.base, { fontWeight: 'bold' }]}>{value}</Text>
                </View>
            ))}

            <Text
                style={[
                    rt.base,
                    { fontWeight: 'bold', fontSize: baseFontSize + 3, textAlign: 'right', marginTop: 4 },
                ]}
            >
                PAID
            </Text>

            {settings.showTotalQuantity && totalQty > 0 && (
                <Text style={[rt.small, { marginTop: 8 }]}>Total Quantity: {totalQty}</Text>
            )}

            {!!settings.footer && (
                <Text style={[rt.small, { textAlign, marginTop: 8 }]}>{settings.footer}</Text>
            )}

            {/* Footer meta */}
            {settings.invoiceFormat !== 'none' && (
                <>
                    <Text style={[rt.small, { textAlign: 'center', marginTop: 6 }]}>
                        Queue: {order.queue}
                    </Text>
                    {settings.invoiceFormat === 'text' && (
                        <Text style={[rt.small, { textAlign: 'center' }]}>{order.invoiceNumber}</Text>
                    )}
                </>
            )}
            {settings.showPrintDate && (
                <Text style={[rt.small, { textAlign: 'center' }]}>{order.printDate}</Text>
            )}
        </View>
    );
}

function PreviewTab({ settings }: { settings: ReceiptSettings }) {
    return (
        <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-6">
            <ReceiptPreview settings={settings} />
        </ScrollView>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReceiptSetupScreen(): React.JSX.Element {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<Tab>('general');

    const settings = useReceiptStore((s) => s.settings);
    const updateSettings = useReceiptStore((s) => s.updateSettings);

    const isLastTab = activeTab === 'preview';

    const handleNext = () => {
        const idx = TAB_ORDER.indexOf(activeTab);
        if (idx < TAB_ORDER.length - 1) {
            setActiveTab(TAB_ORDER[idx + 1]);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <TabBar active={activeTab} onPress={setActiveTab} />

            {activeTab === 'general' && (
                <GeneralTab settings={settings} onChange={updateSettings} />
            )}
            {activeTab === 'top' && (
                <TopTab settings={settings} onChange={updateSettings} />
            )}
            {activeTab === 'bottom' && (
                <BottomTab settings={settings} onChange={updateSettings} />
            )}
            {activeTab === 'preview' && <PreviewTab settings={settings} />}

            <View className="px-4 pb-6 pt-3 bg-surface-secondary">
                <Button
                    className="w-full"
                    onPress={isLastTab ? () => router.back() : handleNext}
                >
                    <Button.Label>{isLastTab ? 'Save' : 'Next'}</Button.Label>
                </Button>
            </View>
        </View>
    );
}

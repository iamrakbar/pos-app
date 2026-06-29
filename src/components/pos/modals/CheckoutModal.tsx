import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { MOCK_PAYMENT_GROUPS, MOCK_TABLES } from '@/data/pos-mock';
import { checkoutSchema, type CheckoutFormValues } from '@/schemas/checkout';
import { formatRupiah } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Dialog,
    SearchField,
    Select,
    Separator,
    TextArea,
    Typography,
} from 'heroui-native';
import type { JSX } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentSession } from '@/types/pos';
import { useForm, Controller, useWatch } from 'react-hook-form';

const ORDER_TYPE_LABELS: Record<string, string> = {
    'dine-in': 'Dine-In',
    takeaway: 'Takeaway',
};

const DEFAULT_VALUES: CheckoutFormValues = {
    order_type: 'dine-in',
    table_id: null,
    payment_group: 'e-money',
    payment_id: MOCK_PAYMENT_GROUPS.find((g) => g.group_type === 'e-money')?.payments[0]?.id ?? '',
    customer_type: 'merchant',
    customer_search: '',
    notes: '',
};

const now = Date.now();

export default function CheckoutModal(): JSX.Element {
    const modal = usePOSStore((s) => s.modal);
    const closeModal = usePOSStore((s) => s.closeModal);
    const openPaymentModal = usePOSStore((s) => s.openPaymentModal);

    const totalPrice = useCartStore((s) => s.totalPrice);
    const { height: windowHeight } = useWindowDimensions();

    const isOpen = modal === 'checkout';

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const paymentGroup = useWatch({ control, name: 'payment_group' });
    const paymentId = useWatch({ control, name: 'payment_id' });
    const orderType = useWatch({ control, name: 'order_type' });
    const tableId = useWatch({ control, name: 'table_id' });
    const customerType = useWatch({ control, name: 'customer_type' });

    const subtotal = totalPrice();
    const selectedPayment = MOCK_PAYMENT_GROUPS.flatMap((g) => g.payments).find(
        (p) => p.id === paymentId,
    );
    const feeRate = selectedPayment?.fee_rate ?? 0;
    const paymentFee = Math.round(subtotal * feeRate);
    const total = subtotal + paymentFee;

    const selectedTable = MOCK_TABLES.find((t) => t.id === tableId);

    const onSubmit = (values: CheckoutFormValues) => {
        const payment = MOCK_PAYMENT_GROUPS.flatMap((g) => g.payments).find(
            (p) => p.id === values.payment_id,
        );
        const session: PaymentSession = {
            transaction_id: `TR-${now}`,
            payment_type: payment?.name ?? 'QRIS',
            qr_url: null,
            amount: total,
        };
        openPaymentModal(session);
    };

    const dialogMaxHeight = windowHeight * 0.88;
    const scrollMaxHeight = dialogMaxHeight - 220;

    return (
        <Dialog isOpen={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    isSwipeable={false}
                    className="w-[90%] max-w-2xl"
                    style={{ maxHeight: dialogMaxHeight }}
                >
                    <Dialog.Close />

                    <View className="mb-3 pr-8">
                        <Dialog.Title>Checkout</Dialog.Title>
                        <Typography className="text-sm text-muted-foreground">
                            Lanjutkan checkout dengan metode pembayaran di bawah
                        </Typography>
                    </View>

                    <Separator />

                    <ScrollView
                        showsVerticalScrollIndicator
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: scrollMaxHeight }}
                        contentContainerStyle={{ paddingVertical: 20, gap: 24 }}
                    >
                        {/* Order type + Table */}
                        <View className="flex-row gap-4">
                            <View className="flex-1 gap-1.5">
                                <Typography className="text-sm font-semibold text-foreground">
                                    Jenis pesanan <Typography className="text-danger">*</Typography>
                                </Typography>
                                <Select
                                    value={{ value: orderType, label: ORDER_TYPE_LABELS[orderType] ?? orderType }}
                                    onValueChange={(opt) => {
                                        if (opt) setValue('order_type', opt.value as 'dine-in' | 'takeaway');
                                    }}
                                >
                                    <Select.Trigger className="border border-border rounded-xl h-11 px-3 flex-row items-center justify-between bg-background">
                                        <Select.Value placeholder="Pilih jenis" />
                                        <Select.TriggerIndicator />
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Overlay />
                                        <Select.Content presentation="popover" width="full">
                                            <Select.Item value="dine-in" label="Dine-In" />
                                            <Select.Item value="takeaway" label="Takeaway" />
                                        </Select.Content>
                                    </Select.Portal>
                                </Select>
                            </View>

                            <View className="flex-1 gap-1.5">
                                <View className="flex-row justify-between">
                                    <Typography className="text-sm font-semibold text-foreground">Meja</Typography>
                                    <Typography className="text-xs text-muted-foreground">Opsional</Typography>
                                </View>
                                <Select
                                    value={selectedTable ? { value: selectedTable.id, label: selectedTable.name } : undefined}
                                    onValueChange={(opt) => setValue('table_id', opt?.value ?? null)}
                                >
                                    <Select.Trigger className="border border-border rounded-xl h-11 px-3 flex-row items-center justify-between bg-background">
                                        <Select.Value placeholder="Pilih salah satu opsi" />
                                        <Select.TriggerIndicator />
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Overlay />
                                        <Select.Content presentation="popover" width="full">
                                            <Select.Item value="" label="Tidak ada" />
                                            {MOCK_TABLES.map((t) => (
                                                <Select.Item key={t.id} value={t.id} label={`${t.name} (${t.area_name})`} />
                                            ))}
                                        </Select.Content>
                                    </Select.Portal>
                                </Select>
                            </View>
                        </View>

                        {/* Payment method group */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">Metode</Typography>
                            <View className="flex-row gap-2">
                                {MOCK_PAYMENT_GROUPS.map((group) => {
                                    const isActive = paymentGroup === group.group_type;
                                    return (
                                        <Pressable
                                            key={group.group_type}
                                            onPress={() => {
                                                const firstPayment = group.payments[0];
                                                setValue('payment_group', group.group_type as 'e-money' | 'cash');
                                                setValue('payment_id', firstPayment?.id ?? '');
                                            }}
                                            className={`px-4 py-2 rounded-full border ${isActive ? 'bg-accent border-accent' : 'bg-background border-border'
                                                }`}
                                        >
                                            <Typography
                                                className={`text-sm font-medium ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}
                                            >
                                                {group.group_label}
                                            </Typography>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Payment provider */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">
                                Pembayaran <Typography className="text-danger">*</Typography>
                            </Typography>
                            {errors.payment_id && (
                                <Typography className="text-xs text-danger">{errors.payment_id.message}</Typography>
                            )}
                            <View className="flex-row flex-wrap gap-2">
                                {MOCK_PAYMENT_GROUPS.find((g) => g.group_type === paymentGroup)?.payments.map(
                                    (payment) => {
                                        const isActive = paymentId === payment.id;
                                        return (
                                            <Pressable
                                                key={payment.id}
                                                onPress={() => setValue('payment_id', payment.id)}
                                                className={`px-4 py-2 rounded-full border ${isActive ? 'bg-accent border-accent' : 'bg-background border-border'
                                                    }`}
                                            >
                                                <Typography
                                                    className={`text-sm font-medium ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}
                                                >
                                                    {payment.name}
                                                </Typography>
                                            </Pressable>
                                        );
                                    },
                                )}
                            </View>
                        </View>

                        {/* Customer */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">Pelanggan</Typography>
                            <View className="flex-row gap-2">
                                {(['merchant', 'registered'] as const).map((type) => {
                                    const isActive = customerType === type;
                                    const label = type === 'merchant' ? 'Merchant' : 'Pelanggan terdaftar';
                                    return (
                                        <Pressable
                                            key={type}
                                            onPress={() => {
                                                setValue('customer_type', type);
                                                setValue('customer_search', '');
                                            }}
                                            className={`px-4 py-2 rounded-full border ${isActive ? 'bg-accent border-accent' : 'bg-background border-border'
                                                }`}
                                        >
                                            <Typography
                                                className={`text-sm font-medium ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}
                                            >
                                                {label}
                                            </Typography>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {customerType === 'registered' && (
                                <Controller
                                    control={control}
                                    name="customer_search"
                                    render={({ field }) => (
                                        <View className="gap-1">
                                            <SearchField value={field.value} onChange={field.onChange}>
                                                <SearchField.Group>
                                                    <SearchField.SearchIcon />
                                                    <SearchField.Input placeholder="Cari dengan mengetik email pelanggan" />
                                                    <SearchField.ClearButton />
                                                </SearchField.Group>
                                            </SearchField>
                                            <Typography className="text-xs text-accent">Cari berdasarkan nama</Typography>
                                        </View>
                                    )}
                                />
                            )}
                        </View>

                        {/* Notes */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">Catatan</Typography>
                            <Controller
                                control={control}
                                name="notes"
                                render={({ field }) => (
                                    <TextArea
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        placeholder=""
                                        className="min-h-[72px]"
                                    />
                                )}
                            />
                        </View>

                        {/* Pricing summary */}
                        <View className="border border-border rounded-xl overflow-hidden">
                            <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                <Typography className="text-sm text-foreground">Subtotal</Typography>
                                <Typography className="text-sm text-foreground">{formatRupiah(subtotal)}</Typography>
                            </View>
                            {paymentFee > 0 && (
                                <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                    <Typography className="text-sm text-foreground">
                                        Payment Fee ({(feeRate * 100).toFixed(1)}%)
                                    </Typography>
                                    <Typography className="text-sm text-foreground">{formatRupiah(paymentFee)}</Typography>
                                </View>
                            )}
                            <View className="flex-row justify-between px-4 py-3">
                                <Typography className="text-sm font-semibold text-foreground">Total</Typography>
                                <Typography className="text-sm font-semibold text-foreground">{formatRupiah(total)}</Typography>
                            </View>
                        </View>
                    </ScrollView>

                    <Separator />

                    <View className="flex-row gap-3 pt-4">
                        <Button variant="outline" onPress={closeModal}>
                            Batal
                        </Button>
                        <Button
                            className="flex-1 bg-green-500 border-green-500"
                            onPress={handleSubmit(onSubmit)}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                            <Button.Label className="ml-2 font-semibold tracking-wider">BAYAR</Button.Label>
                        </Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

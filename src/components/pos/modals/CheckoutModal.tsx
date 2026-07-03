import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { useTables } from '@/hooks/db/useTables';
import { usePaymentGroups } from '@/hooks/db/usePayments';
import { useGuests, useCreateGuest } from '@/hooks/db/useGuests';
import { useCustomerSearch } from '@/hooks/db/useCustomers';
import { useValidateCart } from '@/hooks/db/useCart';
import { useCheckout } from '@/hooks/db/useCheckout';
import { checkoutSchema, type CheckoutFormValues } from '@/schemas/checkout';
import { guestSchema, type GuestFormValues } from '@/schemas/guest';
import { formatRupiah } from '@/utils/format';
import { getErrorMessage, isApiError } from '@/api/ApiError';
import { extractQrUrl, extractTotal } from '@/api/mappers/checkout';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Dialog,
    SearchField,
    Select,
    Separator,
    Surface,
    TextArea,
    Typography,
} from 'heroui-native';
import type { JSX } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentSession } from '@/types/pos';
import { useForm, Controller, useWatch } from 'react-hook-form';

const ORDER_TYPE_LABELS: Record<string, string> = {
    'dine-in': 'Dine-In',
    takeaway: 'Takeaway',
};

const CUSTOMER_TYPE_LABELS: Record<CheckoutFormValues['customer_type'], string> = {
    guest: 'Guest',
    customer: 'Pelanggan terdaftar',
    anonymous: 'Walk-in',
};

function MiniInput({
    value,
    onChangeText,
    placeholder,
    keyboardType,
}: {
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize="none"
            style={{
                borderWidth: 1,
                borderColor: 'hsl(var(--border))',
                borderRadius: 12,
                height: 40,
                paddingHorizontal: 12,
                fontSize: 14,
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--background))',
            }}
        />
    );
}

export default function CheckoutModal(): JSX.Element {
    const modal = usePOSStore((s) => s.modal);
    const closeModal = usePOSStore((s) => s.closeModal);
    const openPaymentModal = usePOSStore((s) => s.openPaymentModal);

    const cartProducts = useCartStore((s) => s.products);
    const totalPrice = useCartStore((s) => s.totalPrice);
    const { height: windowHeight } = useWindowDimensions();

    const { data: paymentGroups = [] } = usePaymentGroups();
    const { data: tablesList = [] } = useTables();
    const { data: guestsList = [] } = useGuests();
    const createGuest = useCreateGuest();
    const validateCart = useValidateCart();
    const checkout = useCheckout();

    const [guestSearch, setGuestSearch] = useState('');
    const [showNewGuestForm, setShowNewGuestForm] = useState(false);
    const [newGuest, setNewGuest] = useState<GuestFormValues>({ name: '', email: '', phone: '' });
    const [cartError, setCartError] = useState<string | null>(null);

    const defaultPaymentId = paymentGroups.find((g) => g.group_type === 'e-money')?.payments[0]?.id ?? '';

    const DEFAULT_VALUES: CheckoutFormValues = {
        order_type: 'dine-in',
        table_id: null,
        pickup_time: null,
        payment_group: 'e-money',
        payment_id: defaultPaymentId,
        customer_type: 'anonymous',
        guest_id: null,
        customer_id: null,
        customer_search: '',
        notes: '',
    };

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
    const guestId = useWatch({ control, name: 'guest_id' });
    const customerId = useWatch({ control, name: 'customer_id' });
    const customerSearch = useWatch({ control, name: 'customer_search' });

    const { data: customerResults = [] } = useCustomerSearch(customerSearch);

    const subtotal = totalPrice();
    const allPayments = paymentGroups.flatMap((g) => g.payments);
    const selectedPayment = allPayments.find((p) => p.id === paymentId);
    const paymentFee = selectedPayment
        ? selectedPayment.fee_unit === 'percentage'
            ? Math.round(subtotal * (selectedPayment.fee_value / 100))
            : selectedPayment.fee_value
        : 0;
    const total = subtotal + paymentFee;

    const selectedTable = tablesList.find((t) => t.id === tableId);
    const selectedGuest = guestsList.find((g) => g.id === guestId);
    const filteredGuests = guestSearch.trim()
        ? guestsList.filter((g) => g.name.toLowerCase().includes(guestSearch.trim().toLowerCase()))
        : guestsList;

    const handleCreateGuest = () => {
        const parsed = guestSchema.safeParse(newGuest);
        if (!parsed.success) return;
        createGuest.mutate(parsed.data, {
            onSuccess: (guest) => {
                setValue('guest_id', guest.id);
                setShowNewGuestForm(false);
                setNewGuest({ name: '', email: '', phone: '' });
            },
        });
    };

    const onSubmit = async (values: CheckoutFormValues) => {
        setCartError(null);
        try {
            await validateCart.mutateAsync();
        } catch (error) {
            if (isApiError(error) && error.code === 'PRICE_CHANGES_DETECTED') {
                setCartError('Harga produk berubah, silakan periksa kembali keranjang Anda.');
            } else {
                setCartError(getErrorMessage(error));
            }
            return;
        }

        try {
            const result = await checkout.mutateAsync(values);
            const payment = allPayments.find((p) => p.id === values.payment_id);
            const session: PaymentSession = {
                order_id: result.id,
                transaction_id: result.code,
                payment_type: payment?.name ?? 'Unknown',
                qr_url: extractQrUrl(result.payment),
                amount: extractTotal(result.pricing, total),
            };
            openPaymentModal(session, result);
        } catch (error) {
            setCartError(getErrorMessage(error));
        }
    };

    const dialogMaxHeight = windowHeight * 0.88;
    const scrollMaxHeight = dialogMaxHeight - 220;

    return (
        <Dialog isOpen={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    isSwipeable={false}
                    className="w-full max-w-3xl self-center bg-background p-0 overflow-hidden"
                    style={{ maxHeight: dialogMaxHeight }}
                >
                    <View className="flex-row justify-between gap-4 bg-surface p-4">
                        <View>
                            <Dialog.Title>Checkout</Dialog.Title>
                            <Typography className="text-sm text-muted-foreground">
                                Lanjutkan checkout dengan metode pembayaran di bawah
                            </Typography>
                        </View>
                        <Dialog.Close />
                    </View>

                    <Separator />

                    <ScrollView
                        showsVerticalScrollIndicator
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: scrollMaxHeight }}
                        contentContainerClassName="p-4 gap-4 bg-background"
                    >
                        {cartError && (
                            <View className="rounded-xl bg-danger/10 border border-danger/30 px-3 py-2.5">
                                <Typography className="text-xs text-danger">{cartError}</Typography>
                            </View>
                        )}

                        {/* Order type + Table/Pickup time */}
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

                            {orderType === 'dine-in' ? (
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
                                                {tablesList.map((t) => (
                                                    <Select.Item key={t.id} value={t.id} label={`${t.name} (${t.area_name})`} />
                                                ))}
                                            </Select.Content>
                                        </Select.Portal>
                                    </Select>
                                </View>
                            ) : (
                                <View className="flex-1 gap-1.5">
                                    <View className="flex-row justify-between">
                                        <Typography className="text-sm font-semibold text-foreground">Waktu ambil</Typography>
                                        <Typography className="text-xs text-muted-foreground">Opsional</Typography>
                                    </View>
                                    <Controller
                                        control={control}
                                        name="pickup_time"
                                        render={({ field }) => (
                                            <MiniInput
                                                value={field.value ?? ''}
                                                onChangeText={(v) => field.onChange(v || null)}
                                                placeholder="HH:mm"
                                            />
                                        )}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Payment method group */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">Metode</Typography>
                            <Surface className="py-3 w-full flex-row gap-2">
                                {paymentGroups.map((group) => {
                                    const isActive = paymentGroup === group.group_type;
                                    return (
                                        <Pressable
                                            key={group.group_type}
                                            onPress={() => {
                                                const firstPayment = group.payments[0];
                                                setValue('payment_group', group.group_type as 'e-money' | 'cash');
                                                setValue('payment_id', firstPayment?.id ?? '');
                                            }}
                                            className={`px-4 py-2 rounded-full border ${isActive ? 'bg-accent border-accent' : 'bg-background border-border'}`}
                                        >
                                            <Typography
                                                className={`text-sm font-medium ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}
                                            >
                                                {group.group_label}
                                            </Typography>
                                        </Pressable>
                                    );
                                })}
                            </Surface>
                        </View>

                        {/* Payment provider */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">
                                Pembayaran <Typography className="text-danger">*</Typography>
                            </Typography>
                            {errors.payment_id && (
                                <Typography className="text-xs text-danger">{errors.payment_id.message}</Typography>
                            )}
                            <Surface className="py-3 w-full flex-row flex-wrap gap-2">
                                {paymentGroups.find((g) => g.group_type === paymentGroup)?.payments.map(
                                    (payment) => {
                                        const isActive = paymentId === payment.id;
                                        return (
                                            <Pressable
                                                key={payment.id}
                                                onPress={() => setValue('payment_id', payment.id)}
                                                className={`px-4 py-2 rounded-full border ${isActive ? 'bg-accent border-accent' : 'bg-background border-border'}`}
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
                            </Surface>
                        </View>

                        {/* Customer */}
                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">Pelanggan</Typography>
                            <Surface className="py-3 w-full gap-3">
                                <View className="flex-row gap-2">
                                    {(['guest', 'customer', 'anonymous'] as const).map((type) => {
                                        const isActive = customerType === type;
                                        return (
                                            <Pressable
                                                key={type}
                                                onPress={() => {
                                                    setValue('customer_type', type);
                                                    setValue('guest_id', null);
                                                    setValue('customer_id', null);
                                                    setValue('customer_search', '');
                                                }}
                                                className={`px-4 py-2 rounded-full border ${isActive ? 'bg-accent border-accent' : 'bg-background border-border'}`}
                                            >
                                                <Typography
                                                    className={`text-sm font-medium ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}
                                                >
                                                    {CUSTOMER_TYPE_LABELS[type]}
                                                </Typography>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {customerType === 'guest' && (
                                    <View className="gap-2">
                                        <SearchField value={guestSearch} onChange={setGuestSearch}>
                                            <SearchField.Group>
                                                <SearchField.SearchIcon />
                                                <SearchField.Input placeholder="Cari nama guest" />
                                                <SearchField.ClearButton />
                                            </SearchField.Group>
                                        </SearchField>

                                        {filteredGuests.length > 0 && (
                                            <View className="gap-1">
                                                {filteredGuests.slice(0, 5).map((g) => (
                                                    <Pressable
                                                        key={g.id}
                                                        onPress={() => setValue('guest_id', g.id)}
                                                        className={`px-3 py-2 rounded-lg border ${guestId === g.id ? 'bg-accent/10 border-accent' : 'bg-background border-border'}`}
                                                    >
                                                        <Typography className="text-sm text-foreground">{g.name}</Typography>
                                                        {(g.email || g.phone) && (
                                                            <Typography className="text-xs text-muted-foreground">
                                                                {[g.email, g.phone].filter(Boolean).join(' · ')}
                                                            </Typography>
                                                        )}
                                                    </Pressable>
                                                ))}
                                            </View>
                                        )}

                                        <Pressable
                                            onPress={() => setShowNewGuestForm((v) => !v)}
                                            className="flex-row items-center gap-1 self-start active:opacity-70"
                                        >
                                            <Ionicons name="add-circle-outline" size={16} color="hsl(var(--primary))" />
                                            <Typography className="text-sm text-primary">
                                                {showNewGuestForm ? 'Batal' : 'Guest baru'}
                                            </Typography>
                                        </Pressable>

                                        {showNewGuestForm && (
                                            <View className="gap-2 border border-border rounded-xl p-3">
                                                <MiniInput
                                                    value={newGuest.name}
                                                    onChangeText={(v) => setNewGuest((g) => ({ ...g, name: v }))}
                                                    placeholder="Nama"
                                                />
                                                <MiniInput
                                                    value={newGuest.email ?? ''}
                                                    onChangeText={(v) => setNewGuest((g) => ({ ...g, email: v }))}
                                                    placeholder="Email (opsional)"
                                                    keyboardType="email-address"
                                                />
                                                <MiniInput
                                                    value={newGuest.phone ?? ''}
                                                    onChangeText={(v) => setNewGuest((g) => ({ ...g, phone: v }))}
                                                    placeholder="Nomor HP (opsional)"
                                                    keyboardType="phone-pad"
                                                />
                                                {createGuest.isError && (
                                                    <Typography className="text-xs text-danger">
                                                        {getErrorMessage(createGuest.error)}
                                                    </Typography>
                                                )}
                                                <Button size="sm" onPress={handleCreateGuest} isDisabled={createGuest.isPending}>
                                                    Simpan guest
                                                </Button>
                                            </View>
                                        )}

                                        {selectedGuest && (
                                            <Typography className="text-xs text-accent">
                                                Terpilih: {selectedGuest.name}
                                            </Typography>
                                        )}
                                        {errors.guest_id && (
                                            <Typography className="text-xs text-danger">{errors.guest_id.message}</Typography>
                                        )}
                                    </View>
                                )}

                                {customerType === 'customer' && (
                                    <View className="gap-2">
                                        <Controller
                                            control={control}
                                            name="customer_search"
                                            render={({ field }) => (
                                                <SearchField value={field.value} onChange={field.onChange}>
                                                    <SearchField.Group>
                                                        <SearchField.SearchIcon />
                                                        <SearchField.Input placeholder="Cari dengan mengetik email pelanggan" />
                                                        <SearchField.ClearButton />
                                                    </SearchField.Group>
                                                </SearchField>
                                            )}
                                        />
                                        {customerResults.length > 0 && (
                                            <View className="gap-1">
                                                {customerResults.map((c) => (
                                                    <Pressable
                                                        key={c.id}
                                                        onPress={() => setValue('customer_id', c.id)}
                                                        className={`px-3 py-2 rounded-lg border ${customerId === c.id ? 'bg-accent/10 border-accent' : 'bg-background border-border'}`}
                                                    >
                                                        <Typography className="text-sm text-foreground">{c.name}</Typography>
                                                        {(c.email || c.phone) && (
                                                            <Typography className="text-xs text-muted-foreground">
                                                                {[c.email, c.phone].filter(Boolean).join(' · ')}
                                                            </Typography>
                                                        )}
                                                    </Pressable>
                                                ))}
                                            </View>
                                        )}
                                        {errors.customer_id && (
                                            <Typography className="text-xs text-danger">{errors.customer_id.message}</Typography>
                                        )}
                                    </View>
                                )}
                            </Surface>
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
                        <Surface className="w-full overflow-hidden">
                            <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                <Typography className="text-sm text-foreground">Subtotal</Typography>
                                <Typography className="text-sm text-foreground">{formatRupiah(subtotal)}</Typography>
                            </View>
                            {paymentFee > 0 && (
                                <View className="flex-row justify-between px-4 py-3 border-b border-border">
                                    <Typography className="text-sm text-foreground">
                                        Payment Fee
                                        {selectedPayment?.fee_unit === 'percentage' ? ` (${selectedPayment.fee_value}%)` : ''}
                                    </Typography>
                                    <Typography className="text-sm text-foreground">{formatRupiah(paymentFee)}</Typography>
                                </View>
                            )}
                            <View className="flex-row justify-between px-4 py-3">
                                <Typography className="text-sm font-semibold text-foreground">Total</Typography>
                                <Typography className="text-sm font-semibold text-foreground">{formatRupiah(total)}</Typography>
                            </View>
                        </Surface>
                    </ScrollView>

                    <Separator />

                    <View className="flex-row gap-3 bg-surface p-4">
                        <Button variant="outline" onPress={closeModal}>
                            Batal
                        </Button>
                        <Button
                            className="flex-1 bg-green-500 border-green-500"
                            onPress={handleSubmit(onSubmit)}
                            isDisabled={validateCart.isPending || checkout.isPending || cartProducts.length === 0}
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

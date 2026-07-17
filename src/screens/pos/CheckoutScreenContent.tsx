import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import { useTables } from "@/hooks/db/useTables";
import { usePaymentGroups } from "@/hooks/db/usePayments";
import { useGuests } from "@/hooks/db/useGuests";
import { useCustomerSearch } from "@/hooks/db/useCustomers";
import { buildCartProducts, useValidateCart } from "@/hooks/db/useCart";
import { useCheckout } from "@/hooks/db/useCheckout";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage, isApiError } from "@/api/ApiError";
import {
  extractCheckoutTotal,
  extractPaymentExpiry,
  extractPaymentQrUrl,
} from "@/api/mappers/checkout";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  SearchField,
  Select,
  Separator,
  Surface,
  TextArea,
  Typography,
  useThemeColor,
} from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import type { PaymentSession } from "@/types/pos";
import { useForm, Controller, useWatch } from "react-hook-form";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";

type CheckoutContentProps = {
  onCancel?: () => void;
  onPaymentReady?: (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { isCash: boolean }
  ) => void;
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  "dine-in": "Dine-In",
  takeaway: "Takeaway",
};

const isEMoneyGroup = (groupType: string) => groupType.toLowerCase() === "e-money";

function MiniInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  const [background, border, foreground, placeholderColor] = useThemeColor([
    "background",
    "border",
    "foreground",
    "field-placeholder",
  ]);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      keyboardType={keyboardType ?? "default"}
      autoCapitalize="none"
      style={{
        borderWidth: 1,
        borderColor: border,
        borderRadius: 10,
        height: 40,
        paddingHorizontal: 12,
        fontSize: 14,
        color: foreground,
        backgroundColor: background,
      }}
    />
  );
}

function PaymentButtonSkeleton({ widths }: { widths: number[] }) {
  return (
    <View className="min-h-8 flex-row flex-wrap gap-2" accessibilityRole="progressbar">
      {widths.map((width) => (
        <View key={width} className="h-8 rounded-lg bg-surface-secondary" style={{ width }} />
      ))}
    </View>
  );
}

export function CheckoutContent({ onCancel, onPaymentReady }: CheckoutContentProps): JSX.Element {
  const closeModal = usePOSStore((s) => s.closeModal);

  const cartProducts = useCartStore((s) => s.products);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const { data: paymentGroups = [], isPending: arePaymentGroupsPending } = usePaymentGroups();
  const { data: tablesList = [] } = useTables();
  const { data: guests = [] } = useGuests();
  const validateCart = useValidateCart();
  const checkout = useCheckout();

  const [cashReceived, setCashReceived] = useState("");
  const [cartError, setCartError] = useState<string | null>(null);

  const defaultPaymentGroup =
    paymentGroups.find((group) => isEMoneyGroup(group.group_type)) ?? paymentGroups[0];
  const defaultPaymentId = defaultPaymentGroup?.payments[0]?.id ?? "";

  const DEFAULT_VALUES: CheckoutFormValues = {
    order_type: "dine-in",
    table_id: null,
    pickup_time: null,
    payment_group: defaultPaymentGroup?.group_type ?? "E-Money",
    payment_id: defaultPaymentId,
    customer_type: "anonymous",
    guest_id: null,
    customer_id: null,
    customer_search: "",
    notes: "",
    products: buildCartProducts(cartProducts),
  };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const paymentGroup = useWatch({ control, name: "payment_group" });
  const paymentId = useWatch({ control, name: "payment_id" });
  const orderType = useWatch({ control, name: "order_type" });
  const tableId = useWatch({ control, name: "table_id" });
  const customerType = useWatch({ control, name: "customer_type" });
  const guestId = useWatch({ control, name: "guest_id" });
  const customerId = useWatch({ control, name: "customer_id" });
  const customerSearch = useWatch({ control, name: "customer_search" });

  const { data: customerResults = [] } = useCustomerSearch(customerSearch);

  useEffect(() => {
    if (paymentGroups.length === 0) return;

    const selectedGroup = paymentGroups.find((g) => g.group_type === paymentGroup);
    const fallbackGroup =
      selectedGroup ??
      paymentGroups.find((group) => isEMoneyGroup(group.group_type)) ??
      paymentGroups[0];
    const firstPayment = fallbackGroup.payments[0];

    if (!selectedGroup) {
      setValue("payment_group", fallbackGroup.group_type, {
        shouldValidate: true,
      });
    }

    if (!fallbackGroup.payments.some((payment) => payment.id === paymentId)) {
      setValue("payment_id", firstPayment?.id ?? "", { shouldValidate: true });
    }
  }, [paymentGroups, paymentGroup, paymentId, setValue]);

  useEffect(() => {
    setValue("products", buildCartProducts(cartProducts), {
      shouldValidate: true,
    });
  }, [cartProducts, setValue]);

  const subtotal = totalPrice();
  const allPayments = paymentGroups.flatMap((g) => g.payments);
  const selectedPayment = allPayments.find((p) => p.id === paymentId);
  const paymentFee = selectedPayment
    ? selectedPayment.fee_unit === "percentage"
      ? Math.round(subtotal * (selectedPayment.fee_value / 100))
      : selectedPayment.fee_value
    : 0;
  const total = subtotal + paymentFee;
  const isCashPayment =
    paymentGroup.toLowerCase().includes("cash") || selectedPayment?.code === "cashier";
  const cashReceivedAmount = Number(cashReceived.replace(/\D/g, "")) || 0;
  const change = Math.max(0, cashReceivedAmount - total);
  const cashPresets = Array.from(
    new Set([total, 100_000, 150_000, 200_000, 250_000, 300_000, 500_000])
  ).filter((amount) => amount >= total);

  const selectedTable = tablesList.find((t) => t.id === tableId);

  const onSubmit = async (values: CheckoutFormValues) => {
    setCartError(null);

    if (isCashPayment && cashReceivedAmount < total) {
      setCartError("Nominal tunai kurang dari total pembayaran.");
      return;
    }

    try {
      await validateCart.mutateAsync();
    } catch (error) {
      if (isApiError(error) && error.code === "PRICE_CHANGES_DETECTED") {
        setCartError("Harga produk berubah, silakan periksa kembali keranjang Anda.");
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
        payment_type: payment?.name ?? "Unknown",
        qr_url: extractPaymentQrUrl(result),
        expires_at: extractPaymentExpiry(result.payment_details),
        amount: extractCheckoutTotal(result, total),
        cash_received: isCashPayment ? cashReceivedAmount : undefined,
        change: isCashPayment ? change : undefined,
      };
      clearCart();
      onPaymentReady?.(session, result, { isCash: isCashPayment });
    } catch (error) {
      setCartError(getErrorMessage(error));
    }
  };

  const onInvalid = () => {
    setCartError("Lengkapi data checkout yang wajib diisi.");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName="gap-4 px-5 py-4"
      >
        {cartError ? (
          <View className="rounded-lg bg-danger/10 px-3 py-2.5">
            <Typography type="body-sm" className="text-danger">
              {cartError}
            </Typography>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Typography type="body-sm" weight="semibold">
              Jenis pesanan <Typography className="text-danger">*</Typography>
            </Typography>
            <Select
              value={{ value: orderType, label: ORDER_TYPE_LABELS[orderType] ?? orderType }}
              onValueChange={(option) => {
                if (option) setValue("order_type", option.value as "dine-in" | "takeaway");
              }}
            >
              <Select.Trigger>
                <Select.Value placeholder="Pilih jenis" />
                <Select.TriggerIndicator />
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                  <Select.Item value="dine-in" label="Dine-In" />
                  <Select.Item value="takeaway" label="Takeaway" />
                </Select.Content>
              </Select.Portal>
            </Select>
          </View>

          {orderType === "dine-in" ? (
            <View className="flex-1 gap-1.5">
              <Typography type="body-sm" weight="semibold">
                Meja{" "}
                <Typography type="body-xs" color="muted">
                  (opsional)
                </Typography>
              </Typography>
              <Select
                value={
                  selectedTable ? { value: selectedTable.id, label: selectedTable.name } : undefined
                }
                onValueChange={(option) => setValue("table_id", option?.value || null)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Pilih meja" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    <Select.Item value="" label="Tanpa meja" />
                    {tablesList.map((table) => (
                      <Select.Item
                        key={table.id}
                        value={table.id}
                        label={`${table.name} · ${table.area_name}`}
                      />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
          ) : (
            <View className="flex-1 gap-1.5">
              <Typography type="body-sm" weight="semibold">
                Waktu ambil
              </Typography>
              <Controller
                control={control}
                name="pickup_time"
                render={({ field }) => (
                  <MiniInput
                    value={field.value ?? ""}
                    onChangeText={(value) => field.onChange(value || null)}
                    placeholder="HH:mm"
                  />
                )}
              />
            </View>
          )}
        </View>

        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            Metode pembayaran
          </Typography>
          {arePaymentGroupsPending ? (
            <PaymentButtonSkeleton widths={[104, 88, 112]} />
          ) : (
            <View className="min-h-8 flex-row flex-wrap gap-2">
              {paymentGroups.map((group) => {
                const isActive = paymentGroup === group.group_type;
                return (
                  <Button
                    key={group.group_type}
                    size="sm"
                    variant={isActive ? "primary" : "outline"}
                    onPress={() => {
                      setValue("payment_group", group.group_type);
                      setValue("payment_id", group.payments[0]?.id ?? "");
                      setCashReceived("");
                    }}
                  >
                    <Button.Label>{group.group_label}</Button.Label>
                  </Button>
                );
              })}
            </View>
          )}
        </View>

        {!isCashPayment ? (
          <View className="gap-2">
            <Typography type="body-sm" weight="semibold">
              Pembayaran
            </Typography>
            {arePaymentGroupsPending ? (
              <PaymentButtonSkeleton widths={[96, 120, 88]} />
            ) : (
              <View className="min-h-8 flex-row flex-wrap gap-2">
                {paymentGroups
                  .find((group) => group.group_type === paymentGroup)
                  ?.payments.map((payment) => (
                    <Button
                      key={payment.id}
                      size="sm"
                      variant={paymentId === payment.id ? "primary" : "outline"}
                      onPress={() => setValue("payment_id", payment.id)}
                    >
                      <Button.Label>{payment.name}</Button.Label>
                    </Button>
                  ))}
              </View>
            )}
            {errors.payment_id ? (
              <Typography type="body-xs" className="text-danger">
                {errors.payment_id.message}
              </Typography>
            ) : null}
          </View>
        ) : (
          <View className="gap-3">
            <View className="gap-2">
              <Typography type="body-sm" weight="semibold">
                Nominal tunai
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {cashPresets.map((amount, index) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant={cashReceivedAmount === amount ? "primary" : "outline"}
                    onPress={() => setCashReceived(String(amount))}
                  >
                    <Button.Label>
                      {index === 0 ? `Uang pas · ${formatRupiah(amount)}` : formatRupiah(amount)}
                    </Button.Label>
                  </Button>
                ))}
              </View>
            </View>
            <View className="flex-row items-end gap-4">
              <View className="min-w-48 flex-1 gap-1.5">
                <Typography type="body-sm" weight="semibold">
                  Nominal lain
                </Typography>
                <MiniInput
                  value={cashReceived ? formatRupiah(cashReceivedAmount) : ""}
                  onChangeText={(value) => setCashReceived(value.replace(/\D/g, ""))}
                  placeholder="Rp0"
                  keyboardType="phone-pad"
                />
              </View>
              <View className="min-w-32 gap-1">
                <Typography type="body-xs" color="muted">
                  Kembalian
                </Typography>
                <Typography weight="semibold" className="tabular-nums">
                  {formatRupiah(change)}
                </Typography>
              </View>
            </View>
          </View>
        )}

        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            Pelanggan
          </Typography>
          <View className="flex-row gap-2">
            {(
              [
                ["guest", "Merchant"],
                ["customer", "Pelanggan terdaftar"],
                ["anonymous", "Walk-in"],
              ] as const
            ).map(([type, label]) => (
              <Button
                key={type}
                size="sm"
                variant={customerType === type ? "primary" : "outline"}
                onPress={() => {
                  setValue("customer_type", type);
                  setValue("guest_id", null);
                  setValue("customer_id", null);
                  setValue("customer_search", "");
                }}
              >
                <Button.Label>{label}</Button.Label>
              </Button>
            ))}
          </View>

          {customerType === "guest" ? (
            <View className="gap-2">
              <Select
                value={
                  guestId
                    ? {
                        value: guestId,
                        label: guests.find((guest) => guest.id === guestId)?.name ?? "Merchant",
                      }
                    : undefined
                }
                onValueChange={(option) => setValue("guest_id", option?.value || null)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Pilih merchant customer" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    {guests.map((guest) => (
                      <Select.Item key={guest.id} value={guest.id} label={guest.name} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
              {errors.guest_id ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.guest_id.message}
                </Typography>
              ) : null}
            </View>
          ) : null}

          {customerType === "customer" ? (
            <View className="gap-2">
              <Controller
                control={control}
                name="customer_search"
                render={({ field }) => (
                  <SearchField value={field.value} onChange={field.onChange}>
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Cari email pelanggan" />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                )}
              />
              {customerResults.map((customer) => (
                <Pressable
                  key={customer.id}
                  onPress={() => setValue("customer_id", customer.id)}
                  className={`rounded-lg px-3 py-2 ${customerId === customer.id ? "bg-accent/10" : "bg-surface-secondary"}`}
                >
                  <Typography type="body-sm" weight="semibold">
                    {customer.name}
                  </Typography>
                  {customer.email || customer.phone ? (
                    <Typography type="body-xs" color="muted">
                      {[customer.email, customer.phone].filter(Boolean).join(" · ")}
                    </Typography>
                  ) : null}
                </Pressable>
              ))}
              {errors.customer_id ? (
                <Typography type="body-xs" className="text-danger">
                  {errors.customer_id.message}
                </Typography>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Typography type="body-sm" weight="semibold">
            Catatan
          </Typography>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextArea
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Opsional"
                className="min-h-14"
              />
            )}
          />
        </View>

        <Surface variant="secondary" className="gap-2.5 p-4">
          <View className="flex-row justify-between">
            <Typography type="body-sm" color="muted">
              Subtotal
            </Typography>
            <Typography type="body-sm" className="tabular-nums">
              {formatRupiah(subtotal)}
            </Typography>
          </View>
          {paymentFee > 0 ? (
            <View className="flex-row justify-between">
              <Typography type="body-sm" color="muted">
                Biaya pembayaran
                {selectedPayment?.fee_unit === "percentage"
                  ? ` (${selectedPayment.fee_value}%)`
                  : ""}
              </Typography>
              <Typography type="body-sm" className="tabular-nums">
                {formatRupiah(paymentFee)}
              </Typography>
            </View>
          ) : null}
          <Separator />
          <View className="flex-row items-center justify-between">
            <Typography weight="semibold">Total</Typography>
            <Typography.Heading type="h5" className="tabular-nums">
              {formatRupiah(total)}
            </Typography.Heading>
          </View>
        </Surface>
      </ScrollView>

      <Separator />
      <View className="flex-row gap-3 bg-surface px-5 py-3">
        <Button variant="outline" onPress={onCancel ?? closeModal}>
          <Button.Label>Batal</Button.Label>
        </Button>
        <Button
          className="flex-1"
          onPress={handleSubmit(onSubmit, onInvalid)}
          isDisabled={
            validateCart.isPending ||
            checkout.isPending ||
            arePaymentGroupsPending ||
            paymentGroups.length === 0 ||
            cartProducts.length === 0 ||
            (isCashPayment && cashReceivedAmount < total)
          }
        >
          {validateCart.isPending || checkout.isPending ? <ActivityIndicator color="#fff" /> : null}
          <Button.Label>
            {validateCart.isPending || checkout.isPending ? "Memproses" : "Bayar"}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

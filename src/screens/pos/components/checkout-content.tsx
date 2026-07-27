import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { usePaymentGroups } from "@/hooks/db/use-payments";
import { useGuests } from "@/hooks/db/use-guests";
import { useCustomerSearch } from "@/hooks/db/use-customers";
import { buildCartProducts, useValidateCart } from "@/hooks/db/use-cart";
import { useCheckout } from "@/hooks/db/use-checkout";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout";
import { formatRupiah } from "@/utils/format";
import { getErrorMessage, isApiError } from "@/api/api-error";
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
import { SlideButton } from "heroui-native-pro";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import type { PaymentSession, POSPaymentGroup } from "@/types/pos";
import {
  useForm,
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";

type CheckoutContentProps = {
  onCancel?: () => void;
  onPaymentReady?: (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { isCash: boolean }
  ) => void;
};

const isEMoneyGroup = (groupType: string) => groupType.toLowerCase() === "e-money";

function getCashPresets(total: number): number[] {
  if (total <= 0) return [];

  const roundingStep = total < 100_000 ? 10_000 : 50_000;
  const nextRoundedAmount = Math.ceil(total / roundingStep) * roundingStep;

  return nextRoundedAmount === total ? [total] : [total, nextRoundedAmount];
}

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

function CheckoutCostSummary({
  subtotal,
  paymentFee,
  feeUnit,
  feeValue,
}: {
  subtotal: number;
  paymentFee: number;
  feeUnit?: string;
  feeValue?: number;
}) {
  return (
    <Surface variant="secondary" className="gap-2 p-3">
      <View className="flex-row justify-between">
        <Typography type="body-xs" color="muted">
          Subtotal
        </Typography>
        <Typography type="body-xs" className="tabular-nums">
          {formatRupiah(subtotal)}
        </Typography>
      </View>
      {paymentFee > 0 ? (
        <View className="flex-row justify-between">
          <Typography type="body-xs" color="muted">
            Biaya pembayaran{feeUnit === "percentage" ? ` (${feeValue}%)` : ""}
          </Typography>
          <Typography type="body-xs" className="tabular-nums">
            {formatRupiah(paymentFee)}
          </Typography>
        </View>
      ) : null}
    </Surface>
  );
}

function CheckoutActions({
  total,
  isPending,
  isDisabled,
  onCancel,
  onComplete,
}: {
  total: number;
  isPending: boolean;
  isDisabled: boolean;
  onCancel: () => void;
  onComplete: () => void;
}) {
  return (
    <>
      <Separator />
      <View className="bg-surface px-5 pb-3 pt-2.5">
        <View className="flex-row items-center justify-between pb-2.5">
          <Typography type="body-sm" color="muted">
            Total
          </Typography>
          <Typography.Heading type="h5" className="tabular-nums">
            {formatRupiah(total)}
          </Typography.Heading>
        </View>
        <View className="flex-row items-center gap-3">
          <Button variant="outline" onPress={onCancel}>
            <Button.Label>Batal</Button.Label>
          </Button>
          <SlideButton
            variant="accent"
            className="flex-1"
            classNames={{ container: "h-12" }}
            isDisabled={isDisabled}
            autoReset
            autoResetDelay={600}
            onComplete={onComplete}
          >
            <SlideButton.UnderlayContent>
              <SlideButton.Label>{isPending ? "Memproses" : "Geser untuk bayar"}</SlideButton.Label>
            </SlideButton.UnderlayContent>
            <SlideButton.OverlayContent>
              <SlideButton.Label>Bayar</SlideButton.Label>
            </SlideButton.OverlayContent>
            <SlideButton.Thumb>
              {isPending ? <ActivityIndicator size="small" /> : null}
            </SlideButton.Thumb>
          </SlideButton>
        </View>
      </View>
    </>
  );
}

function PaymentFields({
  paymentGroups,
  paymentGroup,
  paymentId,
  isPending,
  isCashPayment,
  cashPresets,
  cashReceived,
  cashReceivedAmount,
  change,
  errors,
  setValue,
  setCashReceived,
}: {
  paymentGroups: POSPaymentGroup[];
  paymentGroup: string;
  paymentId: string;
  isPending: boolean;
  isCashPayment: boolean;
  cashPresets: number[];
  cashReceived: string;
  cashReceivedAmount: number;
  change: number;
  errors: FieldErrors<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  setCashReceived: (value: string) => void;
}) {
  return (
    <>
      <View className="gap-2">
        <Typography type="body-sm" weight="semibold">
          Metode pembayaran
        </Typography>
        {isPending ? (
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
          {isPending ? (
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
    </>
  );
}

function CustomerFields({
  control,
  customerType,
  guestId,
  customerId,
  guests,
  customerResults,
  errors,
  setValue,
}: {
  control: Control<CheckoutFormValues>;
  customerType: CheckoutFormValues["customer_type"];
  guestId: string | null;
  customerId: string | null;
  guests: App.Data.Merchant.Guest.GuestData[];
  customerResults: App.Data.Merchant.Customer.CustomerSearchData[];
  errors: FieldErrors<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
}) {
  return (
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
  );
}

export function CheckoutContent({ onCancel, onPaymentReady }: CheckoutContentProps): JSX.Element {
  const closeModal = usePOSStore((s) => s.closeModal);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);

  const cartProducts = useCartStore((s) => s.products);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const { data: paymentGroups = [], isPending: arePaymentGroupsPending } = usePaymentGroups();
  const { data: guests = [] } = useGuests();
  const validateCart = useValidateCart();
  const checkout = useCheckout();

  const [cashReceived, setCashReceived] = useState("");
  const [cartError, setCartError] = useState<string | null>(null);

  const defaultPaymentGroup =
    paymentGroups.find((group) => isEMoneyGroup(group.group_type)) ?? paymentGroups[0];
  const defaultPaymentId = defaultPaymentGroup?.payments[0]?.id ?? "";

  const DEFAULT_VALUES: CheckoutFormValues = {
    order_type: checkoutForm.order_type,
    table_id: checkoutForm.table_id,
    pickup_time: checkoutForm.pickup_time,
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

  useEffect(() => {
    setValue("order_type", checkoutForm.order_type, { shouldValidate: true });
    setValue("table_id", checkoutForm.table_id, { shouldValidate: true });
    setValue("pickup_time", checkoutForm.pickup_time, { shouldValidate: true });
  }, [checkoutForm.order_type, checkoutForm.pickup_time, checkoutForm.table_id, setValue]);

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
  const cashPresets = getCashPresets(total);

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

  const isCheckoutPending = validateCart.isPending || checkout.isPending;
  const isCheckoutDisabled =
    isCheckoutPending ||
    arePaymentGroupsPending ||
    paymentGroups.length === 0 ||
    cartProducts.length === 0 ||
    (isCashPayment && cashReceivedAmount < total);

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        bottomOffset={80}
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

        <PaymentFields
          paymentGroups={paymentGroups}
          paymentGroup={paymentGroup}
          paymentId={paymentId}
          isPending={arePaymentGroupsPending}
          isCashPayment={isCashPayment}
          cashPresets={cashPresets}
          cashReceived={cashReceived}
          cashReceivedAmount={cashReceivedAmount}
          change={change}
          errors={errors}
          setValue={setValue}
          setCashReceived={setCashReceived}
        />

        <CustomerFields
          control={control}
          customerType={customerType}
          guestId={guestId}
          customerId={customerId}
          guests={guests}
          customerResults={customerResults}
          errors={errors}
          setValue={setValue}
        />

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
                className="h-6"
              />
            )}
          />
        </View>

        <CheckoutCostSummary
          subtotal={subtotal}
          paymentFee={paymentFee}
          feeUnit={selectedPayment?.fee_unit}
          feeValue={selectedPayment?.fee_value}
        />
      </KeyboardAwareScrollView>
      <CheckoutActions
        total={total}
        isPending={isCheckoutPending}
        isDisabled={isCheckoutDisabled}
        onCancel={onCancel ?? closeModal}
        onComplete={handleSubmit(onSubmit, onInvalid)}
      />
    </View>
  );
}

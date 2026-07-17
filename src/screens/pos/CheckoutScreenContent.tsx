import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import { usePaymentGroups } from "@/hooks/db/usePayments";
import { useTables } from "@/hooks/db/useTables";
import { useGuests, useCreateGuest } from "@/hooks/db/useGuests";
import { useCustomerSearch } from "@/hooks/db/useCustomers";
import { buildCartProducts, useValidateCart } from "@/hooks/db/useCart";
import { useCheckout } from "@/hooks/db/useCheckout";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout";
import { guestSchema, type GuestFormValues } from "@/schemas/guest";
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
  Separator,
  Surface,
  TextArea,
  Typography,
  useThemeColor,
} from "heroui-native";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PaymentSession } from "@/types/pos";
import { useForm, Controller, useWatch } from "react-hook-form";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { Segment } from "heroui-native-pro";

type CheckoutContentProps = {
  onCancel?: () => void;
  onPaymentReady?: (session: PaymentSession, result: MerchantCheckoutData) => void;
};

const CUSTOMER_TYPE_LABELS: Record<CheckoutFormValues["customer_type"], string> = {
  guest: "Guest",
  customer: "Pelanggan terdaftar",
  anonymous: "Walk-in",
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
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  const [themeColorBackground, themeColorBorder, themeColorForeground, themeColorFieldPlaceholder] =
    useThemeColor(["background", "border", "foreground", "field-placeholder"]);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={themeColorFieldPlaceholder}
      keyboardType={keyboardType ?? "default"}
      autoCapitalize="none"
      style={{
        borderWidth: 1,
        borderColor: themeColorBorder,
        borderRadius: 12,
        height: 40,
        paddingHorizontal: 12,
        fontSize: 14,
        color: themeColorForeground,
        backgroundColor: themeColorBackground,
      }}
    />
  );
}

export function CheckoutContent({ onCancel, onPaymentReady }: CheckoutContentProps): JSX.Element {
  const themeColorPrimary = useThemeColor("link");
  const closeModal = usePOSStore((s) => s.closeModal);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);

  const cartProducts = useCartStore((s) => s.products);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth >= 900;

  const { data: paymentGroups = [] } = usePaymentGroups();
  const { data: tables = [] } = useTables();
  const { data: guestsList = [] } = useGuests();
  const createGuest = useCreateGuest();
  const validateCart = useValidateCart();
  const checkout = useCheckout();

  const [guestSearch, setGuestSearch] = useState("");
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState<GuestFormValues>({ name: "", email: "", phone: "" });
  const [cartError, setCartError] = useState<string | null>(null);

  const defaultPaymentGroup =
    paymentGroups.find((g) => g.group_type === "e-money") ?? paymentGroups[0];
  const defaultPaymentId = defaultPaymentGroup?.payments[0]?.id ?? "";

  const DEFAULT_VALUES: CheckoutFormValues = {
    order_type: checkoutForm.order_type,
    table_id: checkoutForm.table_id,
    pickup_time: checkoutForm.pickup_time,
    payment_group: defaultPaymentGroup?.group_type ?? "e-money",
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
      selectedGroup ?? paymentGroups.find((g) => g.group_type === "e-money") ?? paymentGroups[0];
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
  const selectedTable = tables.find((table) => table.id === checkoutForm.table_id);
  const paymentFee = selectedPayment
    ? selectedPayment.fee_unit === "percentage"
      ? Math.round(subtotal * (selectedPayment.fee_value / 100))
      : selectedPayment.fee_value
    : 0;
  const total = subtotal + paymentFee;

  const selectedGuest = guestsList.find((g) => g.id === guestId);
  const filteredGuests = guestSearch.trim()
    ? guestsList.filter((g) => g.name.toLowerCase().includes(guestSearch.trim().toLowerCase()))
    : guestsList;

  const handleCreateGuest = () => {
    const parsed = guestSchema.safeParse(newGuest);
    if (!parsed.success) return;
    createGuest.mutate(parsed.data, {
      onSuccess: (guest) => {
        setValue("guest_id", guest.id);
        setShowNewGuestForm(false);
        setNewGuest({ name: "", email: "", phone: "" });
      },
    });
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setCartError(null);

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
      };
      onPaymentReady?.(session, result);
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
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerClassName="w-full max-w-6xl self-center p-5 gap-5 bg-background"
      >
        <View className="gap-1">
          <Typography.Heading type="h4">Complete Payment</Typography.Heading>
          <Typography type="body-sm" color="muted">
            Choose a payment method and optionally attach a customer.
          </Typography>
        </View>

        {cartError && (
          <View className="rounded-lg bg-danger/10 px-3 py-2.5">
            <Typography className="text-sm text-danger">{cartError}</Typography>
          </View>
        )}

        <View className={isWideLayout ? "flex-row items-start gap-5" : "gap-4"}>
          <View className="flex-1 gap-4">
            {/* Payment method group */}
            <Surface className="w-full gap-4 p-5">
              <View>
                <Typography className="text-base font-semibold text-foreground">
                  Payment Method
                </Typography>
                <Typography className="text-xs text-muted-foreground">
                  Choose a payment category and provider
                </Typography>
              </View>
              <View className="gap-2">
                <Typography className="text-sm font-semibold text-foreground">Metode</Typography>
                <Segment
                  value={paymentGroup}
                  onValueChange={(groupType) => {
                    const group = paymentGroups.find((item) => item.group_type === groupType);
                    setValue("payment_group", groupType);
                    setValue("payment_id", group?.payments[0]?.id ?? "");
                  }}
                  size="sm"
                >
                  <Segment.Group className="w-full">
                    <Segment.ScrollView showsHorizontalScrollIndicator={false}>
                      <Segment.Indicator />
                      {paymentGroups.map((group) => {
                        return (
                          <Segment.Item key={group.group_type} value={group.group_type}>
                            <Segment.Label>{group.group_label}</Segment.Label>
                          </Segment.Item>
                        );
                      })}
                    </Segment.ScrollView>
                  </Segment.Group>
                </Segment>
              </View>

              {/* Payment provider */}
              <View className="gap-2">
                <Typography className="text-sm font-semibold text-foreground">
                  Pembayaran <Typography className="text-danger">*</Typography>
                </Typography>
                {errors.payment_id && (
                  <Typography className="text-sm text-danger">
                    {errors.payment_id.message}
                  </Typography>
                )}
                <Segment
                  value={paymentId}
                  onValueChange={(value) => setValue("payment_id", value)}
                  size="sm"
                >
                  <Segment.Group className="w-full">
                    <Segment.ScrollView showsHorizontalScrollIndicator={false}>
                      <Segment.Indicator />
                      {paymentGroups
                        .find((g) => g.group_type === paymentGroup)
                        ?.payments.map((payment) => {
                          return (
                            <Segment.Item key={payment.id} value={payment.id}>
                              <Segment.Label>{payment.name}</Segment.Label>
                            </Segment.Item>
                          );
                        })}
                    </Segment.ScrollView>
                  </Segment.Group>
                </Segment>
              </View>
            </Surface>

            {/* Customer */}
            <Surface className="w-full gap-4 p-5">
              <View>
                <Typography className="text-base font-semibold text-foreground">
                  Customer
                </Typography>
                <Typography className="text-xs text-muted-foreground">
                  Attach a guest or registered customer when needed
                </Typography>
              </View>
              <Segment
                value={customerType}
                onValueChange={(value) => {
                  const type = value as CheckoutFormValues["customer_type"];
                  setValue("customer_type", type);
                  setValue("guest_id", null);
                  setValue("customer_id", null);
                  setValue("customer_search", "");
                }}
                size="sm"
              >
                <Segment.Group className="w-full">
                  <Segment.Indicator />
                  {(["guest", "customer", "anonymous"] as const).map((type) => {
                    return (
                      <Segment.Item key={type} value={type} className="flex-1">
                        <Segment.Label>{CUSTOMER_TYPE_LABELS[type]}</Segment.Label>
                      </Segment.Item>
                    );
                  })}
                </Segment.Group>
              </Segment>

              {customerType === "guest" && (
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
                          onPress={() => setValue("guest_id", g.id)}
                          className={`px-3 py-2 rounded-lg ${guestId === g.id ? "bg-accent/10" : "bg-surface-secondary"}`}
                        >
                          <Typography className="text-sm text-foreground">{g.name}</Typography>
                          {(g.email || g.phone) && (
                            <Typography className="text-xs text-muted-foreground">
                              {[g.email, g.phone].filter(Boolean).join(" · ")}
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
                    <Ionicons name="add-circle-outline" size={16} color={themeColorPrimary} />
                    <Typography className="text-sm text-primary">
                      {showNewGuestForm ? "Batal" : "Guest baru"}
                    </Typography>
                  </Pressable>

                  {showNewGuestForm && (
                    <View className={isWideLayout ? "flex-row items-start gap-2" : "gap-2"}>
                      <View className="flex-1">
                        <MiniInput
                          value={newGuest.name}
                          onChangeText={(v) => setNewGuest((g) => ({ ...g, name: v }))}
                          placeholder="Nama"
                        />
                      </View>
                      <View className="flex-1">
                        <MiniInput
                          value={newGuest.email ?? ""}
                          onChangeText={(v) => setNewGuest((g) => ({ ...g, email: v }))}
                          placeholder="Email (opsional)"
                          keyboardType="email-address"
                        />
                      </View>
                      <View className="flex-1">
                        <MiniInput
                          value={newGuest.phone ?? ""}
                          onChangeText={(v) => setNewGuest((g) => ({ ...g, phone: v }))}
                          placeholder="Nomor HP (opsional)"
                          keyboardType="phone-pad"
                        />
                      </View>
                      <Button
                        size="sm"
                        onPress={handleCreateGuest}
                        isDisabled={createGuest.isPending}
                      >
                        Simpan guest
                      </Button>
                    </View>
                  )}

                  {createGuest.isError && (
                    <Typography className="text-sm text-danger">
                      {getErrorMessage(createGuest.error)}
                    </Typography>
                  )}
                  {selectedGuest && (
                    <Typography className="text-xs text-accent">
                      Terpilih: {selectedGuest.name}
                    </Typography>
                  )}
                  {errors.guest_id && (
                    <Typography className="text-sm text-danger">
                      {errors.guest_id.message}
                    </Typography>
                  )}
                </View>
              )}

              {customerType === "customer" && (
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
                          onPress={() => setValue("customer_id", c.id)}
                          className={`px-3 py-2 rounded-lg ${customerId === c.id ? "bg-accent/10" : "bg-surface-secondary"}`}
                        >
                          <Typography className="text-sm text-foreground">{c.name}</Typography>
                          {(c.email || c.phone) && (
                            <Typography className="text-xs text-muted-foreground">
                              {[c.email, c.phone].filter(Boolean).join(" · ")}
                            </Typography>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {errors.customer_id && (
                    <Typography className="text-sm text-danger">
                      {errors.customer_id.message}
                    </Typography>
                  )}
                </View>
              )}
            </Surface>
          </View>

          <View className={isWideLayout ? "w-[360px] gap-4" : "gap-4"}>
            {/* Notes */}
            <Surface variant="secondary" className="w-full gap-3 p-5">
              <Typography className="text-base font-semibold text-foreground">
                Order Notes
              </Typography>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <TextArea
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder=""
                    className="min-h-[96px]"
                  />
                )}
              />
            </Surface>

            {/* Order and pricing summary */}
            <Surface className="w-full gap-4 p-5">
              <View className="gap-1">
                <Typography className="text-base font-semibold text-foreground">
                  Order Summary
                </Typography>
                <Typography className="text-xs text-muted-foreground">
                  Confirm service details before payment
                </Typography>
              </View>

              <View className="gap-2.5">
                <View className="flex-row items-center justify-between gap-4">
                  <Typography type="body-sm" color="muted">
                    Order type
                  </Typography>
                  <Typography type="body-sm" weight="semibold">
                    {checkoutForm.order_type === "dine-in" ? "Dine-in" : "Takeaway"}
                  </Typography>
                </View>
                <View className="flex-row items-center justify-between gap-4">
                  <Typography type="body-sm" color="muted">
                    {checkoutForm.order_type === "dine-in" ? "Table" : "Pickup time"}
                  </Typography>
                  <Typography
                    type="body-sm"
                    weight="semibold"
                    numberOfLines={1}
                    className="flex-1 text-right"
                  >
                    {checkoutForm.order_type === "dine-in"
                      ? (selectedTable?.name ?? "No table")
                      : (checkoutForm.pickup_time?.slice(0, 5) ?? "Not selected")}
                  </Typography>
                </View>
              </View>

              <Separator />

              <View className="gap-2.5">
                <View className="flex-row justify-between">
                  <Typography type="body-sm" color="muted">
                    Subtotal
                  </Typography>
                  <Typography type="body-sm" className="tabular-nums">
                    {formatRupiah(subtotal)}
                  </Typography>
                </View>
                {paymentFee > 0 && (
                  <View className="flex-row justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      Payment fee
                      {selectedPayment?.fee_unit === "percentage"
                        ? ` (${selectedPayment.fee_value}%)`
                        : ""}
                    </Typography>
                    <Typography type="body-sm" className="tabular-nums">
                      {formatRupiah(paymentFee)}
                    </Typography>
                  </View>
                )}
                <View className="flex-row items-center justify-between pt-1">
                  <Typography type="body-sm" weight="semibold">
                    Total
                  </Typography>
                  <Typography.Heading type="h5" className="tabular-nums">
                    {formatRupiah(total)}
                  </Typography.Heading>
                </View>
              </View>
            </Surface>
          </View>
        </View>
      </ScrollView>

      <Separator />

      <View className="flex-row gap-3 bg-surface px-5 py-4">
        <Button variant="outline" onPress={onCancel ?? closeModal}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onPress={handleSubmit(onSubmit, onInvalid)}
          isDisabled={validateCart.isPending || checkout.isPending || cartProducts.length === 0}
        >
          {validateCart.isPending || checkout.isPending ? (
            <>
              <ActivityIndicator color="#fff" />
              <Button.Label className="ml-2">Memproses</Button.Label>
            </>
          ) : (
            <>
              <Button.Label>Continue to Payment</Button.Label>
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

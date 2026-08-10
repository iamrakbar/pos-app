import { useCartStore } from "@/stores/use-cart-store";
import { usePOSStore } from "@/stores/use-pos-store";
import { usePaymentGroups } from "@/hooks/db/use-payments";
import { useGuests } from "@/hooks/db/use-guests";
import { useCustomerSearch } from "@/hooks/db/use-customers";
import { buildCartProducts, useValidateCart } from "@/hooks/db/use-cart";
import { useCheckout } from "@/hooks/db/use-checkout";
import { createCheckoutSchema, type CheckoutFormValues } from "@/schemas/checkout";
import { formatRupiah, IDR_CURRENCY_FORMAT_OPTIONS } from "@/utils/format";
import { getErrorMessage, isApiError } from "@/api/api-error";
import {
  extractCheckoutTotal,
  extractPaymentExpiry,
  extractPaymentQrUrl,
} from "@/api/mappers/checkout";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrueSheet, useTrueSheet } from "@lodev09/react-native-true-sheet";
import {
  Button,
  Chip,
  RadioGroup,
  ScrollShadow,
  SearchField,
  Select,
  Surface,
  TextArea,
  TextField,
  Input,
  Label,
  Typography,
  useThemeColor,
} from "heroui-native";
import { SlideButton } from "heroui-native-pro";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, JSX, ReactElement } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { KeyboardAwareScrollView, useKeyboardState } from "react-native-keyboard-controller";
import type { PaymentSession, POSPayment, POSPaymentGroup } from "@/types/pos";
import {
  useForm,
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import StringNumberField from "@/components/common/string-number-field";
import { useTranslation } from "@/stores/use-locale";

type CheckoutError =
  | {
      key: "checkout.cashInsufficient" | "checkout.priceChanged" | "checkout.completeRequired";
    }
  | { message: string };

type CheckoutContentProps = {
  presentation: "screen" | "sheet";
  sheetName?: string;
  header?: ReactElement;
  onPaymentReady: (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { processingMode: PaymentSession["processing_mode"] }
  ) => void;
};

function getCashPresets(total: number): number[] {
  if (total <= 0) return [];

  const roundingStep = total < 100_000 ? 10_000 : 50_000;
  const nextRoundedAmount = Math.ceil(total / roundingStep) * roundingStep;

  return nextRoundedAmount === total ? [total] : [total, nextRoundedAmount];
}

function PaymentButtonSkeleton({ widths }: { widths: number[] }) {
  const { t } = useTranslation();

  return (
    <View
      className="min-h-8 flex-row flex-wrap gap-2"
      accessibilityRole="progressbar"
      accessibilityLabel={t("checkout.loadingPaymentMethods")}
    >
      {widths.map((width) => (
        <View key={width} className="h-8 rounded-lg bg-surface-secondary" style={{ width }} />
      ))}
    </View>
  );
}

function PaymentTypeSkeleton() {
  const { t } = useTranslation();

  return (
    <View
      className="flex-row gap-2"
      accessibilityRole="progressbar"
      accessibilityLabel={t("checkout.loadingPaymentMethods")}
    >
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          className="w-28 rounded-xl bg-surface-secondary"
          style={{ aspectRatio: 4 / 3 }}
        />
      ))}
    </View>
  );
}

function CheckoutCostSummary({
  subtotal,
  paymentFee,
  feeUnit,
  feeValue,
  total,
}: {
  subtotal: number;
  paymentFee: number;
  feeUnit?: string;
  feeValue?: number;
  total: number;
}) {
  const { t } = useTranslation();

  return (
    <Surface variant="secondary" className="gap-2 p-3">
      <View className="flex-row justify-between">
        <Typography type="body-xs" color="muted">
          {t("checkout.subtotal")}
        </Typography>
        <Typography type="body-xs" className="tabular-nums">
          {formatRupiah(subtotal)}
        </Typography>
      </View>
      {paymentFee > 0 ? (
        <View className="flex-row justify-between">
          <Typography type="body-xs" color="muted">
            {feeUnit === "percentage"
              ? t("checkout.paymentFeePercentage", { value: feeValue ?? 0 })
              : t("checkout.paymentFee")}
          </Typography>
          <Typography type="body-xs" className="tabular-nums">
            {formatRupiah(paymentFee)}
          </Typography>
        </View>
      ) : null}
      <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2">
        <Typography type="body-sm" weight="semibold">
          {t("checkout.total")}
        </Typography>
        <Typography.Heading type="h5" className="tabular-nums">
          {formatRupiah(total)}
        </Typography.Heading>
      </View>
    </Surface>
  );
}

function CheckoutActions({
  subtotal,
  paymentFee,
  feeUnit,
  feeValue,
  total,
  isPending,
  isDisabled,
  onComplete,
  shouldGrow,
  onHeightChange,
}: {
  subtotal: number;
  paymentFee: number;
  feeUnit?: string;
  feeValue?: number;
  total: number;
  isPending: boolean;
  isDisabled: boolean;
  onComplete: () => void;
  shouldGrow: boolean;
  onHeightChange?: (height: number) => void;
}) {
  const { t } = useTranslation();
  const handleLayout = (event: LayoutChangeEvent) => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <GestureHandlerRootView style={shouldGrow ? { flexGrow: 1 } : { flexGrow: 0 }}>
      <View className="bg-surface" onLayout={handleLayout}>
        <View className="w-full max-w-3xl self-center gap-3 px-5 pt-5 pb-safe-offset-4">
          <CheckoutCostSummary
            subtotal={subtotal}
            paymentFee={paymentFee}
            feeUnit={feeUnit}
            feeValue={feeValue}
            total={total}
          />
          <SlideButton
            variant="accent"
            className="w-full"
            classNames={{ container: "h-12" }}
            isDisabled={isDisabled}
            autoReset
            autoResetDelay={600}
            onComplete={onComplete}
          >
            <SlideButton.UnderlayContent>
              <SlideButton.Label>
                {isPending ? t("checkout.processing") : t("checkout.slideToPay")}
              </SlideButton.Label>
            </SlideButton.UnderlayContent>
            <SlideButton.OverlayContent>
              <SlideButton.Label>{t("checkout.pay")}</SlideButton.Label>
            </SlideButton.OverlayContent>
            <SlideButton.Thumb>
              {isPending ? <ActivityIndicator size="small" /> : null}
            </SlideButton.Thumb>
          </SlideButton>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

function PaymentFields({
  paymentGroups,
  paymentGroup,
  paymentId,
  isPending,
  selectedPayment,
  cashPresets,
  tenderValue,
  cashReceivedAmount,
  subtotal,
  change,
  errors,
  setValue,
}: {
  paymentGroups: POSPaymentGroup[];
  paymentGroup: string;
  paymentId: string;
  isPending: boolean;
  selectedPayment: POSPayment | undefined;
  cashPresets: number[];
  tenderValue: string;
  cashReceivedAmount: number;
  subtotal: number;
  change: number;
  errors: FieldErrors<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
}) {
  const { t } = useTranslation();

  return (
    <>
      <View className="gap-2">
        <Typography type="body-sm" weight="semibold">
          {t("checkout.paymentMethod")}
        </Typography>
        {isPending ? (
          <PaymentTypeSkeleton />
        ) : (
          <RadioGroup
            value={paymentGroup}
            onValueChange={(groupType) => {
              const group = paymentGroups.find((item) => item.group_type === groupType);
              if (!group) return;

              const firstPayment = group.payments[0];
              const paymentFee = firstPayment
                ? firstPayment.fee_unit === "percentage"
                  ? Math.round(subtotal * (firstPayment.fee_value / 100))
                  : firstPayment.fee_value
                : 0;
              setValue("payment_group", group.group_type);
              setValue("payment_id", firstPayment?.id ?? "");
              setValue(
                "tender_value",
                firstPayment?.tender_input.type === "amount" ? String(subtotal + paymentFee) : null
              );
            }}
          >
            <FlatList
              horizontal
              data={paymentGroups}
              keyExtractor={(group) => group.group_type}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
              renderItem={({ item: group }) => (
                <RadioGroup.Item
                  value={group.group_type}
                  className="w-28"
                  style={{ aspectRatio: 4 / 3 }}
                >
                  {({ isSelected }) => (
                    <View
                      className={`h-full w-full items-center justify-center rounded-xl border p-3 ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface-secondary"
                      }`}
                    >
                      <Typography type="body-sm" weight="semibold" className="text-center">
                        {group.group_label}
                      </Typography>
                    </View>
                  )}
                </RadioGroup.Item>
              )}
            />
          </RadioGroup>
        )}
      </View>

      <View className="gap-2">
        <Typography type="body-sm" weight="semibold">
          {t("checkout.payment")}
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
                  variant={paymentId === payment.id ? "primary" : "secondary"}
                  onPress={() => {
                    setValue("payment_id", payment.id);
                    setValue(
                      "tender_value",
                      payment.tender_input.type === "amount" ? String(subtotal) : null
                    );
                  }}
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

      {selectedPayment?.tender_input.type === "reference" ? (
        <View className="gap-2">
          <TextField
            isRequired={selectedPayment.tender_input.required}
            isInvalid={Boolean(errors.tender_value)}
          >
            <Label>{selectedPayment.tender_input.label ?? t("checkout.paymentReference")}</Label>
            <Input
              value={tenderValue}
              onChangeText={(value) => setValue("tender_value", value, { shouldValidate: true })}
              placeholder={selectedPayment.tender_input.placeholder ?? t("checkout.optional")}
            />
            {errors.tender_value ? (
              <Typography type="body-xs" className="text-danger">
                {errors.tender_value.message}
              </Typography>
            ) : null}
          </TextField>
        </View>
      ) : selectedPayment?.tender_input.type === "amount" ? (
        <View className="gap-3">
          <View className="gap-2">
            <Typography type="body-sm" weight="semibold">
              {selectedPayment.tender_input.label ?? t("checkout.cashAmount")}
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {cashPresets.map((amount, index) => (
                <Button
                  key={amount}
                  size="sm"
                  variant={cashReceivedAmount === amount ? "primary" : "secondary"}
                  onPress={() => setValue("tender_value", String(amount), { shouldValidate: true })}
                >
                  <Button.Label>
                    {index === 0
                      ? t("checkout.exactCash", { amount: formatRupiah(amount) })
                      : formatRupiah(amount)}
                  </Button.Label>
                </Button>
              ))}
            </View>
          </View>
          <View className="flex-row items-end gap-4">
            <StringNumberField
              className="flex-1"
              label={t("checkout.otherAmount")}
              value={tenderValue}
              onChange={(value) => setValue("tender_value", value, { shouldValidate: true })}
              placeholder={selectedPayment.tender_input.placeholder ?? "Rp0"}
              minValue={0}
              step={1000}
              formatOptions={IDR_CURRENCY_FORMAT_OPTIONS}
            />
            <View className="min-w-32 gap-1">
              <Typography type="body-xs" color="muted">
                {t("checkout.change")}
              </Typography>
              <Typography weight="semibold" className="tabular-nums">
                {formatRupiah(change)}
              </Typography>
            </View>
          </View>
          {errors.tender_value ? (
            <Typography type="body-xs" className="text-danger">
              {errors.tender_value.message}
            </Typography>
          ) : null}
        </View>
      ) : null}
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
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const selectCustomerType = (type: CheckoutFormValues["customer_type"]) => {
    setValue("customer_type", type);
    setValue("guest_id", null);
    setValue("customer_id", null);
    setValue("customer_search", "");
  };

  return (
    <View className="gap-4">
      <Typography type="body-sm" weight="semibold">
        {t("checkout.customer")}
      </Typography>
      <ScrollShadow orientation="horizontal" size={32} LinearGradientComponent={LinearGradient}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
        >
          <Chip
            variant={customerType === "guest" ? "primary" : "secondary"}
            onPress={() => selectCustomerType("guest")}
          >
            <Chip.Label>{t("checkout.merchant")}</Chip.Label>
          </Chip>
          <Chip
            variant={customerType === "customer" ? "primary" : "secondary"}
            onPress={() => selectCustomerType("customer")}
          >
            <Chip.Label>{t("checkout.registeredCustomer")}</Chip.Label>
          </Chip>
          <Chip
            variant={customerType === "anonymous" ? "primary" : "secondary"}
            onPress={() => selectCustomerType("anonymous")}
          >
            <Chip.Label>{t("checkout.walkIn")}</Chip.Label>
          </Chip>
        </ScrollView>
      </ScrollShadow>

      {customerType === "guest" ? (
        <View className="gap-2">
          <Select
            presentation={choicePresentation}
            value={
              guestId
                ? {
                    value: guestId,
                    label:
                      guests.find((guest) => guest.id === guestId)?.name ?? t("checkout.merchant"),
                  }
                : undefined
            }
            onValueChange={(option) => setValue("guest_id", option?.value || null)}
          >
            <Select.Trigger>
              <Select.Value placeholder={t("checkout.selectMerchantCustomer")} />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content
                presentation={choicePresentation}
                width={choicePresentation === "popover" ? "trigger" : undefined}
              >
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
                  <SearchField.Input placeholder={t("checkout.searchCustomerEmail")} />
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

function CheckoutProcessingState({ accentColor }: { accentColor: string }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center gap-4 px-6 py-10">
      <ActivityIndicator size="large" color={accentColor} />
      <View className="items-center gap-1.5">
        <Typography type="h4" weight="semibold" className="text-center">
          {t("checkout.processingPayment")}
        </Typography>
        <Typography type="body-sm" color="muted" className="max-w-sm text-center">
          {t("checkout.processingDescription")}
        </Typography>
      </View>
    </View>
  );
}

type CheckoutFormScrollContentProps = {
  cartError: string | null;
  paymentFields: ComponentProps<typeof PaymentFields>;
  customerFields: ComponentProps<typeof CustomerFields>;
  control: Control<CheckoutFormValues>;
  presentation: CheckoutContentProps["presentation"];
  isSheetFooterHidden: boolean;
  sheetFooterHeight: number;
};

function CheckoutFormScrollContent({
  cartError,
  paymentFields,
  customerFields,
  control,
  presentation,
  isSheetFooterHidden,
  sheetFooterHeight,
}: CheckoutFormScrollContentProps) {
  const { t } = useTranslation();

  return (
    <KeyboardAwareScrollView
      enabled={presentation === "screen"}
      bottomOffset={presentation === "screen" ? 32 : 0}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1"
      contentContainerClassName="items-center px-5 pt-4 pb-6"
    >
      <View className="w-full max-w-3xl gap-4">
        {cartError ? (
          <View className="rounded-lg bg-danger/10 px-3 py-2.5">
            <Typography type="body-sm" className="text-danger">
              {cartError}
            </Typography>
          </View>
        ) : null}

        <PaymentFields {...paymentFields} />
        <CustomerFields {...customerFields} />

        <View className="gap-1.5">
          <Typography type="body-sm" weight="semibold">
            {t("checkout.notes")}
          </Typography>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextArea
                value={field.value}
                onChangeText={field.onChange}
                placeholder={t("checkout.optional")}
                numberOfLines={2}
                className="h-16"
              />
            )}
          />
        </View>

        {presentation === "sheet" && !isSheetFooterHidden && sheetFooterHeight > 0 ? (
          <View
            style={{ height: sheetFooterHeight + 16 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ) : null}
      </View>
    </KeyboardAwareScrollView>
  );
}

export function CheckoutContent({
  presentation,
  sheetName,
  header,
  onPaymentReady,
}: CheckoutContentProps): JSX.Element {
  const { locale, t } = useTranslation();
  const { resize } = useTrueSheet();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [backgroundColor, borderColor, accentColor] = useThemeColor([
    "background",
    "border",
    "accent",
  ]);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);

  const cartProducts = useCartStore((s) => s.products);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const { data: paymentGroups = [], isPending: arePaymentGroupsPending } = usePaymentGroups();
  const { data: guests = [] } = useGuests();
  const validateCart = useValidateCart();
  const checkout = useCheckout();
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const shouldHideSheetFooter =
    presentation === "sheet" && isKeyboardVisible && windowWidth > windowHeight;

  const [checkoutError, setCheckoutError] = useState<CheckoutError | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [sheetFooterHeight, setSheetFooterHeight] = useState(0);
  const checkoutSchema = createCheckoutSchema(t);

  const defaultPaymentGroup = paymentGroups[0];
  const defaultPaymentId = defaultPaymentGroup?.payments[0]?.id ?? "";

  const DEFAULT_VALUES: CheckoutFormValues = {
    order_type: checkoutForm.order_type,
    table_id: checkoutForm.table_id,
    pickup_time: checkoutForm.pickup_time,
    payment_group: defaultPaymentGroup?.group_type ?? "",
    payment_id: defaultPaymentId,
    tender_value: null,
    customer_type: "anonymous",
    guest_id: null,
    customer_id: null,
    customer_search: "",
    notes: "",
    products: buildCartProducts(cartProducts),
  };

  const {
    control,
    clearErrors,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const paymentGroup = useWatch({ control, name: "payment_group" });
  const paymentId = useWatch({ control, name: "payment_id" });
  const tenderValue = useWatch({ control, name: "tender_value" }) ?? "";
  const customerType = useWatch({ control, name: "customer_type" });
  const guestId = useWatch({ control, name: "guest_id" });
  const customerId = useWatch({ control, name: "customer_id" });
  const customerSearch = useWatch({ control, name: "customer_search" });

  const { data: customerResults = [] } = useCustomerSearch(customerSearch);
  const cartError =
    checkoutError && "key" in checkoutError
      ? t(checkoutError.key)
      : (checkoutError?.message ?? null);

  useEffect(() => {
    clearErrors();
  }, [clearErrors, locale]);

  useEffect(() => {
    if (presentation === "sheet" && sheetName && isKeyboardVisible) {
      void resize(sheetName, 1);
    }
  }, [isKeyboardVisible, presentation, resize, sheetName]);

  useEffect(() => {
    if (paymentGroups.length === 0) return;

    const selectedGroup = paymentGroups.find((g) => g.group_type === paymentGroup);
    const fallbackGroup = selectedGroup ?? paymentGroups[0];
    const firstPayment = fallbackGroup.payments[0];

    if (!selectedGroup) {
      setValue("payment_group", fallbackGroup.group_type, {
        shouldValidate: true,
      });
    }

    if (!fallbackGroup.payments.some((payment) => payment.id === paymentId)) {
      setValue("payment_id", firstPayment?.id ?? "", { shouldValidate: true });
      setValue("tender_value", firstPayment?.tender_input.type === "amount" ? "0" : null, {
        shouldValidate: true,
      });
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
  const isAmountTender = selectedPayment?.tender_input.type === "amount";
  const cashReceivedAmount = Number(tenderValue.replace(/\D/g, "")) || 0;
  const change = Math.max(0, cashReceivedAmount - total);
  const cashPresets = getCashPresets(total);

  const onSubmit = async (values: CheckoutFormValues) => {
    setCheckoutError(null);

    if (isAmountTender && cashReceivedAmount < total) {
      setCheckoutError({ key: "checkout.cashInsufficient" });
      return;
    }

    if (selectedPayment?.tender_input.required && !values.tender_value?.trim()) {
      setError("tender_value", {
        type: "required",
        message: selectedPayment.tender_input.label ?? t("checkout.completeRequired"),
      });
      return;
    }

    try {
      await validateCart.mutateAsync();
    } catch (error) {
      if (isApiError(error) && error.code === "PRICE_CHANGES_DETECTED") {
        setCheckoutError({ key: "checkout.priceChanged" });
      } else {
        setCheckoutError({ message: getErrorMessage(error) });
      }
      return;
    }

    try {
      const result = await checkout.mutateAsync(values);
      const payment = allPayments.find((p) => p.id === values.payment_id);
      const paymentSnapshot = result.payment;
      const session: PaymentSession = {
        order_id: result.id,
        transaction_id: result.code,
        payment_type: payment?.name ?? t("checkout.unknownPayment"),
        qr_url: extractPaymentQrUrl(result),
        expires_at: extractPaymentExpiry(result.payment_details),
        amount: extractCheckoutTotal(result, total),
        cash_received: paymentSnapshot.amount_received ?? undefined,
        change: paymentSnapshot.change_due,
        reference: paymentSnapshot.reference ?? undefined,
        processing_mode: paymentSnapshot.processing_mode,
      };
      setIsCompleting(true);
      onPaymentReady(session, result, { processingMode: paymentSnapshot.processing_mode });
    } catch (error) {
      if (isApiError(error) && error.errors?.tender_value?.[0]) {
        setError("tender_value", { type: "server", message: error.errors.tender_value[0] });
      } else if (isApiError(error) && error.code === "PAYMENT_METHOD_UNAVAILABLE") {
        setCheckoutError({ message: error.message });
      } else {
        setCheckoutError({ message: getErrorMessage(error) });
      }
    }
  };

  const onInvalid = () => {
    setCheckoutError({ key: "checkout.completeRequired" });
  };

  const isCheckoutPending = validateCart.isPending || checkout.isPending || isCompleting;
  const isCheckoutDisabled =
    isCheckoutPending ||
    arePaymentGroupsPending ||
    paymentGroups.length === 0 ||
    cartProducts.length === 0 ||
    (isAmountTender && cashReceivedAmount < total) ||
    Boolean(selectedPayment?.tender_input.required && !tenderValue.trim());

  const footer =
    isCheckoutPending || shouldHideSheetFooter ? undefined : (
      <CheckoutActions
        subtotal={subtotal}
        paymentFee={paymentFee}
        feeUnit={selectedPayment?.fee_unit}
        feeValue={selectedPayment?.fee_value}
        total={total}
        isPending={isCheckoutPending}
        isDisabled={isCheckoutDisabled}
        onComplete={handleSubmit(onSubmit, onInvalid)}
        shouldGrow={presentation === "sheet"}
        onHeightChange={presentation === "sheet" ? setSheetFooterHeight : undefined}
      />
    );

  const content = (
    <GestureHandlerRootView style={{ flexGrow: 1, backgroundColor }}>
      {isCheckoutPending ? (
        <CheckoutProcessingState accentColor={accentColor} />
      ) : (
        <CheckoutFormScrollContent
          cartError={cartError}
          paymentFields={{
            paymentGroups,
            paymentGroup,
            paymentId,
            isPending: arePaymentGroupsPending,
            selectedPayment,
            cashPresets,
            tenderValue,
            cashReceivedAmount,
            subtotal,
            change,
            errors,
            setValue,
          }}
          customerFields={{
            control,
            customerType,
            guestId,
            customerId,
            guests,
            customerResults,
            errors,
            setValue,
          }}
          control={control}
          presentation={presentation}
          isSheetFooterHidden={shouldHideSheetFooter}
          sheetFooterHeight={sheetFooterHeight}
        />
      )}
    </GestureHandlerRootView>
  );

  if (presentation === "screen") {
    return (
      <View className="flex-1 bg-background">
        {content}
        {footer}
      </View>
    );
  }

  return (
    <TrueSheet
      name={sheetName}
      detents={[0.72, 0.96]}
      presentation="form"
      maxContentWidth={680}
      cornerRadius={24}
      backgroundColor={backgroundColor}
      grabber={!isCheckoutPending}
      dismissible={!isCheckoutPending}
      draggable={!isCheckoutPending}
      dimmed
      scrollable
      scrollableOptions={{ scrollingExpandsSheet: true, keyboardScrollOffset: 24 }}
      header={header}
      headerStyle={{ backgroundColor, borderColor }}
      footer={footer}
      footerStyle={{ backgroundColor, borderColor }}
    >
      {content}
    </TrueSheet>
  );
}

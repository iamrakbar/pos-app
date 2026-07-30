import { useCartStore } from "@/stores/use-cart-store";
import { formatRupiah } from "@/utils/format";
import { useProducts } from "@/hooks/db/use-products";
import { useTables } from "@/hooks/db/use-tables";
import { usePOSStore } from "@/stores/use-pos-store";
import { Button, Select, Separator, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, Text, View } from "react-native";
import AppIcon from "@/components/common/app-icon";
import { EmptyState, TimePicker } from "heroui-native-pro";
import { useTrueSheet } from "@lodev09/react-native-true-sheet";
import CartItemRow from "./cart-item-row";
import CheckoutSheet, { POS_CHECKOUT_SHEET_NAME } from "./checkout-sheet";
import TableSelectionButton from "./table-selection-button";
import { getLocaleTag } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useRouter } from "expo-router";
import { resetCurrentOrder } from "@/stores/reset-current-order";

const TIME_PICKER_INTERVAL_MINUTES = 5;

function formatTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getNextPickupTime(): string | null {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes() + 1;
  const roundedMinutes =
    Math.ceil(minutesSinceMidnight / TIME_PICKER_INTERVAL_MINUTES) * TIME_PICKER_INTERVAL_MINUTES;

  if (roundedMinutes >= 24 * 60) return null;

  return formatTimeValue(Math.floor(roundedMinutes / 60), roundedMinutes % 60);
}

function isPastPickupTime(value: string): boolean {
  const [hour, minute] = value.split(":").map(Number);
  const now = new Date();

  return hour * 60 + minute <= now.getHours() * 60 + now.getMinutes();
}

export default function CartContent(): JSX.Element {
  const router = useRouter();
  const { present } = useTrueSheet();
  const { isCompact, isPortrait } = useResponsiveLayout();
  const { locale, t } = useTranslation();
  const { choicePresentation, pickerPresentation } = useOverlayPresentation();
  const [colorAccent, colorMuted] = useThemeColor(["accent", "muted"]);
  const cartProducts = useCartStore((s) => s.products);
  const itemCount = useCartStore((s) =>
    s.products.reduce((total, product) => total + product.qty, 0)
  );
  const totalPrice = useCartStore((s) => s.totalPrice);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);
  const updateCheckoutForm = usePOSStore((s) => s.updateCheckoutForm);
  const { data: catalogProducts } = useProducts();
  const { data: tables = [] } = useTables();

  const subtotal = totalPrice();
  const productById = new Map((catalogProducts ?? []).map((product) => [product.id, product]));
  const selectedTable = tables.find((table) => table.id === checkoutForm.table_id);
  const usesCheckoutScreen = isCompact && isPortrait;

  const handleCheckout = () => {
    if (usesCheckoutScreen) {
      router.push("/pos/checkout");
      return;
    }

    void present(POS_CHECKOUT_SHEET_NAME, 1);
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between gap-2 px-5 py-3">
        <View className="h-12 flex-row items-center gap-2">
          <Select
            presentation={choicePresentation}
            value={{
              value: checkoutForm.order_type,
              label: checkoutForm.order_type === "dine-in" ? t("pos.dineIn") : t("pos.takeaway"),
            }}
            onValueChange={(option) => {
              if (!option) return;

              const orderType = option.value as "dine-in" | "takeaway";
              updateCheckoutForm({
                order_type: orderType,
                table_id: orderType === "dine-in" ? checkoutForm.table_id : null,
                pickup_time:
                  orderType === "takeaway"
                    ? checkoutForm.pickup_time && !isPastPickupTime(checkoutForm.pickup_time)
                      ? checkoutForm.pickup_time
                      : getNextPickupTime()
                    : null,
              });
            }}
          >
            <Select.Trigger asChild variant="unstyled">
              <Button variant="secondary" size="sm" className="min-w-24">
                <Button.Label className="text-sm" numberOfLines={1}>
                  {checkoutForm.order_type === "dine-in" ? t("pos.dineIn") : t("pos.takeaway")}
                </Button.Label>
              </Button>
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content
                presentation={choicePresentation}
                width={choicePresentation === "popover" ? 220 : undefined}
              >
                <Select.Item value="dine-in" label={t("pos.dineIn")} />
                <Select.Item value="takeaway" label={t("pos.takeaway")} />
              </Select.Content>
            </Select.Portal>
          </Select>

          {checkoutForm.order_type === "dine-in" ? (
            <TableSelectionButton selectedTable={selectedTable} />
          ) : (
            <TimePicker
              hourFormat={24}
              minuteInterval={TIME_PICKER_INTERVAL_MINUTES}
              locale={getLocaleTag(locale)}
              value={
                checkoutForm.pickup_time
                  ? {
                      value: `${checkoutForm.pickup_time}:00`,
                      label: checkoutForm.pickup_time,
                    }
                  : undefined
              }
              onValueChange={(option) => {
                const pickupTime = option?.value.slice(0, 5) ?? null;
                updateCheckoutForm({ pickup_time: pickupTime });
              }}
            >
              <TimePicker.Select presentation={pickerPresentation}>
                <TimePicker.Trigger className="h-10 py-0 items-center bg-background-secondary rounded-full shadow-none">
                  <Text className="text-accent size-sm">
                    {checkoutForm.pickup_time ?? t("pos.pickupTime")}
                  </Text>
                  <AppIcon name="time-outline" size={12} color={colorAccent} />
                </TimePicker.Trigger>
                <TimePicker.Portal>
                  <TimePicker.Overlay />
                  <TimePicker.Content
                    presentation={pickerPresentation}
                    width={pickerPresentation === "popover" ? 160 : undefined}
                  >
                    <TimePicker.Wheel />
                  </TimePicker.Content>
                </TimePicker.Portal>
              </TimePicker.Select>
            </TimePicker>
          )}
        </View>
        {cartProducts.length > 0 && (
          <Button variant="danger-soft" size="sm" onPress={resetCurrentOrder}>
            <Button.Label>{t("common.clear")}</Button.Label>
          </Button>
        )}
      </View>

      {/* Cart items */}
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-3"
        showsVerticalScrollIndicator={false}
      >
        {cartProducts.length === 0 ? (
          <EmptyState className="py-16">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <AppIcon name="cart-outline" size={20} color={colorMuted} />
              </EmptyState.Media>
              <EmptyState.Title>{t("pos.cartEmpty")}</EmptyState.Title>
              <EmptyState.Description>{t("pos.cartEmptyDescription")}</EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          cartProducts.map((item) => (
            <CartItemRow key={item.id} item={item} product={productById.get(item.product_id)} />
          ))
        )}
      </ScrollView>

      <Separator />

      {/* Footer */}
      <View className="px-5 py-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Typography type="body-sm" color="muted">
            {t(itemCount === 1 ? "pos.subtotalItemsOne" : "pos.subtotalItemsOther", {
              count: itemCount,
            })}
          </Typography>
          <Typography weight="semibold" className="tabular-nums">
            {formatRupiah(subtotal)}
          </Typography>
        </View>
        <Button className="w-full" onPress={handleCheckout} isDisabled={cartProducts.length === 0}>
          {t("navigation.checkout")}
        </Button>
      </View>
      {usesCheckoutScreen ? null : <CheckoutSheet />}
    </View>
  );
}

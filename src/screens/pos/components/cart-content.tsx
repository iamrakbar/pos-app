import { useCartStore } from "@/stores/use-cart-store";
import { formatRupiah } from "@/utils/format";
import { useProducts } from "@/hooks/db/use-products";
import { useTables } from "@/hooks/db/use-tables";
import { usePOSStore } from "@/stores/use-pos-store";
import { Button, Select, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmptyState, TimePicker } from "heroui-native-pro";
import CartItemRow from "./cart-item-row";
import TableSelectionButton from "./table-selection-button";
import { getLocaleTag } from "@/locales";
import { useTranslation } from "@/stores/use-locale";

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
  const { locale } = useTranslation();
  const [themeColorMuted, themeColorDangerSoftForeground] = useThemeColor([
    "muted",
    "danger-soft-foreground",
  ]);
  const cartProducts = useCartStore((s) => s.products);
  const itemCount = useCartStore((s) =>
    s.products.reduce((total, product) => total + product.qty, 0)
  );
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);
  const updateCheckoutForm = usePOSStore((s) => s.updateCheckoutForm);
  const { data: catalogProducts } = useProducts();
  const { data: tables = [] } = useTables();

  const subtotal = totalPrice();
  const productById = new Map((catalogProducts ?? []).map((product) => [product.id, product]));
  const selectedTable = tables.find((table) => table.id === checkoutForm.table_id);

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between gap-2 px-5 py-3">
        <View className="h-12 flex-row items-center gap-2">
          <Select
            value={{
              value: checkoutForm.order_type,
              label: checkoutForm.order_type === "dine-in" ? "Dine-In" : "Takeaway",
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
              <Button variant="outline" className="min-w-28">
                <Button.Label className="text-sm" numberOfLines={1}>
                  {checkoutForm.order_type === "dine-in" ? "Dine-In" : "Takeaway"}
                </Button.Label>
              </Button>
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="popover" width={220}>
                <Select.Item value="dine-in" label="Dine-In" />
                <Select.Item value="takeaway" label="Takeaway" />
              </Select.Content>
            </Select.Portal>
          </Select>

          {checkoutForm.order_type === "dine-in" ? (
            <TableSelectionButton selectedTable={selectedTable} />
          ) : (
            <TimePicker
              className="h-12"
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
              <TimePicker.Select>
                <TimePicker.Trigger
                  asChild
                  className="h-12 gap-2 rounded-3xl border border-border bg-transparent px-4 py-0 shadow-none"
                >
                  <Button variant="outline" className="justify-between min-w-28">
                    <Button.Label className="text-sm" numberOfLines={1}>
                      {checkoutForm.pickup_time ?? "Pickup time"}
                    </Button.Label>
                    <Ionicons name="time-outline" size={16} color={themeColorMuted} />
                  </Button>
                </TimePicker.Trigger>
                <TimePicker.Portal>
                  <TimePicker.Overlay />
                  <TimePicker.Content presentation="popover" width={160}>
                    <TimePicker.Wheel />
                  </TimePicker.Content>
                </TimePicker.Portal>
              </TimePicker.Select>
            </TimePicker>
          )}
        </View>
        {cartProducts.length > 0 && (
          <Button variant="danger-soft" size="sm" onPress={clearCart}>
            <Ionicons name="trash-outline" size={16} color={themeColorDangerSoftForeground} />
            <Button.Label>Clear</Button.Label>
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
                <Ionicons name="cart-outline" size={20} color={themeColorMuted} />
              </EmptyState.Media>
              <EmptyState.Title>Cart is empty</EmptyState.Title>
              <EmptyState.Description>Add products to get started.</EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          cartProducts.map((item) => (
            <CartItemRow key={item.id} item={item} product={productById.get(item.product_id)} />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View className="px-5 py-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Typography type="body-sm" color="muted">
            Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}
          </Typography>
          <Typography weight="semibold" className="tabular-nums">
            {formatRupiah(subtotal)}
          </Typography>
        </View>
        <Button
          className="w-full"
          onPress={() => router.push("/pos/checkout")}
          isDisabled={cartProducts.length === 0}
        >
          Checkout
        </Button>
      </View>
    </View>
  );
}

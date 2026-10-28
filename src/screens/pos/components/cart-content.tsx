import {
  Typography,
  Separator,
  EmptyState,
  Skeleton,
  TimePicker as PanelTimePicker,
  Button as PanelButton,
  Select as PanelSelect,
} from "panelui-native";
import {
  TIME_PICKER_INTERVAL_MINUTES,
  formatTimeValue,
  getNextPickupTime,
  isPastPickupTime,
} from "@/utils/pickup-time";
import { useCSSVariable } from "uniwind";
import { useCartStore } from "@/stores/use-cart-store";
import { formatRupiah } from "@/utils/format";
import { useProducts } from "@/hooks/db/use-products";
import { useTables } from "@/hooks/db/use-tables";
import { usePOSStore } from "@/stores/use-pos-store";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useTrueSheet } from "@lodev09/react-native-true-sheet";
import CartItemRow from "./cart-item-row";
import CheckoutSheet, { POS_CHECKOUT_SHEET_NAME } from "./checkout-sheet";
import TableSelectionButton from "./table-selection-button";
import { getLocaleTag, type Locale } from "@/locales";
import { useTranslation } from "@/stores/use-locale";
import {
  useOverlayPresentation,
  type OverlayChoicePresentation,
} from "@/hooks/use-overlay-presentation";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useRouter } from "expo-router";
import { resetCurrentOrder } from "@/stores/reset-current-order";
import Animated from "react-native-reanimated";
import ParkedOrdersPanel from "./parked-orders-panel";
import type { CartItem } from "@/types/cart";
import type { CheckoutFormState, POSProduct, POSTable } from "@/types/pos";

function CartOrderControls({
  checkoutForm,
  selectedTable,
  choicePresentation,
  pickerPresentation,
  locale,
  t,
  colorAccent,
  updateCheckoutForm,
}: {
  checkoutForm: CheckoutFormState;
  selectedTable: POSTable | undefined;
  choicePresentation: OverlayChoicePresentation;
  pickerPresentation: OverlayChoicePresentation;
  locale: Locale;
  t: ReturnType<typeof useTranslation>["t"];
  colorAccent: string;
  updateCheckoutForm: (patch: Partial<CheckoutFormState>) => void;
}): JSX.Element {
  const nextPickupTime = getNextPickupTime();
  const pickupValue = checkoutForm.pickup_time
    ? {
        hour: Number(checkoutForm.pickup_time.slice(0, 2)),
        minute: Number(checkoutForm.pickup_time.slice(3, 5)),
      }
    : undefined;
  const minimumPickupValue = nextPickupTime
    ? {
        hour: Number(nextPickupTime.slice(0, 2)),
        minute: Number(nextPickupTime.slice(3, 5)),
      }
    : undefined;

  return (
    <View className="h-12 flex-row items-center gap-2">
      <PanelSelect
        presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
        value={checkoutForm.order_type}
        size="sm"
        title={t("orders.detail.orderType")}
        onValueChange={(value) => {
          const orderType = value as "dine-in" | "takeaway";
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
        <PanelSelect.Item value="dine-in" label={t("pos.dineIn")} />
        <PanelSelect.Item value="takeaway" label={t("pos.takeaway")} />
      </PanelSelect>

      {checkoutForm.order_type === "dine-in" ? (
        <TableSelectionButton selectedTable={selectedTable} />
      ) : (
        <PanelTimePicker
          hourCycle={24}
          minuteStep={TIME_PICKER_INTERVAL_MINUTES}
          locale={getLocaleTag(locale)}
          presentation={pickerPresentation}
          value={pickupValue}
          minTime={minimumPickupValue}
          disabled={!nextPickupTime}
          onValueChange={(value) => {
            const selectedTime = formatTimeValue(value.hour, value.minute);
            updateCheckoutForm({
              pickup_time: isPastPickupTime(selectedTime) ? getNextPickupTime() : selectedTime,
            });
          }}
        >
          <PanelButton
            variant="secondary"
            size="sm"
            endContent={<AppIcon icon={AppIcons.time} size={12} color={colorAccent} />}
          >
            {checkoutForm.pickup_time ?? t("pos.pickupTime")}
          </PanelButton>
        </PanelTimePicker>
      )}
      <ParkedOrdersPanel mode="list" />
    </View>
  );
}

function CartHeader({
  isLoading,
  checkoutForm,
  cartProducts,
  selectedTable,
  choicePresentation,
  pickerPresentation,
  locale,
  t,
  colorAccent,
  colorDanger,
  updateCheckoutForm,
}: {
  isLoading: boolean;
  checkoutForm: CheckoutFormState;
  cartProducts: CartItem[];
  selectedTable: POSTable | undefined;
  choicePresentation: OverlayChoicePresentation;
  pickerPresentation: OverlayChoicePresentation;
  locale: Locale;
  t: ReturnType<typeof useTranslation>["t"];
  colorAccent: string;
  colorDanger: string;
  updateCheckoutForm: (patch: Partial<CheckoutFormState>) => void;
}): JSX.Element {
  return (
    <View className="flex-row items-center justify-between gap-2 px-4 py-4">
      {isLoading ? (
        <>
          <View className="h-12 flex-row items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton
              className={
                checkoutForm.order_type === "dine-in"
                  ? "h-10 min-w-20 flex-1 rounded-md"
                  : "h-10 w-28 rounded-full"
              }
            />
            <Skeleton className="h-10 w-10 rounded-md" />
          </View>
          {cartProducts.length > 0 ? <Skeleton className="h-10 w-10 rounded-md" /> : null}
        </>
      ) : (
        <>
          <CartOrderControls
            checkoutForm={checkoutForm}
            selectedTable={selectedTable}
            choicePresentation={choicePresentation}
            pickerPresentation={pickerPresentation}
            locale={locale}
            t={t}
            colorAccent={colorAccent}
            updateCheckoutForm={updateCheckoutForm}
          />
          {cartProducts.length > 0 ? (
            <PanelButton
              variant="ghost"
              size="icon"
              accessibilityLabel={t("pos.clearCart")}
              onPress={resetCurrentOrder}
            >
              <AppIcon icon={AppIcons.trash} size={16} color={colorDanger} />
            </PanelButton>
          ) : null}
        </>
      )}
    </View>
  );
}

function CartItems({
  isLoading,
  cartProducts,
  productById,
  colorMuted,
  t,
}: {
  isLoading: boolean;
  cartProducts: CartItem[];
  productById: Map<string, POSProduct>;
  colorMuted: string;
  t: ReturnType<typeof useTranslation>["t"];
}): JSX.Element {
  return (
    <ScrollView
      className="flex-1 px-5"
      contentContainerClassName="pb-3"
      showsVerticalScrollIndicator={false}
    >
      {isLoading ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t("pos.loadingProducts")}
          accessibilityState={{ busy: true }}
        >
          {[0, 1].map((item) => (
            <View key={item} className="gap-3 border-b border-border py-3">
              <View className="flex-row items-center justify-between gap-3">
                <Skeleton className="h-5 w-3/5 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </View>
              <Skeleton className="h-4 w-2/5 rounded-md" />
              <View className="flex-row items-center justify-between gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-full" />
              </View>
            </View>
          ))}
        </View>
      ) : cartProducts.length === 0 ? (
        <EmptyState className="py-16">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <AppIcon icon={AppIcons.cart} size={20} color={colorMuted} />
            </EmptyState.Media>
            <EmptyState.Title>{t("pos.cartEmpty")}</EmptyState.Title>
            <EmptyState.Description>{t("pos.cartEmptyDescription")}</EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        cartProducts.map((item) => (
          <Animated.View key={item.id}>
            <CartItemRow item={item} product={productById.get(item.product_id)} />
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

function CartFooter({
  isLoading,
  itemCount,
  subtotal,
  cartProducts,
  t,
  onCheckout,
}: {
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  cartProducts: CartItem[];
  t: ReturnType<typeof useTranslation>["t"];
  onCheckout: () => void;
}): JSX.Element {
  return (
    <View className="px-5 py-4 gap-3">
      <View className="flex-row items-center justify-between">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </>
        ) : (
          <>
            <Typography type="body-sm" muted>
              {t(itemCount === 1 ? "pos.subtotalItemsOne" : "pos.subtotalItemsOther", {
                count: itemCount,
              })}
            </Typography>
            <Typography type="body-sm" weight="semibold" className="tabular-nums">
              {formatRupiah(subtotal)}
            </Typography>
          </>
        )}
      </View>
      <View className="flex-row items-center gap-1">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </>
        ) : (
          <>
            <ParkedOrdersPanel mode="park" isDisabled={cartProducts.length === 0} />
            <PanelButton
              className="flex-1"
              onPress={onCheckout}
              disabled={cartProducts.length === 0}
            >
              {t("navigation.checkout")}
            </PanelButton>
          </>
        )}
      </View>
    </View>
  );
}

export default function CartContent(): JSX.Element {
  const router = useRouter();
  const { present } = useTrueSheet();
  const { isCompact, isPortrait } = useResponsiveLayout();
  const { locale, t } = useTranslation();
  const { choicePresentation, pickerPresentation } = useOverlayPresentation();
  const [colorAccent, colorMuted, colorDanger] = useCSSVariable([
    "--color-primary",
    "--color-muted-foreground",
    "--color-destructive",
  ]) as [string, string, string];
  const cartProducts = useCartStore((s) => s.products);
  const itemCount = useCartStore((s) =>
    s.products.reduce((total, product) => total + product.qty, 0)
  );
  const totalPrice = useCartStore((s) => s.totalPrice);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);
  const updateCheckoutForm = usePOSStore((s) => s.updateCheckoutForm);
  const { data: catalogProducts, isLoading: isProductsLoading } = useProducts();
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
      <CartHeader
        isLoading={isProductsLoading}
        checkoutForm={checkoutForm}
        cartProducts={cartProducts}
        selectedTable={selectedTable}
        choicePresentation={choicePresentation}
        pickerPresentation={pickerPresentation}
        locale={locale}
        t={t}
        colorAccent={colorAccent}
        colorDanger={colorDanger}
        updateCheckoutForm={updateCheckoutForm}
      />
      <CartItems
        isLoading={isProductsLoading}
        cartProducts={cartProducts}
        productById={productById}
        colorMuted={colorMuted}
        t={t}
      />
      <Separator />
      <CartFooter
        isLoading={isProductsLoading}
        itemCount={itemCount}
        subtotal={subtotal}
        cartProducts={cartProducts}
        t={t}
        onCheckout={handleCheckout}
      />
      {usesCheckoutScreen ? null : <CheckoutSheet />}
    </View>
  );
}

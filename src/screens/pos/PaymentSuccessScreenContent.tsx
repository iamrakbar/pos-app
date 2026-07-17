import { usePOSStore } from "@/stores/usePOSStore";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { formatRupiah } from "@/utils/format";
import { Button, Chip, Dialog, Separator, Surface, Typography, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { ActivityIndicator, ScrollView, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PaymentSuccessContentProps = {
  onNewOrder?: () => void;
};

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type CheckoutData = App.Data.Merchant.Checkout.CheckoutData;

function ReceiptRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}): JSX.Element {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Typography
        className={emphasized ? "text-base font-bold text-neutral-950" : "text-xs text-neutral-700"}
      >
        {label}
      </Typography>
      <Typography
        className={
          emphasized
            ? "text-base font-bold text-neutral-950 tabular-nums"
            : "text-xs text-neutral-900 tabular-nums"
        }
      >
        {value}
      </Typography>
    </View>
  );
}

function ReceiptPreview({ order }: { order: CheckoutData }): JSX.Element {
  const settings = useReceiptStore((state) => state.settings);
  const totalQty = order.products.reduce((sum, product) => sum + product.qty, 0);
  const storeName = settings.storeName || order.merchant.name || "SOEAT POS";
  const customerName = order.customer?.name || "Walk-in";
  const orderType = order.order_type === "dine-in" ? "Dine-in" : "Takeaway";

  return (
    <View className="w-full max-w-xl self-center overflow-hidden rounded-lg bg-white">
      <View className="items-center gap-1 px-5 pt-6 pb-4">
        <Typography className="text-lg font-bold text-neutral-950 text-center">
          {storeName}
        </Typography>
        {[settings.storeAddress1, settings.storeAddress2, settings.storePhone]
          .filter(Boolean)
          .map((line) => (
            <Typography key={line} className="text-xs text-neutral-600 text-center">
              {line}
            </Typography>
          ))}
      </View>

      <View className="mx-5 border-t border-dashed border-neutral-300" />

      <View className="gap-1.5 px-5 py-4">
        <ReceiptRow label="Order" value={order.code} />
        <ReceiptRow label="Date" value={formatDateTime(new Date(order.created_at))} />
        <ReceiptRow label="Type" value={orderType} />
        {order.table?.name ? <ReceiptRow label="Table" value={order.table.name} /> : null}
        {settings.printCustomerName ? <ReceiptRow label="Customer" value={customerName} /> : null}
        <ReceiptRow label="Payment" value={order.payment.name} />
      </View>

      <View className="mx-5 border-t border-dashed border-neutral-300" />

      <View className="gap-4 px-5 py-4">
        {order.products.map((item, index) => (
          <View key={`${item.product_id}-${index}`} className="gap-1">
            <View className="flex-row items-start justify-between gap-4">
              <Typography className="flex-1 text-sm font-semibold text-neutral-950">
                {item.name}
              </Typography>
              <Typography className="text-sm font-semibold text-neutral-950 tabular-nums">
                {formatRupiah(item.subtotal)}
              </Typography>
            </View>
            <Typography className="text-xs text-neutral-600 tabular-nums">
              {item.qty} x {formatRupiah(item.price)}
            </Typography>
            {item.add_ons.map((addOn) => (
              <View key={addOn.id} className="gap-0.5 pl-3">
                <Typography className="text-[11px] font-semibold text-neutral-500">
                  {addOn.name}
                </Typography>
                {addOn.options.map((option) => (
                  <View key={option.id} className="flex-row justify-between gap-3">
                    <Typography className="flex-1 text-xs text-neutral-600">
                      + {option.name}
                    </Typography>
                    <Typography className="text-xs text-neutral-600 tabular-nums">
                      {option.price > 0 ? formatRupiah(option.price) : "Included"}
                    </Typography>
                  </View>
                ))}
              </View>
            ))}
            {item.notes ? (
              <Typography className="text-xs italic text-neutral-500">
                Note: {item.notes}
              </Typography>
            ) : null}
          </View>
        ))}
      </View>

      <View className="mx-5 border-t border-dashed border-neutral-300" />

      <View className="gap-2 px-5 py-4">
        <ReceiptRow label="Subtotal" value={formatRupiah(order.pricing.subtotal)} />
        {order.pricing.fees.map((fee) => (
          <ReceiptRow
            key={`${fee.type}-${fee.name}`}
            label={fee.name}
            value={formatRupiah(fee.amount)}
          />
        ))}
        {settings.showTotalQuantity ? (
          <ReceiptRow label={`${order.products.length} items · ${totalQty} qty`} value="" />
        ) : null}
        <View className="pt-2">
          <ReceiptRow label="Total" value={formatRupiah(order.pricing.total)} emphasized />
        </View>
      </View>

      {order.notes ? (
        <View className="mx-5 border-t border-dashed border-neutral-300 py-4">
          <Typography className="text-xs text-neutral-600">Note: {order.notes}</Typography>
        </View>
      ) : null}

      {settings.footer ? (
        <View className="items-center px-5 pt-2 pb-6">
          <Typography className="text-xs text-neutral-600 text-center">
            {settings.footer}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

export function PaymentSuccessContent({ onNewOrder }: PaymentSuccessContentProps): JSX.Element {
  const themeColorForeground = useThemeColor("foreground");
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const checkoutResult = usePOSStore((s) => s.checkoutResult);
  const closeModal = usePOSStore((s) => s.closeModal);
  const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth >= 900;
  const products = checkoutResult?.products ?? [];
  const totalQty = products.reduce((sum, product) => sum + product.qty, 0);

  const handleNewOrder = () => {
    closeModal();
    resetCheckoutForm();
    onNewOrder?.();
  };

  const handlePrintReceipt = async () => {
    if (!checkoutResult) {
      setPrompt({
        title: "Order data unavailable",
        message: "The completed order data is not available for receipt printing.",
      });
      return;
    }

    await printReceipt(checkoutResult);
  };

  if (!paymentSession) return <></>;

  const paidAt = new Date();

  return (
    <>
      <View className="flex-1 bg-background">
        <View className="bg-surface px-5 py-5">
          <View className="flex-row items-center justify-between gap-4">
            <Typography className="text-xl font-semibold text-foreground">
              Payment complete
            </Typography>
            <Chip color="success" variant="soft" size="sm">
              <Chip.Label>Paid</Chip.Label>
            </Chip>
          </View>
        </View>

        <Separator />

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="px-5 py-6 bg-background"
        >
          <View
            className={`w-full max-w-6xl self-center ${isWideLayout ? "flex-row items-start gap-5" : "gap-5"}`}
          >
            <View className={isWideLayout ? "w-[340px] gap-4" : "gap-4"}>
              <Surface className="items-center gap-3 p-5">
                <View className="w-14 h-14 rounded-full bg-success/10 items-center justify-center">
                  <View className="w-10 h-10 rounded-full bg-success items-center justify-center">
                    <Ionicons name="checkmark" size={24} color="white" />
                  </View>
                </View>
                <View className="items-center gap-1">
                  <Typography className="text-sm font-medium text-muted-foreground">
                    Amount paid
                  </Typography>
                  <Typography className="text-3xl font-bold text-foreground tabular-nums">
                    {formatRupiah(paymentSession.amount)}
                  </Typography>
                  <Typography className="text-xs text-muted-foreground font-mono">
                    {paymentSession.transaction_id}
                  </Typography>
                </View>
              </Surface>

              <Surface className="w-full overflow-hidden">
                <View className="px-5 py-4">
                  <Typography className="text-base font-semibold text-foreground">
                    Transaction
                  </Typography>
                </View>
                <View className="flex-row justify-between px-5 py-3">
                  <Typography className="text-sm text-muted-foreground">Payment method</Typography>
                  <Typography className="text-sm font-semibold text-foreground">
                    {paymentSession.payment_type}
                  </Typography>
                </View>
                {paymentSession.cash_received !== undefined ? (
                  <>
                    <View className="flex-row justify-between px-5 py-3">
                      <Typography className="text-sm text-muted-foreground">
                        Cash received
                      </Typography>
                      <Typography className="text-sm font-semibold text-foreground tabular-nums">
                        {formatRupiah(paymentSession.cash_received)}
                      </Typography>
                    </View>
                    <View className="flex-row justify-between px-5 py-3">
                      <Typography className="text-sm text-muted-foreground">Change</Typography>
                      <Typography className="text-sm font-semibold text-foreground tabular-nums">
                        {formatRupiah(paymentSession.change ?? 0)}
                      </Typography>
                    </View>
                  </>
                ) : null}
                <View className="flex-row justify-between px-5 py-3">
                  <Typography className="text-sm text-muted-foreground">Date & time</Typography>
                  <Typography className="text-sm font-semibold text-foreground">
                    {formatDateTime(paidAt)}
                  </Typography>
                </View>
                <View className="flex-row justify-between px-5 py-3">
                  <Typography className="text-sm text-muted-foreground">Items</Typography>
                  <Typography className="text-sm font-semibold text-foreground">
                    {totalQty} {totalQty === 1 ? "item" : "items"}
                  </Typography>
                </View>
              </Surface>
            </View>

            <View className="flex-1 gap-2">
              <View className="flex-row items-center justify-between gap-3">
                <Typography className="text-sm font-semibold text-foreground">
                  Receipt preview
                </Typography>
                <Typography className="text-xs text-muted-foreground">
                  {checkoutResult?.code}
                </Typography>
              </View>
              {checkoutResult ? (
                <View className="rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
                  <ReceiptPreview order={checkoutResult} />
                </View>
              ) : (
                <Surface className="items-center px-4 py-8">
                  <Typography className="text-sm text-muted-foreground">
                    Receipt data unavailable.
                  </Typography>
                </Surface>
              )}
            </View>
          </View>
        </ScrollView>

        <Separator />

        {/* Actions */}
        <View className="bg-surface px-5 py-4">
          <View className="w-full max-w-6xl self-center flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onPress={handlePrintReceipt}
              isDisabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator />
              ) : (
                <Ionicons name="print-outline" size={16} color={themeColorForeground} />
              )}
              <Button.Label className="ml-2">
                {isPrinting ? "Printing…" : "Print Receipt"}
              </Button.Label>
            </Button>
            <Button className="flex-1" onPress={handleNewOrder}>
              <Ionicons name="add-circle-outline" size={16} color="white" />
              <Button.Label className="ml-2">New Order</Button.Label>
            </Button>
          </View>
        </View>
      </View>

      <Dialog isOpen={prompt !== null} onOpenChange={(open) => !open && setPrompt(null)}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false} className="w-full max-w-md self-center">
            <Dialog.Close variant="ghost" />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>{prompt?.title}</Dialog.Title>
              {prompt?.message ? <Dialog.Description>{prompt.message}</Dialog.Description> : null}
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setPrompt(null)}>
                <Button.Label>{prompt?.actionLabel ? "Cancel" : "Close"}</Button.Label>
              </Button>
              {prompt?.actionLabel ? (
                <Button size="sm" onPress={handlePromptAction}>
                  <Button.Label>{prompt.actionLabel}</Button.Label>
                </Button>
              ) : null}
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

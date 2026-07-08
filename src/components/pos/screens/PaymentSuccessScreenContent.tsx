import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { formatRupiah } from "@/utils/format";
import { Button, Dialog, Separator, Surface, Typography, useThemeColor } from "heroui-native";
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

export function PaymentSuccessContent({ onNewOrder }: PaymentSuccessContentProps): JSX.Element {
  const themeColorForeground = useThemeColor("foreground");
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const checkoutResult = usePOSStore((s) => s.checkoutResult);
  const closeModal = usePOSStore((s) => s.closeModal);
  const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const products = useCartStore((s) => s.products);
  const totalQty = useCartStore((s) => s.totalQty);
  const clearCart = useCartStore((s) => s.clearCart);

  const { height: windowHeight } = useWindowDimensions();

  const handleNewOrder = () => {
    closeModal();
    clearCart();
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

  const dialogMaxHeight = windowHeight * 0.88;
  const scrollMaxHeight = dialogMaxHeight - 220;
  const paidAt = new Date();

  return (
    <>
      <View
        className="flex-1 w-full max-w-md self-center bg-background p-0 overflow-hidden"
        style={{ maxHeight: dialogMaxHeight }}
      >
        {/* Header */}
        <View className="flex-row justify-between gap-4 bg-surface p-4">
          <View className="gap-0.5">
            <Typography className="text-lg font-semibold text-foreground">
              Payment Success
            </Typography>
            <Typography className="text-sm text-muted-foreground">Transaction completed</Typography>
          </View>
        </View>

        <Separator />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: scrollMaxHeight }}
          contentContainerClassName="p-4 gap-4 bg-background"
        >
          {/* Success indicator */}
          <View className="items-center gap-3 py-4">
            <View className="w-20 h-20 rounded-full bg-green-500/10 items-center justify-center">
              <View className="w-14 h-14 rounded-full bg-green-500 items-center justify-center">
                <Ionicons name="checkmark" size={32} color="white" />
              </View>
            </View>
            <View className="items-center gap-1">
              <Typography className="text-2xl font-bold text-green-500">
                {formatRupiah(paymentSession.amount)}
              </Typography>
              <Typography className="text-xs text-muted-foreground font-mono">
                {paymentSession.transaction_id}
              </Typography>
            </View>
          </View>

          {/* Transaction details */}
          <Surface className="w-full overflow-hidden">
            <View className="flex-row justify-between px-4 py-3 border-b border-border">
              <Typography className="text-sm text-muted-foreground">Payment method</Typography>
              <Typography className="text-sm font-semibold text-foreground">
                {paymentSession.payment_type}
              </Typography>
            </View>
            <View className="flex-row justify-between px-4 py-3 border-b border-border">
              <Typography className="text-sm text-muted-foreground">Date & time</Typography>
              <Typography className="text-sm font-semibold text-foreground">
                {formatDateTime(paidAt)}
              </Typography>
            </View>
            <View className="flex-row justify-between px-4 py-3">
              <Typography className="text-sm text-muted-foreground">Items</Typography>
              <Typography className="text-sm font-semibold text-foreground">
                {totalQty()} {totalQty() === 1 ? "item" : "items"}
              </Typography>
            </View>
          </Surface>

          {/* Order items */}
          {products.length > 0 && (
            <View className="gap-2">
              <Typography className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Order summary
              </Typography>
              <Surface className="w-full overflow-hidden">
                {products.map((item, index) => (
                  <View
                    key={item.id}
                    className={`flex-row items-start justify-between px-4 py-3 gap-4 ${index < products.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <View className="flex-1 gap-0.5">
                      <Typography className="text-sm text-foreground" numberOfLines={1}>
                        {item.name}
                      </Typography>
                      {item.add_ons.length > 0 && (
                        <Typography className="text-xs text-muted-foreground" numberOfLines={1}>
                          {item.add_ons.flatMap((ao) => ao.options.map((o) => o.name)).join(", ")}
                        </Typography>
                      )}
                      {item.notes && (
                        <Typography
                          className="text-xs text-muted-foreground italic"
                          numberOfLines={1}
                        >
                          {item.notes}
                        </Typography>
                      )}
                    </View>
                    <View className="items-end gap-0.5">
                      <Typography className="text-sm font-semibold text-foreground">
                        {formatRupiah(item.price * item.qty)}
                      </Typography>
                      <Typography className="text-xs text-muted-foreground">
                        {item.qty} × {formatRupiah(item.price)}
                      </Typography>
                    </View>
                  </View>
                ))}
              </Surface>
            </View>
          )}
        </ScrollView>

        <Separator />

        {/* Actions */}
        <View className="flex-row gap-3 bg-surface p-4">
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
          <Button className="flex-1 bg-green-500 border-green-500" onPress={handleNewOrder}>
            <Ionicons name="add-circle-outline" size={16} color="white" />
            <Button.Label className="ml-2">New Order</Button.Label>
          </Button>
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

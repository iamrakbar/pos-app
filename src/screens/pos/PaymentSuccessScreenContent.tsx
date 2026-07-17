import { usePOSStore } from "@/stores/usePOSStore";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { formatRupiah } from "@/utils/format";
import {
  Button,
  Dialog,
  Separator,
  Spinner,
  Surface,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useEffect, useRef, useState, type JSX } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PaymentSuccessContentProps = {
  onNewOrder?: () => void;
};

function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
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
  const receiptSettings = useReceiptStore((state) => state.settings);
  const updateReceiptSettings = useReceiptStore((state) => state.updateSettings);
  const closeModal = usePOSStore((s) => s.closeModal);
  const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const products = checkoutResult?.products ?? [];
  const totalQty = products.reduce((sum, product) => sum + product.qty, 0);
  const autoPrintedOrderRef = useRef<string | null>(null);
  const [paidAt] = useState(() => new Date());

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

    await printReceipt(checkoutResult, "manual");
  };

  useEffect(() => {
    if (
      !receiptSettings.autoPrintOnSuccess ||
      !checkoutResult ||
      receiptSettings.lastAutoPrintedOrderId === checkoutResult.id ||
      autoPrintedOrderRef.current === checkoutResult.code
    ) {
      return;
    }

    autoPrintedOrderRef.current = checkoutResult.code;
    void printReceipt(checkoutResult, "auto").then((printed) => {
      if (printed) updateReceiptSettings({ lastAutoPrintedOrderId: checkoutResult.id });
    });
  }, [checkoutResult, printReceipt, receiptSettings, updateReceiptSettings]);

  if (!paymentSession) return <></>;

  return (
    <>
      <View className="flex-1 bg-background p-safe">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="flex-grow px-5 py-8 bg-background"
        >
          <View className="w-full max-w-xl self-center gap-6">
            <View className="items-center gap-3 py-2">
              <View className="w-14 h-14 rounded-full bg-success items-center justify-center">
                <Ionicons name="checkmark" size={28} color="white" />
              </View>
              <View className="items-center gap-1.5">
                <Typography type="h4" weight="bold">
                  Payment Complete
                </Typography>
                <Typography type="h2" weight="bold" className="tabular-nums">
                  {formatRupiah(paymentSession.amount)}
                </Typography>
                <Typography type="body-xs" color="muted" className="font-mono">
                  {checkoutResult?.code ?? paymentSession.transaction_id}
                </Typography>
              </View>
            </View>

            <Surface className="w-full p-5 gap-3">
              <View className="flex-row justify-between gap-4">
                <Typography type="body-sm" color="muted">
                  Payment method
                </Typography>
                <Typography type="body-sm" weight="semibold">
                  {paymentSession.payment_type}
                </Typography>
              </View>
              {paymentSession.cash_received !== undefined ? (
                <>
                  <View className="flex-row justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      Cash received
                    </Typography>
                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                      {formatRupiah(paymentSession.cash_received)}
                    </Typography>
                  </View>
                  <View className="flex-row justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      Change
                    </Typography>
                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                      {formatRupiah(paymentSession.change ?? 0)}
                    </Typography>
                  </View>
                </>
              ) : null}
              <View className="flex-row justify-between gap-4">
                <Typography type="body-sm" color="muted">
                  Date & time
                </Typography>
                <Typography type="body-sm" weight="semibold" className="text-right">
                  {formatDateTime(paidAt)}
                </Typography>
              </View>
              <View className="flex-row justify-between gap-4">
                <Typography type="body-sm" color="muted">
                  Items
                </Typography>
                <Typography type="body-sm" weight="semibold">
                  {totalQty} {totalQty === 1 ? "item" : "items"}
                </Typography>
              </View>
              {checkoutResult?.code ? (
                <View className="flex-row justify-between gap-4">
                  <Typography type="body-sm" color="muted">
                    Order
                  </Typography>
                  <Typography type="body-sm" weight="semibold" className="font-mono">
                    {checkoutResult.code}
                  </Typography>
                </View>
              ) : null}
            </Surface>
          </View>
        </ScrollView>

        <Separator />

        {/* Actions */}
        <View className="bg-surface px-5 py-4">
          <View className="w-full max-w-xl self-center gap-3">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  Auto-print on success
                </Typography>
                <Typography type="body-xs" color="muted">
                  Print completed payments automatically.
                </Typography>
              </View>
              <Switch
                isSelected={receiptSettings.autoPrintOnSuccess}
                onSelectedChange={(isSelected) =>
                  updateReceiptSettings({ autoPrintOnSuccess: isSelected })
                }
              >
                <Switch.Thumb />
              </Switch>
            </View>
            <View className="flex-row gap-3">
              {!receiptSettings.autoPrintOnSuccess ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={handlePrintReceipt}
                  isDisabled={isPrinting}
                >
                  {isPrinting ? (
                    <Spinner size="sm" />
                  ) : (
                    <Ionicons name="print-outline" size={16} color={themeColorForeground} />
                  )}
                  <Button.Label className="ml-2">
                    {isPrinting ? "Printing…" : "Print Receipt"}
                  </Button.Label>
                </Button>
              ) : null}
              <Button className="flex-1" onPress={handleNewOrder}>
                <Ionicons name="add-circle-outline" size={16} color="white" />
                <Button.Label className="ml-2">New Order</Button.Label>
              </Button>
            </View>
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

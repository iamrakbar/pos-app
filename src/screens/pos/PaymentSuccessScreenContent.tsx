import { usePOSStore } from "@/stores/usePOSStore";
import { useReceiptPrinter } from "@/hooks/printer/useReceiptPrinter";
import { useReceiptStore } from "@/stores/useReceiptStore";
import { usePrinterStore } from "@/stores/usePrinterStore";
import { ReceiptPaper } from "@/components/receipt/ReceiptPaper";
import { toReceiptData } from "@/services/printer/receiptData";
import { formatRupiah } from "@/utils/format";
import {
  Button,
  Chip,
  Dialog,
  Separator,
  Spinner,
  Surface,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useEffect, useRef, type JSX } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
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
  const paperWidth = usePrinterStore((state) => state.settings.paperWidth);
  const charactersPerLine = usePrinterStore((state) => state.settings.charactersPerLine);
  const closeModal = usePOSStore((s) => s.closeModal);
  const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth >= 900;
  const products = checkoutResult?.products ?? [];
  const totalQty = products.reduce((sum, product) => sum + product.qty, 0);
  const autoPrintedOrderRef = useRef<string | null>(null);

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
                  <ReceiptPaper
                    settings={receiptSettings}
                    data={toReceiptData(checkoutResult)}
                    paperWidth={paperWidth}
                    charactersPerLine={charactersPerLine}
                  />
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
          <View className="w-full max-w-6xl self-center gap-3">
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

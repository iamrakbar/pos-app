import { usePOSStore } from "@/stores/use-pos-store";
import { useReceiptPrinter } from "@/hooks/printer/use-receipt-printer";
import { useReceiptStore } from "@/stores/use-receipt-store";
import { formatDateTime, formatRupiah } from "@/utils/format";
import {
  Button,
  Separator,
  Spinner,
  Surface,
  Switch,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useEffect, useRef, useState, type JSX } from "react";
import { ScrollView, View } from "react-native";
import AppIcon from "@/components/common/app-icon";
import ActionDialog from "@/components/common/action-dialog";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useTranslation } from "@/stores/use-locale";

type PaymentSuccessContentProps = {
  onNewOrder?: () => void;
};

export function PaymentSuccessContent({ onNewOrder }: PaymentSuccessContentProps): JSX.Element {
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const themeColorForeground = useThemeColor("foreground");
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const checkoutResult = usePOSStore((s) => s.checkoutResult);
  const receiptSettings = useReceiptStore((state) => state.settings);
  const updateReceiptSettings = useReceiptStore((state) => state.updateSettings);
  const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);
  const { isPrinting, prompt, setPrompt, handlePromptAction, printReceipt } = useReceiptPrinter();

  const products = checkoutResult?.products ?? [];
  const totalQty = products.reduce((sum, product) => sum + product.qty, 0);
  const autoPrintedOrderRef = useRef<string | null>(null);
  const [paidAt] = useState(() => new Date());

  const handleNewOrder = () => {
    resetCheckoutForm();
    onNewOrder?.();
  };

  const handlePrintReceipt = async () => {
    if (!checkoutResult) {
      setPrompt({
        title: t("paymentSuccess.orderUnavailable"),
        message: t("paymentSuccess.orderUnavailableDescription"),
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
      <View className="flex-1 bg-background">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="flex-grow bg-background px-safe pb-8 pt-safe"
        >
          <View className="w-full max-w-xl self-center gap-6 px-5 pt-8">
            <View className="items-center gap-3 py-2">
              <View className="w-14 h-14 rounded-full bg-success items-center justify-center">
                <AppIcon name="checkmark" size={28} color="white" />
              </View>
              <View className="items-center gap-1.5">
                <Typography type="h4" weight="bold">
                  {t("paymentSuccess.complete")}
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
                  {t("payment.method")}
                </Typography>
                <Typography type="body-sm" weight="semibold">
                  {paymentSession.payment_type}
                </Typography>
              </View>
              {paymentSession.cash_received !== undefined ? (
                <>
                  <View className="flex-row justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      {t("paymentSuccess.cashReceived")}
                    </Typography>
                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                      {formatRupiah(paymentSession.cash_received)}
                    </Typography>
                  </View>
                  <View className="flex-row justify-between gap-4">
                    <Typography type="body-sm" color="muted">
                      {t("paymentSuccess.change")}
                    </Typography>
                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                      {formatRupiah(paymentSession.change ?? 0)}
                    </Typography>
                  </View>
                </>
              ) : null}
              <View className="flex-row justify-between gap-4">
                <Typography type="body-sm" color="muted">
                  {t("paymentSuccess.dateTime")}
                </Typography>
                <Typography type="body-sm" weight="semibold" className="text-right">
                  {formatDateTime(paidAt)}
                </Typography>
              </View>
              <View className="flex-row justify-between gap-4">
                <Typography type="body-sm" color="muted">
                  {t("paymentSuccess.items")}
                </Typography>
                <Typography type="body-sm" weight="semibold">
                  {t(totalQty === 1 ? "paymentSuccess.itemOne" : "paymentSuccess.itemOther", {
                    count: totalQty,
                  })}
                </Typography>
              </View>
              {checkoutResult?.code ? (
                <View className="flex-row justify-between gap-4">
                  <Typography type="body-sm" color="muted">
                    {t("paymentSuccess.order")}
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
        <View className="bg-surface px-safe pb-safe">
          <View className="w-full max-w-xl self-center gap-3 px-5 py-4">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" weight="semibold">
                  {t("paymentSuccess.autoPrint")}
                </Typography>
                <Typography type="body-xs" color="muted">
                  {t("paymentSuccess.autoPrintDescription")}
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
            <View className={`gap-3 ${isCompact ? "" : "flex-row"}`}>
              {!receiptSettings.autoPrintOnSuccess ? (
                <Button
                  variant="outline"
                  className={isCompact ? "w-full" : "flex-1"}
                  onPress={handlePrintReceipt}
                  isDisabled={isPrinting}
                >
                  {isPrinting ? (
                    <Spinner size="sm" />
                  ) : (
                    <AppIcon name="print-outline" size={16} color={themeColorForeground} />
                  )}
                  <Button.Label className="ml-2">
                    {isPrinting ? t("paymentSuccess.printing") : t("paymentSuccess.printReceipt")}
                  </Button.Label>
                </Button>
              ) : null}
              <Button className={isCompact ? "w-full" : "flex-1"} onPress={handleNewOrder}>
                <AppIcon name="add-circle-outline" size={16} color="white" />
                <Button.Label className="ml-2">{t("paymentSuccess.newOrder")}</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </View>

      <ActionDialog
        isOpen={prompt !== null}
        onOpenChange={(open) => !open && setPrompt(null)}
        title={prompt?.title}
        description={prompt?.message}
        cancelLabel={prompt?.actionLabel ? t("common.cancel") : t("common.close")}
        actionLabel={prompt?.actionLabel}
        onAction={handlePromptAction}
      />
    </>
  );
}

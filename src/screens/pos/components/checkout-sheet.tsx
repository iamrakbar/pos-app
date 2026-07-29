import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { CheckoutContent } from "@/screens/pos/components/checkout-content";
import { usePOSStore } from "@/stores/use-pos-store";
import { useTranslation } from "@/stores/use-locale";
import type { PaymentSession } from "@/types/pos";
import { useCartStore } from "@/stores/use-cart-store";
import { useTrueSheet } from "@lodev09/react-native-true-sheet";
import { useRouter } from "expo-router";
import { Separator, Typography } from "heroui-native";
import type { JSX } from "react";
import { InteractionManager, View } from "react-native";

export const POS_CHECKOUT_SHEET_NAME = "pos-checkout";

export default function CheckoutSheet(): JSX.Element {
  const router = useRouter();
  const { dismiss } = useTrueSheet();
  const { t } = useTranslation();
  const setPaymentSession = usePOSStore((state) => state.setPaymentSession);
  const clearCart = useCartStore((state) => state.clearCart);

  const handlePaymentReady = (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { isCash: boolean }
  ) => {
    setPaymentSession(session, result);
    clearCart();
    router.push(options.isCash ? "/pos/payment-success" : "/pos/payment");

    InteractionManager.runAfterInteractions(() => {
      void dismiss(POS_CHECKOUT_SHEET_NAME);
    });
  };

  const header = (
    <View className="bg-surface">
      <View className="px-5 pb-4 pt-safe">
        <Typography type="h4" weight="semibold">
          {t("navigation.checkout")}
        </Typography>
      </View>
      <Separator />
    </View>
  );

  return (
    <CheckoutContent
      presentation="sheet"
      sheetName={POS_CHECKOUT_SHEET_NAME}
      header={header}
      onPaymentReady={handlePaymentReady}
    />
  );
}

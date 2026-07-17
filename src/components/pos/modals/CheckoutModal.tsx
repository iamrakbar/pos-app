import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { CheckoutContent } from "@/screens/pos/CheckoutScreenContent";
import { usePOSStore } from "@/stores/usePOSStore";
import type { PaymentSession } from "@/types/pos";
import { Dialog } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View, useWindowDimensions } from "react-native";

export default function CheckoutModal(): JSX.Element {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const modal = usePOSStore((state) => state.modal);
  const closeModal = usePOSStore((state) => state.closeModal);
  const openPaymentModal = usePOSStore((state) => state.openPaymentModal);
  const setPaymentSession = usePOSStore((state) => state.setPaymentSession);

  const handlePaymentReady = (
    session: PaymentSession,
    result: MerchantCheckoutData,
    options: { isCash: boolean }
  ) => {
    if (options.isCash) {
      setPaymentSession(session, result);
      closeModal();
      router.push("/pos/payment-success" as never);
      return;
    }
    openPaymentModal(session, result);
  };

  return (
    <Dialog isOpen={modal === "checkout"} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          isSwipeable={false}
          accessibilityLabel="Checkout"
          className="w-full max-w-3xl self-center bg-background p-0 overflow-hidden"
          style={{
            width: Math.min(width * 0.9, 680),
            height: Math.min(height * 0.86, 920),
          }}
        >
          <View className="flex-row items-center justify-between bg-surface px-5 py-4">
            <Dialog.Title>Checkout</Dialog.Title>
            <Dialog.Close />
          </View>
          <CheckoutContent onCancel={closeModal} onPaymentReady={handlePaymentReady} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

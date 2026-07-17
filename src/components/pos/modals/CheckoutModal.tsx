import type { MerchantCheckoutData } from "@/api/endpoints/checkout";
import { CheckoutContent } from "@/screens/pos/CheckoutScreenContent";
import { usePOSStore } from "@/stores/usePOSStore";
import type { PaymentSession } from "@/types/pos";
import { Dialog } from "heroui-native";
import type { JSX } from "react";
import { useWindowDimensions } from "react-native";

export default function CheckoutModal(): JSX.Element {
  const { width, height } = useWindowDimensions();
  const modal = usePOSStore((state) => state.modal);
  const closeModal = usePOSStore((state) => state.closeModal);
  const openPaymentModal = usePOSStore((state) => state.openPaymentModal);

  const handlePaymentReady = (session: PaymentSession, result: MerchantCheckoutData) => {
    openPaymentModal(session, result);
  };

  return (
    <Dialog isOpen={modal === "checkout"} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          isSwipeable={false}
          accessibilityLabel="Checkout"
          className="overflow-hidden bg-background p-0"
          style={{
            width: Math.min(width * 0.92, 1120),
            height: height * 0.9,
          }}
        >
          <CheckoutContent onCancel={closeModal} onPaymentReady={handlePaymentReady} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

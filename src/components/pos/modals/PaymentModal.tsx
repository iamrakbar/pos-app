import { PaymentContent } from "@/screens/pos/PaymentScreenContent";
import { usePOSStore } from "@/stores/usePOSStore";
import { useRouter } from "expo-router";
import { Dialog } from "heroui-native";
import type { JSX } from "react";
import { useWindowDimensions } from "react-native";

export default function PaymentModal(): JSX.Element {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const modal = usePOSStore((state) => state.modal);
  const closeModal = usePOSStore((state) => state.closeModal);

  const handlePaymentSuccess = () => {
    closeModal();
    router.push("/pos/payment-success" as never);
  };

  return (
    <Dialog isOpen={modal === "payment"} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          isSwipeable={false}
          accessibilityLabel="Payment"
          className="overflow-hidden bg-background p-0"
          style={{
            width: Math.min(width * 0.88, 960),
            height: height * 0.88,
          }}
        >
          <PaymentContent onClose={closeModal} onPaymentSuccess={handlePaymentSuccess} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

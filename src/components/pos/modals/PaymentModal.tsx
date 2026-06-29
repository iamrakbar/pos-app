import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { formatRupiah } from '@/utils/format';
import { Button, Dialog, Separator, Text } from 'heroui-native';
import type { JSX } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentModal(): JSX.Element {
  const modal = usePOSStore((s) => s.modal);
  const paymentSession = usePOSStore((s) => s.paymentSession);
  const closeModal = usePOSStore((s) => s.closeModal);
  const resetCheckoutForm = usePOSStore((s) => s.resetCheckoutForm);
  const clearCart = useCartStore((s) => s.clearCart);

  const isOpen = modal === 'payment';

  const handleClose = () => {
    closeModal();
    clearCart();
    resetCheckoutForm();
  };

  const handleCheckPayment = () => {
    // No-op for UI — will wire to API later
  };

  if (!paymentSession) return <></>;

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="w-[90%] max-w-md">
          {/* Icon + Header */}
          <View className="items-center gap-3 pb-4">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="receipt-outline" size={28} color="#06b6d4" />
            </View>
            <View className="items-center gap-1">
              <Text className="text-lg font-semibold text-foreground">Payment</Text>
              <Text className="text-sm text-muted-foreground text-center">
                Please continue making payment
              </Text>
            </View>
          </View>

          <Separator />

          {/* Payment details */}
          <View className="items-center gap-3 py-6">
            <Text className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {paymentSession.payment_type}
            </Text>
            <Text className="text-xs text-muted-foreground font-mono">
              {paymentSession.transaction_id}
            </Text>

            {/* QR Code placeholder */}
            <View className="w-48 h-48 bg-foreground rounded-lg items-center justify-center">
              <View className="w-44 h-44 bg-background items-center justify-center rounded">
                <Ionicons name="qr-code-outline" size={160} color="#000" />
              </View>
            </View>

            <Text className="text-base font-semibold text-foreground">
              {formatRupiah(paymentSession.amount)}
            </Text>
          </View>

          <Separator />

          {/* Actions */}
          <View className="flex-row gap-3 pt-4">
            <Button
              className="flex-1 bg-green-500 border-green-500"
              onPress={handleCheckPayment}
            >
              <Ionicons name="refresh-outline" size={16} color="white" />
              <Button.Label className="ml-2">Check Payment</Button.Label>
            </Button>
            <Button variant="outline" onPress={handleClose}>
              Close
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

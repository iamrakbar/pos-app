import { usePOSStore } from '@/stores/usePOSStore';
import { usePaymentStatus } from '@/hooks/db/usePaymentStatus';
import { formatRupiah } from '@/utils/format';
import { getErrorMessage } from '@/api/ApiError';
import { Button, Dialog, Separator, Surface, Typography } from 'heroui-native';
import type { JSX } from 'react';
import { ActivityIndicator, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentModal(): JSX.Element {
    const modal = usePOSStore((s) => s.modal);
    const paymentSession = usePOSStore((s) => s.paymentSession);
    const closeModal = usePOSStore((s) => s.closeModal);
    const openPaymentSuccessModal = usePOSStore((s) => s.openPaymentSuccessModal);
    const { height: windowHeight } = useWindowDimensions();

    const paymentStatus = usePaymentStatus(paymentSession?.order_id);

    const isOpen = modal === 'payment';

    if (!paymentSession) return <></>;

    const dialogMaxHeight = windowHeight * 0.88;

    const handleCheckPayment = () => {
        paymentStatus.mutate(undefined, {
            onSuccess: (data) => {
                if (data.is_successful) openPaymentSuccessModal();
            },
        });
    };

    return (
        <Dialog isOpen={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    isSwipeable={false}
                    className="w-full max-w-md self-center bg-background p-0 overflow-hidden"
                    style={{ maxHeight: dialogMaxHeight }}
                >
                    <View className="flex-row justify-between gap-4 bg-surface p-4">
                        <View className="gap-0.5">
                            <Dialog.Title>Payment</Dialog.Title>
                            <Typography className="text-sm text-muted-foreground">
                                Please continue making payment
                            </Typography>
                        </View>
                        <Dialog.Close />
                    </View>

                    <Separator />

                    <Surface className="w-full items-center gap-3 py-8">
                        <Typography className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            {paymentSession.payment_type}
                        </Typography>
                        <Typography className="text-xs text-muted-foreground font-mono">
                            {paymentSession.transaction_id}
                        </Typography>

                        <View className="w-48 h-48 bg-foreground rounded-lg items-center justify-center">
                            <View className="w-44 h-44 bg-background items-center justify-center rounded">
                                <Ionicons name="qr-code-outline" size={160} color="#000" />
                            </View>
                        </View>

                        <Typography className="text-base font-semibold text-foreground">
                            {formatRupiah(paymentSession.amount)}
                        </Typography>

                        {paymentStatus.isSuccess && !paymentStatus.data.is_successful && (
                            <Typography className="text-xs text-warning">
                                {paymentStatus.data.payment_status_label ?? 'Menunggu pembayaran'}
                            </Typography>
                        )}
                        {paymentStatus.isError && (
                            <Typography className="text-xs text-danger">
                                {getErrorMessage(paymentStatus.error)}
                            </Typography>
                        )}
                    </Surface>

                    <Separator />

                    <View className="flex-row gap-3 bg-surface p-4">
                        <Button
                            className="flex-1 bg-green-500 border-green-500"
                            onPress={handleCheckPayment}
                            isDisabled={paymentStatus.isPending}
                        >
                            {paymentStatus.isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="refresh-outline" size={16} color="white" />
                                    <Button.Label className="ml-2">Check Payment</Button.Label>
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onPress={closeModal}>
                            Close
                        </Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

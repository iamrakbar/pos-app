import { getErrorMessage } from "@/api/api-error";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useMerchantPayments, useUpdateMerchantPayment } from "@/hooks/db/use-payments";
import { useTranslation } from "@/stores/use-locale";
import { Image } from "expo-image";
import { ListGroup, Separator, Switch, Typography, useToast } from "heroui-native";
import { ScrollView, View } from "react-native";

type MerchantPayment = App.Data.Merchant.Payment.MerchantPaymentData;

function PaymentSettingsRow({ payment }: { payment: MerchantPayment }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updatePayment = useUpdateMerchantPayment();

  const update = async (body: App.Requests.Merchant.Payment.UpdateMerchantPaymentRequest) => {
    try {
      await updatePayment.mutateAsync({ paymentId: payment.id, body });
      toast.show({ variant: "success", label: t("paymentSettings.updated") });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("paymentSettings.updateFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <ListGroup.Item>
      <ListGroup.ItemPrefix>
        <View className="flex-1 size-8">
          <Image
            source={{ uri: payment.image ?? "" }}
            contentFit="contain"
            style={{
              flex: 1,
              width: "100%",
            }}
          />
        </View>
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{payment.name}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>
          {payment.group.label} · {payment.processing_mode.label}
        </ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch
          isSelected={payment.is_active}
          isDisabled={updatePayment.isPending}
          onSelectedChange={(active) => void update({ active, sort: payment.sort })}
          accessibilityLabel={t("paymentSettings.toggle", { name: payment.name })}
        >
          <Switch.Thumb />
        </Switch>
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

export default function PaymentSettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const payments = useMerchantPayments();

  if (payments.isLoading) return <LoadingState message={t("paymentSettings.loading")} />;
  if (payments.isError) return <ErrorState error={payments.error} onRetry={payments.refetch} />;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="items-center px-4 py-6 pb-safe-offset-6 md:px-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-3xl gap-4">
        {payments.data?.length ? (
          <ListGroup>
            {[...payments.data]
              .sort((a, b) => a.sort - b.sort)
              .map((payment, index) => (
                <View key={payment.id}>
                  {index !== 0 && <Separator className="mx-4" />}
                  <PaymentSettingsRow payment={payment} />
                </View>
              ))}
          </ListGroup>
        ) : (
          <Typography color="muted">{t("paymentSettings.empty")}</Typography>
        )}
      </View>
    </ScrollView>
  );
}

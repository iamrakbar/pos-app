import { getErrorMessage } from "@/api/api-error";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useMerchantPayments, useUpdateMerchantPayment } from "@/hooks/db/use-payments";
import { useTranslation } from "@/stores/use-locale";
import { Button, Card, Input, Label, Switch, TextField, Typography, useToast } from "heroui-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";

type MerchantPayment = App.Data.Merchant.Payment.MerchantPaymentData;

function PaymentSettingsRow({ payment }: { payment: MerchantPayment }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const updatePayment = useUpdateMerchantPayment();
  const [displayName, setDisplayName] = useState(payment.name);

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
    <Card className="gap-4">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <Card.Title>{payment.name}</Card.Title>
          <Card.Description>
            {payment.group.label} · {payment.processing_mode.label}
          </Card.Description>
        </View>
        <Switch
          isSelected={payment.is_active}
          isDisabled={updatePayment.isPending}
          onSelectedChange={(active) => void update({ active, sort: payment.sort })}
          accessibilityLabel={t("paymentSettings.toggle", { name: payment.name })}
        >
          <Switch.Thumb />
        </Switch>
      </Card.Header>
      <Card.Body className="gap-3">
        <TextField>
          <Label>{t("paymentSettings.displayName")}</Label>
          <Input value={displayName} onChangeText={setDisplayName} maxLength={255} />
        </TextField>
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          isDisabled={updatePayment.isPending || displayName.trim() === payment.name}
          onPress={() =>
            void update({
              active: payment.is_active,
              sort: payment.sort,
              display_name: displayName.trim() || null,
            })
          }
        >
          <Button.Label>
            {updatePayment.isPending ? t("common.saving") : t("common.save")}
          </Button.Label>
        </Button>
      </Card.Body>
    </Card>
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
        <View className="gap-1">
          <Typography type="h4" weight="semibold">
            {t("paymentSettings.title")}
          </Typography>
          <Typography type="body-sm" color="muted">
            {t("paymentSettings.description")}
          </Typography>
        </View>
        {payments.data?.length ? (
          [...payments.data]
            .sort((a, b) => a.sort - b.sort)
            .map((payment) => <PaymentSettingsRow key={payment.id} payment={payment} />)
        ) : (
          <Typography color="muted">{t("paymentSettings.empty")}</Typography>
        )}
      </View>
    </ScrollView>
  );
}

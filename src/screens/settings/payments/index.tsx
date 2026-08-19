import { getErrorMessage } from "@/api/api-error";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import AppIcon from "@/components/common/app-icon";
import { useMerchantPayments, useReorderMerchantPayments } from "@/hooks/db/use-payments";
import { useTranslation } from "@/stores/use-locale";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import {
  Button,
  ListGroup,
  Separator,
  Switch,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import React from "react";
import { ScrollView, View } from "react-native";

type MerchantPayment = App.Data.Merchant.Payment.MerchantPaymentData;
type PaymentGroupSection = { key: string; label: string; payments: MerchantPayment[] };

function groupPayments(payments: MerchantPayment[]): PaymentGroupSection[] {
  const sections: PaymentGroupSection[] = [];
  const sectionByKey = new Map<string, PaymentGroupSection>();
  for (const payment of payments) {
    const groupValue = payment.group.value;
    let section = sectionByKey.get(groupValue);
    if (!section) {
      section = { key: groupValue, label: payment.group.label, payments: [] };
      sectionByKey.set(groupValue, section);
      sections.push(section);
    }
    section.payments.push(payment);
  }
  return sections;
}

function movePaymentWithinGroup(
  payments: MerchantPayment[],
  paymentId: string,
  direction: -1 | 1
): MerchantPayment[] {
  const item = payments.find((payment) => payment.id === paymentId);
  if (!item) return payments;

  const groupIndexes = payments.reduce<number[]>((indexes, payment, index) => {
    if (payment.group.value === item.group.value) indexes.push(index);
    return indexes;
  }, []);
  const positionInGroup = groupIndexes.indexOf(payments.indexOf(item));
  const targetPosition = positionInGroup + direction;
  if (targetPosition < 0 || targetPosition >= groupIndexes.length) return payments;

  const sourceIndex = groupIndexes[positionInGroup]!;
  const targetIndex = groupIndexes[targetPosition]!;
  const next = [...payments];
  [next[sourceIndex], next[targetIndex]] = [next[targetIndex]!, next[sourceIndex]!];
  return next;
}

function togglePaymentActive(
  payments: MerchantPayment[],
  paymentId: string,
  active: boolean
): MerchantPayment[] {
  return payments.map((payment) =>
    payment.id === paymentId ? { ...payment, is_active: active } : payment
  );
}

function PaymentSettingsRow({
  payment,
  isFirstInGroup,
  isLastInGroup,
  isSaving,
  onMove,
  onToggle,
}: {
  payment: MerchantPayment;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isSaving: boolean;
  onMove: (paymentId: string, direction: -1 | 1) => void;
  onToggle: (paymentId: string, active: boolean) => void;
}) {
  const { t } = useTranslation();
  const [mutedColor] = useThemeColor(["muted"]);

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
        <ListGroup.ItemDescription>{payment.processing_mode.label}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <View className="flex-row items-center gap-2">
          <View className="flex-row">
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              accessibilityLabel={t("paymentSettings.moveUpAccessibility", {
                name: payment.name,
              })}
              isDisabled={isFirstInGroup || isSaving}
              onPress={() => onMove(payment.id, -1)}
            >
              <AppIcon name="chevron-up" size={18} color={mutedColor} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              accessibilityLabel={t("paymentSettings.moveDownAccessibility", {
                name: payment.name,
              })}
              isDisabled={isLastInGroup || isSaving}
              onPress={() => onMove(payment.id, 1)}
            >
              <AppIcon name="chevron-down" size={18} color={mutedColor} />
            </Button>
          </View>
          <Switch
            isSelected={payment.is_active}
            isDisabled={isSaving}
            onSelectedChange={(active) => onToggle(payment.id, active)}
            accessibilityLabel={t("paymentSettings.toggle", { name: payment.name })}
          >
            <Switch.Thumb />
          </Switch>
        </View>
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

export default function PaymentSettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const payments = useMerchantPayments();
  const reorderMutation = useReorderMerchantPayments();
  const [draft, setDraft] = React.useState<MerchantPayment[] | null>(null);

  const sortedPayments = [...(payments.data ?? [])].sort((a, b) => a.sort - b.sort);
  const orderedPayments = draft ?? sortedPayments;
  const [isDirty, setIsDirty] = React.useState(false);
  const groupedSections = groupPayments(orderedPayments);

  useFocusEffect(() => {
    setDraft(null);
    setIsDirty(false);
  });

  const handleMove = (paymentId: string, direction: -1 | 1) => {
    setDraft(movePaymentWithinGroup(orderedPayments, paymentId, direction));
    setIsDirty(true);
  };

  const handleToggle = (paymentId: string, active: boolean) => {
    setDraft(togglePaymentActive(orderedPayments, paymentId, active));
    setIsDirty(true);
  };

  const handleCancel = () => {
    setDraft(null);
    setIsDirty(false);
  };

  const handleSave = async () => {
    try {
      const saved = await reorderMutation.mutateAsync(orderedPayments);
      setDraft(saved);
      setIsDirty(false);
      toast.show({ variant: "success", label: t("paymentSettings.changesSaved") });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("paymentSettings.saveFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  if (payments.isLoading) return <LoadingState message={t("paymentSettings.loading")} />;
  if (payments.isError) return <ErrorState error={payments.error} onRetry={payments.refetch} />;

  return (
    <View className="flex-1 bg-background">
      {isDirty ? (
        <View className="flex-row items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
          <Typography type="body-sm" color="muted" className="flex-1">
            {t("paymentSettings.unsavedChanges")}
          </Typography>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={handleCancel}
              isDisabled={reorderMutation.isPending}
            >
              <Button.Label>{t("common.cancel")}</Button.Label>
            </Button>
            <Button size="sm" onPress={handleSave} isDisabled={reorderMutation.isPending}>
              <Button.Label>
                {reorderMutation.isPending ? t("common.saving") : t("paymentSettings.saveChanges")}
              </Button.Label>
            </Button>
          </View>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-4 py-6 pb-safe-offset-6 md:px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-3xl gap-4">
          {groupedSections.length ? (
            groupedSections.map((section) => (
              <View key={section.key} className="gap-2">
                <Typography type="body-sm" weight="semibold" color="muted" className="px-1">
                  {section.label}
                </Typography>
                <ListGroup>
                  {section.payments.map((payment, index) => (
                    <View key={payment.id}>
                      {index !== 0 && <Separator className="mx-4" />}
                      <PaymentSettingsRow
                        payment={payment}
                        isFirstInGroup={index === 0}
                        isLastInGroup={index === section.payments.length - 1}
                        isSaving={reorderMutation.isPending}
                        onMove={handleMove}
                        onToggle={handleToggle}
                      />
                    </View>
                  ))}
                </ListGroup>
              </View>
            ))
          ) : (
            <Typography color="muted">{t("paymentSettings.empty")}</Typography>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

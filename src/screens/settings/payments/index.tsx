import {
  Frame,
  Typography,
  Button as PanelButton,
  Typography as PanelTypography,
  useToast,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Skeleton as PanelListSkeleton,
  Switch as PanelSwitch,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { getErrorMessage } from "@/api/api-error";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useMerchantPayments, useReorderMerchantPayments } from "@/hooks/db/use-payments";
import { useTranslation } from "@/stores/use-locale";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";
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
  divided,
  isFirstInGroup,
  isLastInGroup,
  isSaving,
  onMove,
  onToggle,
}: {
  payment: MerchantPayment;
  divided: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isSaving: boolean;
  onMove: (paymentId: string, direction: -1 | 1) => void;
  onToggle: (paymentId: string, active: boolean) => void;
}) {
  const { t } = useTranslation();
  const [mutedColor] = useCSSVariable(["--color-muted-foreground"]) as [string];

  return (
    <Frame.Row divided={divided}>
      <Frame.Media>
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
      </Frame.Media>
      <Frame.Content>
        <Frame.Title>{payment.name}</Frame.Title>
        <Frame.Description>{payment.processing_mode.label}</Frame.Description>
      </Frame.Content>
      <Frame.Actions>
        <View className="flex-row items-center gap-2">
          <View className="flex-row">
            <PanelButton
              size="sm"
              variant="ghost"

              accessibilityLabel={t("paymentSettings.moveUpAccessibility", {
                name: payment.name,
              })}
              disabled={isFirstInGroup || isSaving}
              onPress={() => onMove(payment.id, -1)}
            >
              <AppIcon icon={AppIcons.chevronUp} size={18} color={mutedColor} />
            </PanelButton>
            <PanelButton
              size="icon"
              variant="ghost"

              accessibilityLabel={t("paymentSettings.moveDownAccessibility", {
                name: payment.name,
              })}
              disabled={isLastInGroup || isSaving}
              onPress={() => onMove(payment.id, 1)}
            >
              <AppIcon icon={AppIcons.chevronDown} size={18} color={mutedColor} />
            </PanelButton>
          </View>
          <PanelSwitch
            value={payment.is_active}
            disabled={isSaving}
            onValueChange={(active) => onToggle(payment.id, active)}
            accessibilityLabel={t("paymentSettings.toggle", { name: payment.name })}
          />
        </View>
      </Frame.Actions>
    </Frame.Row>
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
        variant: "destructive",
        label: t("paymentSettings.saveFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  if (payments.isLoading)
    return (
      <View className="flex-1 gap-px py-2" accessibilityRole="progressbar">
        {Array.from({ length: 6 }, (_, index) => (
          <View
            key={`loading-row-${index}`}
            className="min-h-20 flex-row items-center gap-4 px-4 py-3 md:px-6"
          >
            <PanelListSkeleton className="size-11 shrink-0 rounded-xl" />
            <View className="flex-1 gap-2">
              <PanelListSkeleton className="h-4 w-3/5 rounded-md" />
              <PanelListSkeleton className="h-3 w-2/5 rounded-md" />
              <PanelListSkeleton className="h-3 w-1/3 rounded-md" />
            </View>
            <PanelListSkeleton className="size-4 rounded-full" />
          </View>
        ))}
      </View>
    );
  if (payments.isError)
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(payments.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void payments.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );

  return (
    <View className="flex-1 bg-background">
      {isDirty ? (
        <View className="flex-row items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
          <PanelTypography type="body-sm" muted className="flex-1">
            {t("paymentSettings.unsavedChanges")}
          </PanelTypography>
          <View className="flex-row gap-2">
            <PanelButton
              size="icon"
              variant="ghost"
              onPress={handleCancel}
              disabled={reorderMutation.isPending}
            >
              {t("common.cancel")}
            </PanelButton>
            <PanelButton size="sm" onPress={handleSave} disabled={reorderMutation.isPending}>
              {reorderMutation.isPending ? t("common.saving") : t("paymentSettings.saveChanges")}
            </PanelButton>
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
                <Typography type="body-sm" weight="semibold" muted className="px-1">
                  {section.label}
                </Typography>
                <Frame variant="plain">
                  <Frame.Panel dividers={false}>
                    {section.payments.map((payment, index) => (
                      <PaymentSettingsRow
                        key={payment.id}
                        payment={payment}
                        divided={index !== 0}
                        isFirstInGroup={index === 0}
                        isLastInGroup={index === section.payments.length - 1}
                        isSaving={reorderMutation.isPending}
                        onMove={handleMove}
                        onToggle={handleToggle}
                      />
                    ))}
                  </Frame.Panel>
                </Frame>
              </View>
            ))
          ) : (
            <Typography muted>{t("paymentSettings.empty")}</Typography>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

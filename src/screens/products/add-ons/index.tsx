import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useAddOns } from "@/hooks/db/use-add-ons";
import { formatRupiah } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Separator, Typography, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export default function ProductAddOnsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mutedColor, accentColor] = useThemeColor(["muted", "accent"]);
  const addOnsQuery = useAddOns(productId);

  if (addOnsQuery.isLoading) return <LoadingState message={t("addOnManagement.loading")} />;
  if (addOnsQuery.isError) {
    return <ErrorState error={addOnsQuery.error} onRetry={addOnsQuery.refetch} />;
  }

  const addOns = addOnsQuery.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: t("addOnManagement.title") }} />
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
          {addOns.length === 0 ? (
            <EmptyState className="py-20">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <AppIcon name="options-outline" size={20} color={mutedColor} />
                </EmptyState.Media>
                <EmptyState.Title>{t("addOnManagement.empty")}</EmptyState.Title>
                <EmptyState.Description>
                  {t("addOnManagement.emptyDescription")}
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            addOns.map((addOn, index) => (
              <View key={addOn.id}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("addOnManagement.editAccessibility", {
                    addOn: addOn.name,
                  })}
                  onPress={() => router.push(`/products/${productId}/add-ons/${addOn.id}`)}
                  className="min-h-20 flex-row items-center gap-4 px-4 py-3 active:bg-surface-secondary md:px-6"
                >
                  <View className="size-11 items-center justify-center rounded-panel-inner bg-accent-soft">
                    <AppIcon name="options-outline" size={20} color={accentColor} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Typography type="body-sm" weight="semibold">
                      {addOn.name}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                      {t(
                        addOn.min === addOn.max
                          ? "addOnManagement.chooseCount"
                          : "addOnManagement.chooseRange",
                        addOn.min === addOn.max
                          ? { count: addOn.min }
                          : { min: addOn.min, max: addOn.max }
                      )}{" "}
                      ·{" "}
                      {t(
                        addOn.options_count === 1
                          ? "addOnManagement.optionOne"
                          : "addOnManagement.optionOther",
                        { count: addOn.options_count }
                      )}
                    </Typography>
                    <Typography type="body-xs" color="muted" numberOfLines={1}>
                      {addOn.options
                        .map((option) =>
                          option.price > 0
                            ? `${option.name} +${formatRupiah(option.price)}`
                            : option.name
                        )
                        .join(", ")}
                    </Typography>
                  </View>
                  <AppIcon name="chevron-forward" size={17} color={mutedColor} />
                </Pressable>
                {index < addOns.length - 1 ? <Separator className="mx-5" /> : null}
              </View>
            ))
          )}
        </ScrollView>
        <CreateFAB
          accessibilityLabel={t("addOnManagement.addAccessibility")}
          onPress={() => router.push(`/products/${productId}/add-ons/new`)}
        />
      </View>
    </>
  );
}

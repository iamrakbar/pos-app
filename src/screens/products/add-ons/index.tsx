import LoadingListSkeleton from "@/components/common/loading-list-skeleton";
import RequestError from "@/components/common/request-error";
import { Typography, Separator, Fab, PlusIcon, EmptyState } from "panelui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { useAddOns } from "@/hooks/db/use-add-ons";
import { formatRupiah } from "@/utils/format";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export default function ProductAddOnsScreen(): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mutedColor, accentColor] = useCSSVariable([
    "--color-muted-foreground",
    "--color-primary",
  ]) as [string, string];
  const addOnsQuery = useAddOns(productId);

  if (addOnsQuery.isLoading) return <LoadingListSkeleton count={6} fill />;
  if (addOnsQuery.isError) {
    return <RequestError error={addOnsQuery.error} onRetry={() => void addOnsQuery.refetch()} />;
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
                  <AppIcon icon={AppIcons.options} size={20} color={mutedColor} />
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
                  <View className="size-11 items-center justify-center rounded-xl bg-secondary">
                    <AppIcon icon={AppIcons.options} size={20} color={accentColor} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Typography type="body-sm" weight="semibold">
                      {addOn.name}
                    </Typography>
                    <Typography type="body-xs" muted>
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
                    <Typography type="body-xs" muted numberOfLines={1}>
                      {addOn.options
                        .map((option) =>
                          option.price > 0
                            ? `${option.name} +${formatRupiah(option.price)}`
                            : option.name
                        )
                        .join(", ")}
                    </Typography>
                  </View>
                  <AppIcon icon={AppIcons.chevronForward} size={17} color={mutedColor} />
                </Pressable>
                {index < addOns.length - 1 ? <Separator className="mx-5" /> : null}
              </View>
            ))
          )}
        </ScrollView>
        <Fab
          icon={<PlusIcon size={22} />}
          placement="bottom-right"
          style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
          accessibilityLabel={t("addOnManagement.addAccessibility")}
          onPress={() => router.push(`/products/${productId}/add-ons/new`)}
        />
      </View>
    </>
  );
}

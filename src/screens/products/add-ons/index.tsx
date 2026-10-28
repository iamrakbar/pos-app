import { Typography , Separator ,
  Fab,
  PlusIcon,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Skeleton as PanelListSkeleton,
 EmptyState } from "panelui-native";
import { getErrorMessage } from "@/api/api-error";
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

  if (addOnsQuery.isLoading)
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
  if (addOnsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
        <PanelErrorAlert variant="destructive">
          <PanelErrorAlert.Indicator />
          <PanelErrorAlert.Content>
            <PanelErrorAlert.Description>
              {getErrorMessage(addOnsQuery.error)}
            </PanelErrorAlert.Description>
          </PanelErrorAlert.Content>
        </PanelErrorAlert>
        <PanelErrorButton variant="outline" onPress={() => void addOnsQuery.refetch()}>
          {t("common.retry")}
        </PanelErrorButton>
      </View>
    );
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

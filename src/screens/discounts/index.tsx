import AppIcon from "@/components/common/app-icon";
import CreateFAB from "@/components/common/create-fab";
import { EmptyState } from "heroui-native-pro";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useDiscounts } from "@/hooks/db/use-discounts";
import { getLocaleTag } from "@/locales";
import { Stack, useRouter } from "expo-router";
import { Chip, Separator, Typography, useThemeColor } from "heroui-native";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export default function DiscountsScreen(): React.JSX.Element {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const muted = useThemeColor("muted");
  const [search, setSearch] = React.useState("");
  const [active, setActive] = React.useState<"all" | "active" | "inactive">("all");
  const query = useDiscounts(search.trim() || undefined, active === "all" ? undefined : active === "active");

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder={t("discounts.search")}
          onChangeText={(event) => setSearch(event.nativeEvent.text)}
          onClose={() => setSearch("")}
        />
        <Stack.Toolbar.Menu accessibilityLabel={t("discounts.filterAccessibility")}>
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {(["all", "active", "inactive"] as const).map((value) => (
            <Stack.Toolbar.MenuAction key={value} onPress={() => setActive(value)} isOn={active === value}>
              {value === "all" ? t("common.all") : value === "active" ? t("common.active") : t("common.inactive")}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        {query.isLoading ? <LoadingState message={t("discounts.loading")} /> : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          query.data?.length === 0 ? (
            <View className="flex-1">
              <EmptyState className="py-20">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="pricetag-outline" size={22} color={muted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("discounts.empty")}</EmptyState.Title>
                  <EmptyState.Description>{t("discounts.emptyDescription")}</EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            </View>
          ) : (
            <FlatList
              className="flex-1"
              data={query.data}
              keyExtractor={(discount) => discount.id}
              contentContainerClassName="py-2 pb-24"
              refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
              ItemSeparatorComponent={() => <Separator className="mx-5" />}
              renderItem={({ item: discount }) => (
                <Pressable
                  className="flex-row items-center gap-3 px-4 py-4 active:bg-surface-secondary md:px-6"
                  onPress={() => router.push(`/settings/discounts/${discount.id}` as never)}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
                    <AppIcon name="pricetag-outline" size={20} color={muted} />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Typography type="body-sm" weight="semibold" className="flex-1" numberOfLines={1}>{discount.name}</Typography>
                      <Chip color={discount.active ? "success" : "default"} size="sm" variant="soft">
                        <Chip.Label>{discount.active ? t("common.active") : t("common.inactive")}</Chip.Label>
                      </Chip>
                    </View>
                    <Typography type="body-xs" color="muted">
                      {discount.unit === "percentage" ? `${discount.value}%` : `Rp ${discount.value.toLocaleString(getLocaleTag(locale))}`}
                      {discount.products_count > 0 ? ` · ${t("discounts.productsCount", { count: discount.products_count })}` : ` · ${t("discounts.noProductsSelected")}`}
                    </Typography>
                    {(discount.start || discount.end) ? <Typography type="body-xs" color="muted">
                      {discount.start ? new Date(discount.start).toLocaleDateString(getLocaleTag(locale), { day: "2-digit", month: "short", year: "numeric" }) : t("discounts.noStart")} – {discount.end ? new Date(discount.end).toLocaleDateString(getLocaleTag(locale), { day: "2-digit", month: "short", year: "numeric" }) : t("discounts.noEnd")}
                    </Typography> : null}
                  </View>
                  <AppIcon name="chevron-forward" size={16} color={muted} />
                </Pressable>
              )}
            />
          )
        )}
        <CreateFAB accessibilityLabel={t("discounts.addAccessibility")} onPress={() => router.push("/settings/discounts/new" as never)} />
      </View>
    </>
  );
}

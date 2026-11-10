import LoadingListSkeleton from "@/components/common/loading-list-skeleton";
import RequestError from "@/components/common/request-error";
import { Typography, Separator, Fab, PlusIcon, EmptyState, Chip } from "panelui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useDiscounts } from "@/hooks/db/use-discounts";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { formatDate, formatRupiah } from "@/utils/format";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

export default function DiscountsScreen(): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const muted = useCSSVariable("--color-muted-foreground") as string;
  const [search, setSearch] = React.useState("");
  const [active, setActive] = React.useState<"all" | "active" | "inactive">("all");
  const query = useDiscounts(
    search.trim() || undefined,
    active === "all" ? undefined : active === "active"
  );

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder={t("discounts.search")}
          onChangeText={(event) => setSearch(event.nativeEvent.text)}
          onClose={() => setSearch("")}
        />
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={muted}
          accessibilityLabel={t("discounts.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          {(["all", "active", "inactive"] as const).map((value) => (
            <Stack.Toolbar.MenuAction
              key={value}
              onPress={() => setActive(value)}
              isOn={active === value}
            >
              {value === "all"
                ? t("common.all")
                : value === "active"
                  ? t("common.active")
                  : t("common.inactive")}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        {query.isLoading ? (
          <LoadingListSkeleton count={6} fill />
        ) : query.isError ? (
          <RequestError error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data?.length === 0 ? (
          <View className="flex-1">
            <EmptyState className="py-20">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <AppIcon icon={AppIcons.priceTag} size={22} color={muted} />
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
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
              />
            }
            ItemSeparatorComponent={() => <Separator className="mx-5" />}
            renderItem={({ item: discount }) => (
              <Pressable
                className="flex-row items-center gap-3 px-4 py-4 active:bg-surface-secondary md:px-6"
                onPress={() => router.push(`/settings/discounts/${discount.id}` as never)}
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
                  <AppIcon icon={AppIcons.priceTag} size={20} color={muted} />
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <Typography
                      type="body-sm"
                      weight="semibold"
                      className="flex-1"
                      numberOfLines={1}
                    >
                      {discount.name}
                    </Typography>
                    <Chip variant={discount.active ? "success" : "default"} size="sm">
                      <Chip.Label>
                        {discount.active ? t("common.active") : t("common.inactive")}
                      </Chip.Label>
                    </Chip>
                  </View>
                  <Typography type="body-xs" muted>
                    {discount.unit === "percentage"
                      ? `${discount.value}%`
                      : formatRupiah(discount.value)}
                    {discount.products_count > 0
                      ? ` · ${t("discounts.productsCount", { count: discount.products_count })}`
                      : ` · ${t("discounts.noProductsSelected")}`}
                  </Typography>
                  {discount.start || discount.end ? (
                    <Typography type="body-xs" muted>
                      {discount.start
                        ? formatDate(new Date(`${discount.start}T00:00:00`))
                        : t("discounts.noStart")}{" "}
                      –{" "}
                      {discount.end
                        ? formatDate(new Date(`${discount.end}T00:00:00`))
                        : t("discounts.noEnd")}
                    </Typography>
                  ) : null}
                </View>
                <AppIcon icon={AppIcons.chevronForward} size={16} color={muted} />
              </Pressable>
            )}
          />
        )}
        <Fab
          icon={<PlusIcon size={22} />}
          placement="bottom-right"
          style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
          accessibilityLabel={t("discounts.addAccessibility")}
          onPress={() => router.push("/settings/discounts/new" as never)}
        />
      </View>
    </>
  );
}

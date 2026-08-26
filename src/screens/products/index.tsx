import { useManagementProducts } from "@/hooks/db/use-products";
import { useCategories } from "@/hooks/db/use-categories";
import { ListSkeleton } from "@/components/common/list-skeleton";
import ErrorState from "@/components/common/error-state";
import CreateFAB from "@/components/common/create-fab";
import { formatRupiah } from "@/utils/format";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import AppIcon from "@/components/common/app-icon";
import { Chip, Separator, Typography, useThemeColor } from "heroui-native";
import { Image } from "expo-image";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { EmptyState } from "heroui-native-pro";
import { useTranslation } from "@/stores/use-locale";

export default function ProductsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const themeColorMuted = useThemeColor("muted");
  const theme = useNavigationTheme();
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all");

  const {
    data: allProductsRaw,
    isLoading,
    isError,
    error,
    refetch,
  } = useManagementProducts(
    deferredSearch || undefined,
    categoryId,
    activeFilter === "all" ? undefined : activeFilter === "active"
  );
  const { data: categoriesList = [] } = useCategories();

  const filtered = (allProductsRaw ?? []).filter((product) => {
    const matchesCategory = !categoryId || product.category?.id === categoryId;
    const matchesStatus =
      activeFilter === "all" ||
      (activeFilter === "active" && product.is_active) ||
      (activeFilter === "inactive" && !product.is_active);

    return matchesCategory && matchesStatus;
  });

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder={t("products.search")}
          barTintColor={theme.surface}
          tintColor={theme.foreground}
          textColor={theme.foreground}
          hintTextColor={theme.muted}
          headerIconColor={theme.foreground}
          onChangeText={(event) => setSearch(event.nativeEvent.text)}
          onClose={() => setSearch("")}
        />
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={theme.foreground}
          accessibilityLabel={t("products.filterAccessibility")}
        >
          <Stack.Toolbar.Label>{t("common.filter")}</Stack.Toolbar.Label>
          <Stack.Toolbar.MenuAction
            onPress={() => setActiveFilter("all")}
            isOn={activeFilter === "all"}
          >
            {t("common.all")}
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            onPress={() => setActiveFilter("active")}
            isOn={activeFilter === "active"}
          >
            {t("common.active")}
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            onPress={() => setActiveFilter("inactive")}
            isOn={activeFilter === "inactive"}
          >
            {t("common.inactive")}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu
          {...getToolbarIcon("category")}
          tintColor={theme.foreground}
          accessibilityLabel={t("products.filterByCategory")}
        >
          <Stack.Toolbar.Label>{t("navigation.category")}</Stack.Toolbar.Label>
          <Stack.Toolbar.MenuAction onPress={() => setCategoryId(null)} isOn={categoryId === null}>
            {t("common.all")}
          </Stack.Toolbar.MenuAction>
          {categoriesList.map((cat) => (
            <Stack.Toolbar.MenuAction
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              isOn={categoryId === cat.id}
            >
              {cat.name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        {/* Product list */}
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
            {filtered.length === 0 ? (
              <EmptyState className="py-20">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="search-outline" size={20} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("products.empty")}</EmptyState.Title>
                  <EmptyState.Description>{t("products.emptyDescription")}</EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              filtered.map((product, index) => {
                const category = categoriesList.find((c) => c.id === product.category?.id);
                const isDiscounted = product.discount !== null;

                return (
                  <View key={product.id}>
                    <Pressable
                      onPress={() => router.push(`/products/${product.id}` as never)}
                      className="min-h-20 flex-row items-center gap-4 px-4 py-3 active:bg-surface-secondary md:px-6"
                    >
                      {/* Thumbnail */}
                      <View className="w-14 h-14 rounded-panel-inner bg-surface-secondary overflow-hidden items-center justify-center shrink-0">
                        {product.image?.thumbnail ? (
                          <Image
                            source={{ uri: product.image.thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <AppIcon name="fast-food-outline" size={24} color={themeColorMuted} />
                        )}
                      </View>

                      {/* Info */}
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Typography
                            type="body-sm"
                            weight="semibold"
                            className="flex-1"
                            numberOfLines={1}
                          >
                            {product.name}
                          </Typography>
                          <Chip
                            color={product.is_active ? "success" : "default"}
                            size="sm"
                            variant="soft"
                          >
                            <Chip.Label>
                              {product.is_active ? t("common.active") : t("common.inactive")}
                            </Chip.Label>
                          </Chip>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {category && (
                            <Typography type="body-xs" color="muted">
                              {category.name}
                            </Typography>
                          )}
                          {category && product.add_ons.length > 0 && (
                            <Typography type="body-xs" color="muted">
                              ·
                            </Typography>
                          )}
                          {product.add_ons.length > 0 && (
                            <Typography type="body-xs" color="muted">
                              {t(
                                product.add_ons.length === 1
                                  ? "products.addOnGroupOne"
                                  : "products.addOnGroupOther",
                                { count: product.add_ons.length }
                              )}
                            </Typography>
                          )}
                        </View>

                        <View className="flex-row items-center gap-2">
                          {isDiscounted && (
                            <Typography type="body-xs" color="muted" className="line-through">
                              {formatRupiah(product.price)}
                            </Typography>
                          )}
                          <Typography
                            type="body-sm"
                            weight="semibold"
                            className={`tabular-nums ${isDiscounted ? "text-accent" : ""}`}
                          >
                            {(() => {
                              const effective = product.discount?.price ?? product.price;
                              return effective === 0 ? t("common.free") : formatRupiah(effective);
                            })()}
                          </Typography>
                        </View>
                      </View>

                      <AppIcon name="chevron-forward" size={16} color={themeColorMuted} />
                    </Pressable>
                    {index < filtered.length - 1 && <Separator className="mx-5" />}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
        <CreateFAB
          accessibilityLabel={t("products.addAccessibility")}
          onPress={() => router.push("/products/new")}
        />
      </View>
    </>
  );
}

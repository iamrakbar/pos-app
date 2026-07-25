import { useManagementProducts } from "@/hooks/db/use-products";
import { useCategories } from "@/hooks/db/use-categories";
import LoadingState from "@/components/common/loading-state";
import ErrorState from "@/components/common/error-state";
import CreateFAB from "@/components/common/create-fab";
import { formatRupiah } from "@/utils/format";
import { useNavigationTheme } from "@/utils/navigation-theme";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { Ionicons } from "@expo/vector-icons";
import { Button, Chip, Separator, Typography, useThemeColor } from "heroui-native";
import { Image } from "expo-image";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { EmptyState } from "heroui-native-pro";

export default function ProductsScreen(): React.JSX.Element {
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
    const matchesCategory = !categoryId || product.category_id === categoryId;
    const matchesStatus =
      activeFilter === "all" ||
      (activeFilter === "active" && product.is_active) ||
      (activeFilter === "inactive" && !product.is_active);

    return matchesCategory && matchesStatus;
  });

  const selectedCategory = categoriesList.find((c) => c.id === categoryId);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder="Search..."
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
          accessibilityLabel="Filter products"
        >
          <Stack.Toolbar.Label>Filter</Stack.Toolbar.Label>
          <Stack.Toolbar.MenuAction
            onPress={() => setActiveFilter("all")}
            isOn={activeFilter === "all"}
          >
            All
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            onPress={() => setActiveFilter("active")}
            isOn={activeFilter === "active"}
          >
            Active
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            onPress={() => setActiveFilter("inactive")}
            isOn={activeFilter === "inactive"}
          >
            Inactive
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu
          {...getToolbarIcon("category")}
          tintColor={theme.foreground}
          accessibilityLabel="Choose category"
        >
          <Stack.Toolbar.Label>{selectedCategory?.name || "Category"}</Stack.Toolbar.Label>
          <Stack.Toolbar.MenuAction onPress={() => setCategoryId(null)} isOn={categoryId === null}>
            All
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
          <Stack.Toolbar.MenuAction onPress={() => router.push("/products/categories")}>
            Manage categories
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3">
          <View className="flex-1">
            <Typography type="body-sm" weight="semibold">
              Product catalog
            </Typography>
            <Typography type="body-xs" color="muted">
              Organize products into categories.
            </Typography>
          </View>
          <Button size="sm" variant="outline" onPress={() => router.push("/products/categories")}>
            <Ionicons name="grid-outline" size={16} color={theme.foreground} />
            <Button.Label>Categories</Button.Label>
          </Button>
        </View>

        {/* Product list */}
        {isLoading ? (
          <LoadingState message="Loading products…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
            {filtered.length === 0 ? (
              <EmptyState className="py-20">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Ionicons name="search-outline" size={20} color={themeColorMuted} />
                  </EmptyState.Media>
                  <EmptyState.Title>No products found</EmptyState.Title>
                  <EmptyState.Description>
                    Try changing the search, category, or status filter.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              filtered.map((product, index) => {
                const category = categoriesList.find((c) => c.id === product.category_id);
                const isDiscounted = product.original_price !== null;

                return (
                  <View key={product.id}>
                    <Pressable
                      onPress={() => router.push(`/products/${product.id}` as never)}
                      className="min-h-20 flex-row items-center gap-4 px-5 py-3 active:bg-surface-secondary"
                    >
                      {/* Thumbnail */}
                      <View className="w-14 h-14 rounded-panel-inner bg-surface-secondary overflow-hidden items-center justify-center shrink-0">
                        {product.thumbnail_url ? (
                          <Image
                            source={{ uri: product.thumbnail_url }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <Ionicons name="fast-food-outline" size={24} color={themeColorMuted} />
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
                            <Chip.Label>{product.is_active ? "Active" : "Inactive"}</Chip.Label>
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
                              {product.add_ons.length} add-on group
                              {product.add_ons.length !== 1 ? "s" : ""}
                            </Typography>
                          )}
                        </View>

                        <View className="flex-row items-center gap-2">
                          {isDiscounted && (
                            <Typography type="body-xs" color="muted" className="line-through">
                              {formatRupiah(product.original_price!)}
                            </Typography>
                          )}
                          <Typography
                            type="body-sm"
                            weight="semibold"
                            className={`tabular-nums ${isDiscounted ? "text-accent" : ""}`}
                          >
                            {product.price === 0 ? "Free" : formatRupiah(product.price)}
                          </Typography>
                        </View>
                      </View>

                      <Ionicons name="chevron-forward" size={16} color={themeColorMuted} />
                    </Pressable>
                    {index < filtered.length - 1 && <Separator className="mx-5" />}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
        <CreateFAB accessibilityLabel="Add product" onPress={() => router.push("/products/new")} />
      </View>
    </>
  );
}

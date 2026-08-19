import CreateFAB from "@/components/common/create-fab";
import ErrorState from "@/components/common/error-state";
import LoadingState from "@/components/common/loading-state";
import { useManagementCategories, useReorderCategories } from "@/hooks/db/use-categories";
import { getErrorMessage } from "@/api/api-error";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useNavigationTheme } from "@/utils/navigation-theme";
import AppIcon from "@/components/common/app-icon";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Button, Chip, Separator, Typography, useThemeColor, useToast } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "@/stores/use-locale";

type ActiveFilter = "all" | "active" | "inactive";
type Category = App.Data.Merchant.Category.CategoryData;

function moveCategory(categories: Category[], index: number, direction: -1 | 1): Category[] {
  const target = index + direction;
  if (target < 0 || target >= categories.length) return categories;
  const next = [...categories];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function CategoriesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const theme = useNavigationTheme();
  const [mutedColor, accentColor] = useThemeColor(["muted", "accent"]);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>("all");
  const categoryQuery = useManagementCategories({
    search: deferredSearch || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    sort: "position",
    perPage: 50,
  });
  const reorderMutation = useReorderCategories();
  const [draftOrder, setDraftOrder] = React.useState<Category[] | null>(null);
  const orderedCategories = draftOrder ?? categoryQuery.data ?? [];
  const isOrderDirty = draftOrder !== null;

  const canReorder = !deferredSearch && activeFilter === "all";

  useFocusEffect(() => {
    setDraftOrder(null);
  });

  const handleMove = (index: number, direction: -1 | 1) => {
    setDraftOrder(moveCategory(orderedCategories, index, direction));
  };

  const handleCancelOrder = () => setDraftOrder(null);

  const handleSaveOrder = async () => {
    try {
      await reorderMutation.mutateAsync({
        categories: orderedCategories.map((category, position) => ({
          id: category.id,
          position,
        })),
      });
      setDraftOrder(null);
      toast.show({ variant: "success", label: t("categories.orderSaved") });
    } catch (error) {
      toast.show({
        variant: "danger",
        label: t("categories.reorderFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.SearchBar
          placement="integratedCentered"
          placeholder={t("categories.search")}
          barTintColor={theme.surface}
          tintColor={theme.foreground}
          textColor={theme.foreground}
          hintTextColor={theme.muted}
          headerIconColor={theme.foreground}
          onChangeText={(event) => {
            setDraftOrder(null);
            setSearch(event.nativeEvent.text);
          }}
          onClose={() => {
            setDraftOrder(null);
            setSearch("");
          }}
        />
        <Stack.Toolbar.Menu
          {...getToolbarIcon("filter")}
          tintColor={theme.foreground}
          accessibilityLabel={t("categories.filterAccessibility")}
        >
          {(["all", "active", "inactive"] as const).map((filter) => (
            <Stack.Toolbar.MenuAction
              key={filter}
              isOn={activeFilter === filter}
              onPress={() => {
                setDraftOrder(null);
                setActiveFilter(filter);
              }}
            >
              {filter === "all"
                ? t("common.all")
                : filter === "active"
                  ? t("common.active")
                  : t("common.inactive")}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View className="flex-1 bg-background">
        {isOrderDirty ? (
          <View className="flex-row items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
            <Typography type="body-sm" color="muted" className="flex-1">
              {t("categories.unsavedOrder")}
            </Typography>
            <View className="flex-row gap-2">
              <Button
                size="sm"
                variant="ghost"
                onPress={handleCancelOrder}
                isDisabled={reorderMutation.isPending}
              >
                <Button.Label>{t("common.cancel")}</Button.Label>
              </Button>
              <Button size="sm" onPress={handleSaveOrder} isDisabled={reorderMutation.isPending}>
                <Button.Label>
                  {reorderMutation.isPending ? t("common.saving") : t("categories.saveOrder")}
                </Button.Label>
              </Button>
            </View>
          </View>
        ) : null}

        {categoryQuery.isLoading ? (
          <LoadingState message={t("categories.loading")} />
        ) : categoryQuery.isError ? (
          <ErrorState error={categoryQuery.error} onRetry={categoryQuery.refetch} />
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
            {orderedCategories.length === 0 ? (
              <EmptyState className="py-20">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon name="grid-outline" size={20} color={mutedColor} />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("categories.empty")}</EmptyState.Title>
                  <EmptyState.Description>
                    {deferredSearch
                      ? t("categories.emptySearchDescription")
                      : t("categories.emptyDescription")}
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              orderedCategories.map((category, index) => (
                <View key={category.id}>
                  <View className="min-h-20 flex-row items-center gap-3 px-4 py-3 md:px-6">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("categories.editAccessibility", {
                        category: category.name,
                      })}
                      onPress={() => router.push(`/categories/${category.id}`)}
                      className="flex-1 flex-row items-center gap-3 active:opacity-70"
                    >
                      <View className="size-11 items-center justify-center rounded-panel-inner bg-accent-soft">
                        <AppIcon name="grid-outline" size={20} color={accentColor} />
                      </View>
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Typography type="body-sm" weight="semibold" className="flex-1">
                            {category.name}
                          </Typography>
                          <Chip
                            color={category.active ? "success" : "default"}
                            size="sm"
                            variant="soft"
                          >
                            <Chip.Label>
                              {category.active ? t("common.active") : t("common.inactive")}
                            </Chip.Label>
                          </Chip>
                        </View>
                        <Typography type="body-xs" color="muted">
                          {t(
                            category.products_count === 1
                              ? "categories.productPositionOne"
                              : "categories.productPositionOther",
                            {
                              count: category.products_count,
                              position: index + 1,
                            }
                          )}
                        </Typography>
                      </View>
                    </Pressable>

                    {canReorder ? (
                      <View className="flex-row">
                        <Button
                          size="sm"
                          variant="ghost"
                          isIconOnly
                          accessibilityLabel={t("categories.moveUpAccessibility", {
                            category: category.name,
                          })}
                          isDisabled={index === 0 || reorderMutation.isPending}
                          onPress={() => handleMove(index, -1)}
                        >
                          <AppIcon name="chevron-up" size={18} color={mutedColor} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          isIconOnly
                          accessibilityLabel={t("categories.moveDownAccessibility", {
                            category: category.name,
                          })}
                          isDisabled={
                            index === orderedCategories.length - 1 || reorderMutation.isPending
                          }
                          onPress={() => handleMove(index, 1)}
                        >
                          <AppIcon name="chevron-down" size={18} color={mutedColor} />
                        </Button>
                      </View>
                    ) : (
                      <AppIcon name="chevron-forward" size={17} color={mutedColor} />
                    )}
                  </View>
                  {index < orderedCategories.length - 1 ? <Separator className="mx-5" /> : null}
                </View>
              ))
            )}
          </ScrollView>
        )}
        <CreateFAB
          accessibilityLabel={t("categories.addAccessibility")}
          onPress={() => router.push("/categories/new")}
        />
      </View>
    </>
  );
}

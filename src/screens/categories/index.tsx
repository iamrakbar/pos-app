import {
  Typography,
  Separator,
  Alert as PanelErrorAlert,
  Button as PanelErrorButton,
  Button as PanelButton,
  Fab,
  PlusIcon,
  Typography as PanelTypography,
  useToast,
  Skeleton as PanelListSkeleton,
  EmptyState,
  Chip,
} from "panelui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { useManagementCategories, useReorderCategories } from "@/hooks/db/use-categories";
import { getErrorMessage } from "@/api/api-error";
import { getToolbarIcon } from "@/utils/toolbar-icons";
import { useNavigationTheme } from "@/utils/navigation-theme";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
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
  const { toast } = useToast();
  const theme = useNavigationTheme();
  const [mutedColor, accentColor] = useCSSVariable([
    "--color-muted-foreground",
    "--color-primary",
  ]) as [string, string];
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
        variant: "destructive",
        label: t("categories.reorderFailed"),
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <CategoriesContent
      theme={theme}
      mutedColor={mutedColor}
      accentColor={accentColor}
      search={search}
      setSearch={setSearch}
      setDraftOrder={setDraftOrder}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      isOrderDirty={isOrderDirty}
      handleCancelOrder={handleCancelOrder}
      handleSaveOrder={handleSaveOrder}
      reorderMutation={reorderMutation}
      categoryQuery={categoryQuery}
      orderedCategories={orderedCategories}
      deferredSearch={deferredSearch}
      canReorder={canReorder}
      handleMove={handleMove}
    />
  );
}

function CategoriesContent({
  theme,
  mutedColor,
  accentColor,
  setSearch,
  setDraftOrder,
  activeFilter,
  setActiveFilter,
  isOrderDirty,
  handleCancelOrder,
  handleSaveOrder,
  reorderMutation,
  categoryQuery,
  orderedCategories,
  deferredSearch,
  canReorder,
  handleMove,
}: {
  theme: ReturnType<typeof useNavigationTheme>;
  mutedColor: string;
  accentColor: string;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setDraftOrder: React.Dispatch<React.SetStateAction<Category[] | null>>;
  activeFilter: ActiveFilter;
  setActiveFilter: React.Dispatch<React.SetStateAction<ActiveFilter>>;
  isOrderDirty: boolean;
  handleCancelOrder: () => void;
  handleSaveOrder: () => Promise<void>;
  reorderMutation: ReturnType<typeof useReorderCategories>;
  categoryQuery: ReturnType<typeof useManagementCategories>;
  orderedCategories: Category[];
  deferredSearch: string;
  canReorder: boolean;
  handleMove: (index: number, direction: -1 | 1) => void;
}): React.JSX.Element {
  const fabInsets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

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
          <View className="flex-row items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
            <PanelTypography type="body-sm" muted className="flex-1">
              {t("categories.unsavedOrder")}
            </PanelTypography>
            <View className="flex-row gap-2">
              <PanelButton
                size="sm"
                variant="ghost"
                onPress={handleCancelOrder}
                disabled={reorderMutation.isPending}
              >
                {t("common.cancel")}
              </PanelButton>
              <PanelButton size="sm" onPress={handleSaveOrder} disabled={reorderMutation.isPending}>
                {reorderMutation.isPending ? t("common.saving") : t("categories.saveOrder")}
              </PanelButton>
            </View>
          </View>
        ) : null}

        {categoryQuery.isLoading ? (
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
        ) : categoryQuery.isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6 py-20">
            <PanelErrorAlert variant="destructive">
              <PanelErrorAlert.Indicator />
              <PanelErrorAlert.Content>
                <PanelErrorAlert.Description>
                  {getErrorMessage(categoryQuery.error)}
                </PanelErrorAlert.Description>
              </PanelErrorAlert.Content>
            </PanelErrorAlert>
            <PanelErrorButton variant="outline" onPress={() => void categoryQuery.refetch()}>
              {t("common.retry")}
            </PanelErrorButton>
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="py-2 pb-24">
            {orderedCategories.length === 0 ? (
              <EmptyState className="py-20">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <AppIcon icon={AppIcons.grid} size={20} color={mutedColor} />
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
                      onPress={() => router.push(`/settings/categories/${category.id}`)}
                      className="flex-1 flex-row items-center gap-3 active:opacity-70"
                    >
                      <View className="size-11 items-center justify-center rounded-xl bg-accent">
                        <AppIcon icon={AppIcons.grid} size={20} color={accentColor} />
                      </View>
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Typography type="body-sm" weight="semibold" className="flex-1">
                            {category.name}
                          </Typography>
                          <Chip variant={category.active ? "success" : "default"} size="sm">
                            <Chip.Label>
                              {category.active ? t("common.active") : t("common.inactive")}
                            </Chip.Label>
                          </Chip>
                        </View>
                        <Typography type="body-xs" muted>
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
                        <PanelButton
                          size="sm"
                          variant="ghost"
                          accessibilityLabel={t("categories.moveUpAccessibility", {
                            category: category.name,
                          })}
                          disabled={index === 0 || reorderMutation.isPending}
                          onPress={() => handleMove(index, -1)}
                        >
                          <AppIcon icon={AppIcons.chevronUp} size={18} color={mutedColor} />
                        </PanelButton>
                        <PanelButton
                          size="sm"
                          variant="ghost"
                          accessibilityLabel={t("categories.moveDownAccessibility", {
                            category: category.name,
                          })}
                          disabled={
                            index === orderedCategories.length - 1 || reorderMutation.isPending
                          }
                          onPress={() => handleMove(index, 1)}
                        >
                          <AppIcon icon={AppIcons.chevronDown} size={18} color={mutedColor} />
                        </PanelButton>
                      </View>
                    ) : (
                      <AppIcon icon={AppIcons.chevronForward} size={17} color={mutedColor} />
                    )}
                  </View>
                  {index < orderedCategories.length - 1 ? <Separator className="mx-5" /> : null}
                </View>
              ))
            )}
          </ScrollView>
        )}
        <Fab
          icon={<PlusIcon size={22} />}
          placement="bottom-right"
          style={{ bottom: Math.max(fabInsets.bottom, 24), right: 24, zIndex: 50 }}
          accessibilityLabel={t("categories.addAccessibility")}
          onPress={() => router.push("/settings/categories/new")}
        />
      </View>
    </>
  );
}

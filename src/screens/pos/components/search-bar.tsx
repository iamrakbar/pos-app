import {
  Button,
  Chip,
  Select,
  SearchBar,
  ScrollFade,
  Skeleton,
  BottomSheet,
  Typography,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { usePOSStore, type ProductSort } from "@/stores/use-pos-store";
import { useCategories } from "@/hooks/db/use-categories";
import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { useState, type JSX } from "react";
import { Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useTranslation } from "@/stores/use-locale";

type SearchBarProps = {
  isLoading?: boolean;
};

const CATEGORY_SKELETON_WIDTHS = [64, 88, 72, 104, 80];

export default function ProductSearchBar({ isLoading = false }: SearchBarProps): JSX.Element {
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [themeColorForeground, themeColorAccent] = useCSSVariable([
    "--color-foreground",
    "--color-primary",
  ]) as [string, string];
  const searchQuery = usePOSStore((s) => s.searchQuery);
  const categoryId = usePOSStore((s) => s.categoryId);
  const productSort = usePOSStore((s) => s.productSort);
  const areCategoriesVisible = usePOSStore((s) => s.areCategoriesVisible);
  const setSearchQuery = usePOSStore((s) => s.setSearchQuery);
  const setCategoryId = usePOSStore((s) => s.setCategoryId);
  const setProductSort = usePOSStore((s) => s.setProductSort);
  const toggleCategories = usePOSStore((s) => s.toggleCategories);

  const { data: categoriesList = [] } = useCategories();
  const sortOptions: { value: ProductSort; label: string }[] = [
    { value: "name-asc", label: t("pos.sortNameAscending") },
    { value: "name-desc", label: t("pos.sortNameDescending") },
    { value: "price-asc", label: t("pos.sortPriceAscending") },
    { value: "price-desc", label: t("pos.sortPriceDescending") },
  ];
  const selectedSort = sortOptions.find((option) => option.value === productSort)!;

  if (isLoading) {
    return (
      <View accessibilityLabel={t("pos.loadingProducts")}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <DrawerMenuButton />
          <Skeleton className="h-12 flex-1 rounded-3xl" />
          <Skeleton className="size-12 rounded-3xl" />
          <Skeleton className="size-12 rounded-3xl" />
        </View>
        {areCategoriesVisible ? (
          <ScrollView
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-5 pb-4"
          >
            {CATEGORY_SKELETON_WIDTHS.map((width) => (
              <Skeleton
                key={`category-skeleton-${width}`}
                className="h-8 rounded-full"
                style={{ width }}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center gap-2 px-4 py-3">
        <DrawerMenuButton />
        <View className="flex-1">
          <SearchBar
            size="sm"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("pos.searchProducts")}
            clearLabel={t("common.clear")}
            panel="never"
          />
        </View>
        <View className="flex-row items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onPress={toggleCategories}
            accessibilityLabel={
              areCategoriesVisible ? t("pos.hideCategories") : t("pos.showCategories")
            }
          >
            <AppIcon
              icon={AppIcons.layers}
              size={22}
              color={areCategoriesVisible ? themeColorAccent : themeColorForeground}
            />
          </Button>
          {isCompact ? (
            <BottomSheet open={isSortOpen} onOpenChange={setIsSortOpen}>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 flex-row items-center gap-1 px-2.5"
                accessibilityLabel={t("pos.sortProductsAccessibility", {
                  sort: selectedSort.label,
                })}
                accessibilityState={{ expanded: isSortOpen }}
                onPress={() => setIsSortOpen(true)}
              >
                <AppIcon icon={AppIcons.swapVertical} size={18} color={themeColorForeground} />
                {t("pos.sortAction")}
              </Button>
              <BottomSheet.Content>
                <BottomSheet.Header title={t("pos.sortProducts")} />
                <View accessibilityRole="radiogroup" className="pb-2">
                  {sortOptions.map((option) => {
                    const selected = option.value === productSort;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        onPress={() => {
                          setProductSort(option.value);
                          setIsSortOpen(false);
                        }}
                        className="min-h-12 flex-row items-center justify-between gap-3 px-2"
                      >
                        <Typography>{option.label}</Typography>
                        {selected ? (
                          <AppIcon icon={AppIcons.checkmark} size={20} color={themeColorAccent} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </BottomSheet.Content>
            </BottomSheet>
          ) : (
            <Select
              presentation="sheet"
              value={selectedSort.value}
              valueLabel={selectedSort.label}
              onValueChange={(value) => setProductSort(value as ProductSort)}
              title={t("pos.sortProducts")}
              placeholder={t("pos.sortProducts")}
              size="sm"
              contentWidth="content"
              className="w-56"
            >
              {sortOptions.map((option) => (
                <Select.Item key={option.value} value={option.value} label={option.label} />
              ))}
            </Select>
          )}
        </View>
      </View>

      {areCategoriesVisible ? (
        <ScrollFade orientation="horizontal" size={32}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-5 pb-4"
          >
            <Chip
              variant={categoryId === null ? "primary" : "default"}
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            >
              {t("common.all")}
            </Chip>
            {categoriesList.map((category) => (
              <Chip
                key={category.id}
                variant={categoryId === category.id ? "primary" : "default"}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              >
                {category.name}
              </Chip>
            ))}
          </ScrollView>
        </ScrollFade>
      ) : null}
    </View>
  );
}

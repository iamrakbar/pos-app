import {
  Button as PanelButton,
  Chip as PanelChip,
  Select as PanelSelect,
  SearchBar as PanelSearchBar,
  ScrollFade,
  Skeleton,
} from "panelui-native";
import { useCSSVariable } from "uniwind";
import { usePOSStore, type ProductSort } from "@/stores/use-pos-store";
import { useCategories } from "@/hooks/db/use-categories";
import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import type { JSX } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import AppIcon from "@/components/common/app-icon";
import { AppIcons } from "@/components/common/app-icons";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useTranslation } from "@/stores/use-locale";

type SearchBarProps = {
  isLoading?: boolean;
};

const CATEGORY_SKELETON_WIDTHS = [64, 88, 72, 104, 80];

export default function SearchBar({ isLoading = false }: SearchBarProps): JSX.Element {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
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
        <View className="flex-row items-center gap-3 px-2 py-4">
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
    <View className="">
      <View className="flex-row items-center gap-3 px-2 py-4">
        <DrawerMenuButton />
        <View className="flex-1">
          <PanelSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("pos.searchProducts")}
            clearLabel={t("common.clear")}
            panel="never"
          />
        </View>
        <View className="flex-row items-center gap-0.5">
          <PanelButton
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
          </PanelButton>
          <PanelSelect
            presentation={choicePresentation === "popover" ? "overlay" : "sheet"}
            value={selectedSort.value}
            valueLabel={selectedSort.label}
            onValueChange={(value) => setProductSort(value as ProductSort)}
            title={t("pos.sortProducts")}
            placeholder={t("pos.sortProducts")}
            size="xs"
            className="w-28"
          >
            {sortOptions.map((option) => (
              <PanelSelect.Item key={option.value} value={option.value} label={option.label} />
            ))}
          </PanelSelect>
        </View>
      </View>

      {areCategoriesVisible ? (
        <ScrollFade orientation="horizontal" size={32}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-5 pb-4"
          >
            <PanelChip
              variant={categoryId === null ? "primary" : "default"}
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            >
              {t("common.all")}
            </PanelChip>
            {categoriesList.map((category) => (
              <PanelChip
                key={category.id}
                variant={categoryId === category.id ? "primary" : "default"}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              >
                {category.name}
              </PanelChip>
            ))}
          </ScrollView>
        </ScrollFade>
      ) : null}
    </View>
  );
}

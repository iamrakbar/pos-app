import { usePOSStore, type ProductSort } from "@/stores/use-pos-store";
import { useCategories } from "@/hooks/db/use-categories";
import DrawerMenuButton from "@/components/navigation/drawer-menu-button";
import { Button, Chip, ScrollShadow, SearchField, Select, useThemeColor } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useOverlayPresentation } from "@/hooks/use-overlay-presentation";
import { useTranslation } from "@/stores/use-locale";

export default function SearchBar(): JSX.Element {
  const { t } = useTranslation();
  const { choicePresentation } = useOverlayPresentation();
  const [themeColorForeground, themeColorAccent] = useThemeColor(["foreground", "accent"]);
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

  return (
    <View className="">
      <View className="flex-row items-center gap-3 px-2 py-4">
        <DrawerMenuButton />
        <View className="flex-1">
          <SearchField value={searchQuery} onChange={setSearchQuery}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={t("pos.searchProducts")} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>
        <View className="flex-row items-center gap-1">
          <Button
            variant="ghost"
            isIconOnly
            onPress={toggleCategories}
            accessibilityLabel={
              areCategoriesVisible ? t("pos.hideCategories") : t("pos.showCategories")
            }
          >
            <Ionicons
              name={"albums-outline"}
              size={18}
              color={areCategoriesVisible ? themeColorAccent : themeColorForeground}
            />
          </Button>
          <Select
            presentation={choicePresentation}
            value={{ value: selectedSort.value, label: selectedSort.label }}
            onValueChange={(option) => option && setProductSort(option.value as ProductSort)}
          >
            <Select.Trigger asChild variant="unstyled">
              <Button
                variant="ghost"
                isIconOnly
                accessibilityLabel={t("pos.sortProductsAccessibility", {
                  sort: selectedSort.label,
                })}
              >
                <Ionicons name="swap-vertical-outline" size={18} color={themeColorForeground} />
              </Button>
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content
                presentation={choicePresentation}
                width={choicePresentation === "popover" ? 220 : undefined}
              >
                <Select.ListLabel>{t("pos.sortProducts")}</Select.ListLabel>
                {sortOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value} label={option.label} />
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>
      </View>

      {areCategoriesVisible ? (
        <ScrollShadow orientation="horizontal" size={32} LinearGradientComponent={LinearGradient}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-5 pb-4"
          >
            <Chip
              variant={categoryId === null ? "primary" : "secondary"}
              onPress={() => setCategoryId(null)}
            >
              <Chip.Label>{t("common.all")}</Chip.Label>
            </Chip>
            {categoriesList.map((category) => (
              <Chip
                key={category.id}
                variant={categoryId === category.id ? "primary" : "secondary"}
                onPress={() => setCategoryId(category.id)}
              >
                <Chip.Label>{category.name}</Chip.Label>
              </Chip>
            ))}
          </ScrollView>
        </ScrollShadow>
      ) : null}
    </View>
  );
}

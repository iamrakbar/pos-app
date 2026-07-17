import { usePOSStore, type ProductSort } from "@/stores/usePOSStore";
import { useCategories } from "@/hooks/db/useCategories";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import { Button, Chip, SearchField, Select, useThemeColor } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "name-asc", label: "Name · A–Z" },
  { value: "name-desc", label: "Name · Z–A" },
  { value: "price-asc", label: "Price · Low to high" },
  { value: "price-desc", label: "Price · High to low" },
];

export default function SearchBar(): JSX.Element {
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
  const selectedSort = SORT_OPTIONS.find((option) => option.value === productSort)!;

  return (
    <View className="border-b border-border bg-surface">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-4">
        <DrawerMenuButton />
        <View className="flex-1">
          <SearchField value={searchQuery} onChange={setSearchQuery}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search products" className="bg-background" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>
        <Button
          variant="ghost"
          isIconOnly
          onPress={toggleCategories}
          accessibilityLabel={areCategoriesVisible ? "Hide categories" : "Show categories"}
        >
          <Ionicons
            name={areCategoriesVisible ? "albums" : "albums-outline"}
            size={18}
            color={areCategoriesVisible ? themeColorAccent : themeColorForeground}
          />
        </Button>
        <Select
          value={{ value: selectedSort.value, label: selectedSort.label }}
          onValueChange={(option) => option && setProductSort(option.value as ProductSort)}
        >
          <Select.Trigger asChild variant="unstyled">
            <Button
              variant="ghost"
              isIconOnly
              accessibilityLabel={`Sort products: ${selectedSort.label}`}
            >
              <Ionicons name="swap-vertical-outline" size={18} color={themeColorForeground} />
            </Button>
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" width={220}>
              <Select.ListLabel>Sort products</Select.ListLabel>
              {SORT_OPTIONS.map((option) => (
                <Select.Item key={option.value} value={option.value} label={option.label} />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>

      {areCategoriesVisible ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 pb-3"
        >
          <Chip
            variant={categoryId === null ? "primary" : "secondary"}
            onPress={() => setCategoryId(null)}
          >
            <Chip.Label>All</Chip.Label>
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
      ) : null}
    </View>
  );
}

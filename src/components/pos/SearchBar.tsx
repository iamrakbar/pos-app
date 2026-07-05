import { usePOSStore } from '@/stores/usePOSStore';
import { useCategories } from '@/hooks/db/useCategories';
import DrawerMenuButton from '@/components/navigation/DrawerMenuButton';
import { SearchField, Select } from 'heroui-native';
import type { JSX } from 'react';
import { View } from 'react-native';

export default function SearchBar(): JSX.Element {
    const searchQuery = usePOSStore((s) => s.searchQuery);
    const categoryId = usePOSStore((s) => s.categoryId);
    const setSearchQuery = usePOSStore((s) => s.setSearchQuery);
    const setCategoryId = usePOSStore((s) => s.setCategoryId);

    const { data: categoriesList = [] } = useCategories();

    const selectedCategoryOption = categoryId
        ? {
            value: categoryId,
            label: categoriesList.find((c) => c.id === categoryId)?.name ?? categoryId,
        }
        : undefined;

    return (
        <View className="flex-row items-center gap-4 px-5 py-4 bg-background">
            <DrawerMenuButton />
            <View className="flex-1">
                <SearchField value={searchQuery} onChange={setSearchQuery}>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Search products" />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>
            </View>
            <View className="w-52">
                <Select
                    value={selectedCategoryOption}
                    onValueChange={(opt) => setCategoryId(opt?.value ?? null)}
                >
                    <Select.Trigger>
                        <Select.Value placeholder="Select category" />
                        <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Overlay />
                        <Select.Content presentation="popover" width="trigger">
                            <Select.Item value="" label="All categories" />
                            {categoriesList.map((cat) => (
                                <Select.Item key={cat.id} value={cat.id} label={cat.name} />
                            ))}
                        </Select.Content>
                    </Select.Portal>
                </Select>
            </View>
        </View>
    );
}

import { MOCK_CATEGORIES } from '@/data/pos-mock';
import { usePOSStore } from '@/stores/usePOSStore';
import { SearchField, Select } from 'heroui-native';
import type { JSX } from 'react';
import { View } from 'react-native';

export default function SearchBar(): JSX.Element {
  const searchQuery = usePOSStore((s) => s.searchQuery);
  const categoryId = usePOSStore((s) => s.categoryId);
  const setSearchQuery = usePOSStore((s) => s.setSearchQuery);
  const setCategoryId = usePOSStore((s) => s.setCategoryId);

  const selectedCategoryOption = categoryId
    ? {
        value: categoryId,
        label: MOCK_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId,
      }
    : undefined;

  return (
    <View className="flex-row gap-3 px-4 py-3">
      <View className="flex-1">
        <SearchField value={searchQuery} onChange={setSearchQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </View>
      <View className="w-52">
        <Select
          value={selectedCategoryOption}
          onValueChange={(opt) => setCategoryId(opt?.value ?? null)}
        >
          <Select.Trigger className="border border-border rounded-xl h-10 px-3 flex-row items-center justify-between bg-background">
            <Select.Value placeholder="Select category" />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" width="full">
              <Select.Item value="" label="All categories" />
              {MOCK_CATEGORIES.map((cat) => (
                <Select.Item key={cat.id} value={cat.id} label={cat.name} />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>
    </View>
  );
}

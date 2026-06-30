import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/data/pos-mock';
import { formatRupiah } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, SearchField, Select, Separator, Surface, Typography } from 'heroui-native';
import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProductsScreen(): React.JSX.Element {
    const router = useRouter();
    const [search, setSearch] = React.useState('');
    const [categoryId, setCategoryId] = React.useState<string | null>(null);
    const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

    const totalProducts = MOCK_PRODUCTS.length;
    const activeCount = MOCK_PRODUCTS.filter((p) => p.is_active).length;
    const categoryCount = MOCK_CATEGORIES.length;

    const filtered = MOCK_PRODUCTS.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = !categoryId || p.category_id === categoryId;
        const matchActive =
            activeFilter === 'all' ||
            (activeFilter === 'active' && p.is_active) ||
            (activeFilter === 'inactive' && !p.is_active);
        return matchSearch && matchCategory && matchActive;
    });

    const selectedCategory = MOCK_CATEGORIES.find((c) => c.id === categoryId);

    return (
        <View className="flex-1 bg-background">
            {/* Stats */}
            <View className="flex-row gap-3 px-4 pt-4 pb-2">
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-xl font-bold text-foreground">{totalProducts}</Typography>
                    <Typography className="text-xs text-muted-foreground">Total</Typography>
                </Surface>
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-xl font-bold text-green-500">{activeCount}</Typography>
                    <Typography className="text-xs text-muted-foreground">Active</Typography>
                </Surface>
                <Surface className="flex-1 items-center py-3 gap-0.5">
                    <Typography className="text-xl font-bold text-foreground">{categoryCount}</Typography>
                    <Typography className="text-xs text-muted-foreground">Categories</Typography>
                </Surface>
            </View>

            {/* Filters */}
            <View className="px-4 py-3 gap-3">
                <View className="flex-row gap-3">
                    <View className="flex-1">
                        <SearchField value={search} onChange={setSearch}>
                            <SearchField.Group>
                                <SearchField.SearchIcon />
                                <SearchField.Input placeholder="Search products…" />
                                <SearchField.ClearButton />
                            </SearchField.Group>
                        </SearchField>
                    </View>
                    <View className="w-48">
                        <Select
                            value={selectedCategory ? { value: selectedCategory.id, label: selectedCategory.name } : undefined}
                            onValueChange={(opt) => setCategoryId(opt?.value || null)}
                        >
                            <Select.Trigger>
                                <Select.Value placeholder="All categories" numberOfLines={1} />
                                <Select.TriggerIndicator />
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Overlay />
                                <Select.Content presentation="popover" width="trigger">
                                    <Select.Item value="" label="All categories" />
                                    {MOCK_CATEGORIES.map((cat) => (
                                        <Select.Item key={cat.id} value={cat.id} label={cat.name} />
                                    ))}
                                </Select.Content>
                            </Select.Portal>
                        </Select>
                    </View>
                </View>

                        <Button size="sm" onPress={() => router.push('/products/new' as never)}>
                    <Ionicons name="add" size={16} color="white" />
                    <Button.Label className="ml-1">New</Button.Label>
                </Button>

                {/* Active filter pills */}
                <View className="flex-row items-center gap-2">
                    {(['all', 'active', 'inactive'] as const).map((f) => {
                        const isSelected = activeFilter === f;
                        const label = f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive';
                        return (
                            <Pressable
                                key={f}
                                onPress={() => setActiveFilter(f)}
                                className={`px-3 py-1.5 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                            >
                                <Typography className={`text-xs font-medium ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {label}
                                </Typography>
                            </Pressable>
                        );
                    })}
                    <Typography className="text-xs text-muted-foreground ml-auto">
                        {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                    </Typography>
                </View>
            </View>

            <Separator />

            {/* Product list */}
            <ScrollView className="flex-1" contentContainerClassName="py-2">
                {filtered.length === 0 ? (
                    <View className="items-center justify-center py-20 gap-2">
                        <Ionicons name="search-outline" size={40} color="#9ca3af" />
                        <Typography className="text-sm text-muted-foreground">No products found</Typography>
                    </View>
                ) : (
                    filtered.map((product, index) => {
                        const category = MOCK_CATEGORIES.find((c) => c.id === product.category_id);
                        const isDiscounted = product.original_price !== null;

                        return (
                            <View key={product.id}>
                                <Pressable
                                    onPress={() => router.push(`/products/${product.id}` as never)}
                                    className="flex-row items-center gap-4 px-4 py-3 active:bg-muted/30"
                                >
                                    {/* Thumbnail */}
                                    <View className="w-14 h-14 rounded-xl bg-muted overflow-hidden items-center justify-center flex-shrink-0">
                                        {product.thumbnail_url ? (
                                            <Image
                                                source={{ uri: product.thumbnail_url }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Ionicons name="fast-food-outline" size={24} color="#9ca3af" />
                                        )}
                                    </View>

                                    {/* Info */}
                                    <View className="flex-1 gap-1">
                                        <View className="flex-row items-center gap-2">
                                            <Typography className="text-sm font-semibold text-foreground flex-1" numberOfLines={1}>
                                                {product.name}
                                            </Typography>
                                            <Chip
                                                color={product.is_active ? 'success' : 'default'}
                                                size="sm"
                                                variant="soft"
                                            >
                                                <Chip.Label>{product.is_active ? 'Active' : 'Inactive'}</Chip.Label>
                                            </Chip>
                                        </View>

                                        <View className="flex-row items-center gap-1.5">
                                            {category && (
                                                <Typography className="text-xs text-muted-foreground">
                                                    {category.name}
                                                </Typography>
                                            )}
                                            {category && product.add_ons.length > 0 && (
                                                <Typography className="text-xs text-muted-foreground">·</Typography>
                                            )}
                                            {product.add_ons.length > 0 && (
                                                <Typography className="text-xs text-muted-foreground">
                                                    {product.add_ons.length} add-on group{product.add_ons.length !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </View>

                                        <View className="flex-row items-center gap-2">
                                            {isDiscounted && (
                                                <Typography className="text-xs text-muted line-through">
                                                    {formatRupiah(product.original_price!)}
                                                </Typography>
                                            )}
                                            <Typography className={`text-sm font-semibold ${isDiscounted ? 'text-accent' : 'text-foreground'}`}>
                                                {product.price === 0 ? 'Free' : formatRupiah(product.price)}
                                            </Typography>
                                        </View>
                                    </View>

                                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                                </Pressable>
                                {index < filtered.length - 1 && <Separator className="mx-4" />}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

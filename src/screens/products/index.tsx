import { useProducts } from '@/hooks/db/useProducts';
import { useCategories } from '@/hooks/db/useCategories';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
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

    const {
        data: allProductsRaw,
        isLoading,
        isError,
        error,
        refetch,
    } = useProducts(search || undefined, categoryId || undefined);
    const allProducts = allProductsRaw ?? [];
    const { data: categoriesList = [] } = useCategories();

    const filtered = allProducts.filter((p) => {
        return (
            activeFilter === 'all' ||
            (activeFilter === 'active' && p.is_active) ||
            (activeFilter === 'inactive' && !p.is_active)
        );
    });

    const totalProducts = allProducts.length;
    const activeCount = allProducts.filter((p) => p.is_active).length;
    const categoryCount = categoriesList.length;

    const selectedCategory = categoriesList.find((c) => c.id === categoryId);

    return (
        <View className="flex-1 bg-background">
            {/* Stats */}
            <View className="flex-row gap-3 px-5 pt-5 pb-2">
                <Surface variant="secondary" className="flex-1 items-start px-4 py-3 gap-0.5">
                    <Typography type="h5" weight="bold" className="tabular-nums">{totalProducts}</Typography>
                    <Typography type="body-xs" color="muted">Total</Typography>
                </Surface>
                <Surface variant="secondary" className="flex-1 items-start px-4 py-3 gap-0.5">
                    <Typography type="h5" weight="bold" className="text-success tabular-nums">{activeCount}</Typography>
                    <Typography type="body-xs" color="muted">Active</Typography>
                </Surface>
                <Surface variant="secondary" className="flex-1 items-start px-4 py-3 gap-0.5">
                    <Typography type="h5" weight="bold" className="tabular-nums">{categoryCount}</Typography>
                    <Typography type="body-xs" color="muted">Categories</Typography>
                </Surface>
            </View>

            {/* Filters */}
            <View className="px-5 py-3 gap-3">
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
                                    {categoriesList.map((cat) => (
                                        <Select.Item key={cat.id} value={cat.id} label={cat.name} />
                                    ))}
                                </Select.Content>
                            </Select.Portal>
                        </Select>
                    </View>
                </View>

                <Button className="self-start" onPress={() => router.push('/products/new' as never)}>
                    <Ionicons name="add" size={16} color="white" />
                    <Button.Label>New Product</Button.Label>
                </Button>

                {/* Active filter pills */}
                <View className="flex-row items-center gap-2 flex-wrap">
                    {(['all', 'active', 'inactive'] as const).map((f) => {
                        const isSelected = activeFilter === f;
                        const label = f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive';
                        return (
                            <Chip
                                key={f}
                                onPress={() => setActiveFilter(f)}
                                variant={isSelected ? 'primary' : 'secondary'}
                                color={f === 'inactive' ? 'default' : f === 'active' ? 'success' : 'accent'}
                                size="sm"
                            >
                                <Chip.Label>{label}</Chip.Label>
                            </Chip>
                        );
                    })}
                    <Typography type="body-xs" color="muted" className="ml-auto">
                        {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                    </Typography>
                </View>
            </View>

            <Separator />

            {/* Product list */}
            {isLoading ? (
                <LoadingState message="Loading products…" />
            ) : isError ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : (
            <ScrollView className="flex-1" contentContainerClassName="py-2">
                {filtered.length === 0 ? (
                    <EmptyState icon="search-outline" message="No products found" />
                ) : (
                    filtered.map((product, index) => {
                        const category = categoriesList.find((c) => c.id === product.category_id);
                        const isDiscounted = product.original_price !== null;

                        return (
                            <View key={product.id}>
                                <Pressable
                                    onPress={() => router.push(`/products/${product.id}` as never)}
                                    className="flex-row items-center gap-4 px-5 py-3 active:bg-surface-secondary"
                                >
                                    {/* Thumbnail */}
                                    <View className="w-14 h-14 rounded-panel-inner bg-surface-secondary overflow-hidden items-center justify-center flex-shrink-0">
                                        {product.thumbnail_url ? (
                                            <Image
                                                source={{ uri: product.thumbnail_url }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Ionicons name="fast-food-outline" size={24} color="hsl(var(--muted))" />
                                        )}
                                    </View>

                                    {/* Info */}
                                    <View className="flex-1 gap-1">
                                        <View className="flex-row items-center gap-2">
                                            <Typography type="body-sm" weight="semibold" className="flex-1" numberOfLines={1}>
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
                                                <Typography type="body-xs" color="muted">
                                                    {category.name}
                                                </Typography>
                                            )}
                                            {category && product.add_ons.length > 0 && (
                                                <Typography type="body-xs" color="muted">·</Typography>
                                            )}
                                            {product.add_ons.length > 0 && (
                                                <Typography type="body-xs" color="muted">
                                                    {product.add_ons.length} add-on group{product.add_ons.length !== 1 ? 's' : ''}
                                                </Typography>
                                            )}
                                        </View>

                                        <View className="flex-row items-center gap-2">
                                            {isDiscounted && (
                                                <Typography type="body-xs" color="muted" className="line-through">
                                                    {formatRupiah(product.original_price!)}
                                                </Typography>
                                            )}
                                            <Typography type="body-sm" weight="semibold" className={`tabular-nums ${isDiscounted ? 'text-accent' : ''}`}>
                                                {product.price === 0 ? 'Free' : formatRupiah(product.price)}
                                            </Typography>
                                        </View>
                                    </View>

                                    <Ionicons name="chevron-forward" size={16} color="hsl(var(--muted))" />
                                </Pressable>
                                {index < filtered.length - 1 && <Separator className="mx-5" />}
                            </View>
                        );
                    })
                )}
            </ScrollView>
            )}
        </View>
    );
}

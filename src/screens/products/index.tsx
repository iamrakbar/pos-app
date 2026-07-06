import { useProducts } from '@/hooks/db/useProducts';
import { useCategories } from '@/hooks/db/useCategories';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { formatRupiah } from '@/utils/format';
import { useNavigationTheme } from '@/utils/navigationTheme';
import { getToolbarIcon } from '@/utils/toolbarIcons';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Separator, Typography, useThemeColor } from 'heroui-native';
import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function ProductsScreen(): React.JSX.Element {
    const router = useRouter();
    const themeColorMuted = useThemeColor('muted');
    const theme = useNavigationTheme();
    const [search, setSearch] = React.useState('');
    const deferredSearch = React.useDeferredValue(search.trim());
    const [categoryId, setCategoryId] = React.useState<string | null>(null);
    const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

    const {
        data: allProductsRaw,
        isLoading,
        isError,
        error,
        refetch,
    } = useProducts(deferredSearch || undefined, categoryId || undefined);
    const allProducts = allProductsRaw ?? [];
    const { data: categoriesList = [] } = useCategories();

    const filtered = allProducts.filter((p) => {
        return (
            activeFilter === 'all' ||
            (activeFilter === 'active' && p.is_active) ||
            (activeFilter === 'inactive' && !p.is_active)
        );
    });

    const selectedCategory = categoriesList.find((c) => c.id === categoryId);

    return (
        <>
            <Stack.Toolbar placement='right'>
                <Stack.SearchBar
                    placement='integratedCentered'
                    placeholder="Search..."
                    barTintColor={theme.surface}
                    tintColor={theme.foreground}
                    textColor={theme.foreground}
                    hintTextColor={theme.muted}
                    headerIconColor={theme.foreground}
                    onChangeText={(event) => setSearch(event.nativeEvent.text)}
                    onClose={() => setSearch('')}
                />
                <Stack.Toolbar.Menu
                    {...getToolbarIcon('filter')}
                    tintColor={theme.foreground}
                    accessibilityLabel="Filter products"
                >
                    <Stack.Toolbar.Label>Filter</Stack.Toolbar.Label>
                    <Stack.Toolbar.MenuAction
                        onPress={() => setActiveFilter('all')}
                        isOn={activeFilter === 'all'}
                    >
                        All
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction
                        onPress={() => setActiveFilter('active')}
                        isOn={activeFilter === 'active'}
                    >
                        Active
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction
                        onPress={() => setActiveFilter('inactive')}
                        isOn={activeFilter === 'inactive'}
                    >
                        Inactive
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
                <Stack.Toolbar.Menu
                    {...getToolbarIcon('category')}
                    tintColor={theme.foreground}
                    accessibilityLabel="Choose category"
                >
                    <Stack.Toolbar.Label>{selectedCategory?.name || 'Category'}</Stack.Toolbar.Label>
                    <Stack.Toolbar.MenuAction
                        onPress={() => setCategoryId(null)}
                        isOn={categoryId === null}
                    >
                        All
                    </Stack.Toolbar.MenuAction>
                    {categoriesList.map((cat) => (
                        <Stack.Toolbar.MenuAction
                            key={cat.id}
                            onPress={() => setCategoryId(cat.id)}
                            isOn={categoryId === cat.id}
                        >
                            {cat.name}
                        </Stack.Toolbar.MenuAction>
                    ))}
                </Stack.Toolbar.Menu>
                <Stack.Toolbar.Button
                    {...getToolbarIcon('add')}
                    tintColor={theme.foreground}
                    accessibilityLabel="Add product"
                    onPress={() => router.push('/products/new')} />
            </Stack.Toolbar>
            <View className="flex-1 bg-background">

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
                                            <View className="w-14 h-14 rounded-panel-inner bg-surface-secondary overflow-hidden items-center justify-center shrink-0">
                                                {product.thumbnail_url ? (
                                                    <Image
                                                        source={{ uri: product.thumbnail_url }}
                                                        className="w-full h-full"
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <Ionicons name="fast-food-outline" size={24} color={themeColorMuted} />
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

                                            <Ionicons name="chevron-forward" size={16} color={themeColorMuted} />
                                        </Pressable>
                                        {index < filtered.length - 1 && <Separator className="mx-5" />}
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                )}
            </View>
        </>
    );
}

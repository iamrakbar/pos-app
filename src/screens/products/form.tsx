import { useProduct } from '@/hooks/db/useProducts';
import { useCategories } from '@/hooks/db/useCategories';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { productSchema, type ProductFormValues } from '@/schemas/product';
import { formatRupiah } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Card,
    Select,
    Separator,
    Typography,
} from 'heroui-native';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type { AddOnGroup } from '@/types/pos';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addonConstraintLabel(group: AddOnGroup): string {
    if (!group.required) {
        return `Optional${group.max > 0 ? `, max ${group.max}` : ''}`;
    }
    return `Required · min ${group.min}, max ${group.max}`;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <Typography className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}{required && <Typography className="text-danger"> *</Typography>}
        </Typography>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <Typography className="text-xs text-danger mt-0.5">{message}</Typography>;
}

type ProcessedImage = { imageUrl: string; thumbnailUrl: string };

async function pickAndProcess(source: 'library' | 'camera'): Promise<ProcessedImage | null> {
    let rawUri: string | null = null;

    if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Camera access is needed to take photos.');
            return null;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        rawUri = result.canceled ? null : result.assets[0].uri;
    } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Photo library access is needed to select images.');
            return null;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        rawUri = result.canceled ? null : result.assets[0].uri;
    }

    if (!rawUri) return null;

    const [full, thumb] = await Promise.all([
        manipulateAsync(rawUri, [{ resize: { width: 1200 } }], { compress: 0.8, format: SaveFormat.JPEG }),
        manipulateAsync(rawUri, [{ resize: { width: 200 } }], { compress: 0.75, format: SaveFormat.JPEG }),
    ]);

    const imagesDir = new Directory(Paths.document, 'product-images');
    if (!imagesDir.exists) {
        imagesDir.create({ intermediates: true });
    }

    const ts = Date.now();
    const fullDest = new File(imagesDir, `${ts}_full.jpg`);
    const thumbDest = new File(imagesDir, `${ts}_thumb.jpg`);

    await Promise.all([
        new File(full.uri).move(fullDest),
        new File(thumb.uri).move(thumbDest),
    ]);

    return { imageUrl: fullDest.uri, thumbnailUrl: thumbDest.uri };
}

function ImagePickerField({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (result: ProcessedImage | null) => void;
}) {
    const openPicker = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Choose from Library', 'Take Photo'],
                    cancelButtonIndex: 0,
                },
                async (idx) => {
                    if (idx === 1) onChange(await pickAndProcess('library'));
                    if (idx === 2) onChange(await pickAndProcess('camera'));
                },
            );
        } else {
            Alert.alert('Product Image', 'Choose a source', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Choose from Library', onPress: async () => onChange(await pickAndProcess('library')) },
                { text: 'Take Photo', onPress: async () => onChange(await pickAndProcess('camera')) },
            ]);
        }
    };

    return (
        <Pressable onPress={openPicker} className="active:opacity-80">
            <View className="w-full aspect-video rounded-xl overflow-hidden bg-muted">
                {value ? (
                    <>
                        <Image source={{ uri: value }} className="w-full h-full" resizeMode="cover" />
                        <View className="absolute inset-0 items-end justify-end p-3">
                            <View className="bg-black/50 rounded-full p-2">
                                <Ionicons name="camera" size={18} color="white" />
                            </View>
                        </View>
                    </>
                ) : (
                    <View className="flex-1 items-center justify-center gap-3">
                        <View className="w-16 h-16 rounded-full bg-muted-foreground/10 items-center justify-center">
                            <Ionicons name="camera-outline" size={28} color="#9ca3af" />
                        </View>
                        <View className="items-center gap-1">
                            <Typography className="text-sm font-medium text-foreground">Add product image</Typography>
                            <Typography className="text-xs text-muted-foreground">Tap to choose from library or camera</Typography>
                        </View>
                        <View className="flex-row gap-3 mt-1">
                            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted-foreground/10">
                                <Ionicons name="images-outline" size={14} color="#9ca3af" />
                                <Typography className="text-xs text-muted-foreground">Library</Typography>
                            </View>
                            <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted-foreground/10">
                                <Ionicons name="camera-outline" size={14} color="#9ca3af" />
                                <Typography className="text-xs text-muted-foreground">Camera</Typography>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

function StyledInput({ value, onChangeText, placeholder, keyboardType, multiline, error }: {
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'decimal-pad' | 'url';
    multiline?: boolean;
    error?: boolean;
}) {
    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            keyboardType={keyboardType ?? 'default'}
            multiline={multiline}
            style={{
                borderWidth: 1,
                borderColor: error ? '#ef4444' : 'hsl(var(--border))',
                borderRadius: 12,
                minHeight: multiline ? 80 : 44,
                paddingHorizontal: 12,
                paddingVertical: multiline ? 10 : 0,
                fontSize: 14,
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--background))',
                textAlignVertical: multiline ? 'top' : 'center',
            }}
        />
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProductFormScreen(): React.JSX.Element {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const isNew = id === 'new';

    const { data: existingProduct } = useProduct(id);
    const { data: categoriesList = [] } = useCategories();

    const [addOnGroups, setAddOnGroups] = React.useState<AddOnGroup[]>([]);
    const [expandedGroupId, setExpandedGroupId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (existingProduct) {
            setAddOnGroups(existingProduct.add_ons);
        }
    }, [existingProduct]);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProductFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: existingProduct?.name ?? '',
            price: existingProduct?.price ?? 0,
            original_price: existingProduct?.original_price ?? null,
            image_url: existingProduct?.image_url ?? null,
            thumbnail_url: existingProduct?.thumbnail_url ?? null,
            category_id: existingProduct?.category_id ?? null,
            is_active: existingProduct?.is_active ?? true,
        },
    });

    const isActive = watch('is_active');
    const watchedCategoryId = watch('category_id');

    const onSubmit = (values: ProductFormValues) => {
        const now = Date.now();
        if (isNew) {
            const newId = `prod-${now}`;
            db.insert(products).values({
                id: newId,
                name: values.name,
                price: values.price,
                original_price: values.original_price ?? null,
                image_url: values.image_url ?? null,
                thumbnail_url: values.thumbnail_url ?? null,
                category_id: values.category_id ?? null,
                is_active: values.is_active ? 1 : 0,
                add_ons_json: JSON.stringify(addOnGroups),
                created_at: now,
                updated_at: now,
                is_dirty: 1,
            }).run();
        } else if (id && existingProduct) {
            db.update(products).set({
                name: values.name,
                price: values.price,
                original_price: values.original_price ?? null,
                image_url: values.image_url ?? null,
                thumbnail_url: values.thumbnail_url ?? null,
                category_id: values.category_id ?? null,
                is_active: values.is_active ? 1 : 0,
                add_ons_json: JSON.stringify(addOnGroups),
                updated_at: now,
                is_dirty: 1,
            }).where(eq(products.id, id)).run();
        }
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        router.back();
    };

    const selectedCategory = categoriesList.find((c) => c.id === watchedCategoryId);

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="p-4 gap-4 pb-10"
                keyboardShouldPersistTaps="handled"
            >
                {/* Back row */}
                <Pressable
                    onPress={() => router.back()}
                    className="flex-row items-center gap-1 self-start active:opacity-70"
                >
                    <Ionicons name="chevron-back" size={18} color="hsl(var(--primary))" />
                    <Typography className="text-sm text-primary">Products</Typography>
                </Pressable>

                <Typography className="text-xl font-bold text-foreground">
                    {isNew ? 'New Product' : 'Edit Product'}
                </Typography>

                {/* ── Image picker ── */}
                <Controller
                    control={control}
                    name="image_url"
                    render={({ field }) => (
                        <ImagePickerField
                            value={field.value}
                            onChange={(result) => {
                                field.onChange(result?.imageUrl ?? null);
                                setValue('thumbnail_url', result?.thumbnailUrl ?? null);
                            }}
                        />
                    )}
                />

                {/* ── Basic info ── */}
                <Card>
                    <Card.Header>
                        <Card.Title>Basic Info</Card.Title>
                    </Card.Header>
                    <Card.Body className="gap-4">
                        {/* Name */}
                        <View className="gap-1.5">
                            <FieldLabel label="Product name" required />
                            <Controller
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <StyledInput
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        placeholder="e.g. Grilled Salmon"
                                        error={!!errors.name}
                                    />
                                )}
                            />
                            <FieldError message={errors.name?.message} />
                        </View>

                        {/* Category */}
                        <View className="gap-1.5">
                            <FieldLabel label="Category" />
                            <Controller
                                control={control}
                                name="category_id"
                                render={({ field }) => (
                                    <Select
                                        value={
                                            selectedCategory
                                                ? { value: selectedCategory.id, label: selectedCategory.name }
                                                : undefined
                                        }
                                        onValueChange={(opt) => field.onChange(opt?.value ?? null)}
                                    >
                                        <Select.Trigger>
                                            <Select.Value placeholder="Select category" numberOfLines={1} />
                                            <Select.TriggerIndicator />
                                        </Select.Trigger>
                                        <Select.Portal>
                                            <Select.Overlay />
                                            <Select.Content presentation="popover" width="trigger">
                                                <Select.Item value="" label="No category" />
                                                {categoriesList.map((cat) => (
                                                    <Select.Item key={cat.id} value={cat.id} label={cat.name} />
                                                ))}
                                            </Select.Content>
                                        </Select.Portal>
                                    </Select>
                                )}
                            />
                        </View>

                        {/* Price row */}
                        <View className="flex-row gap-3">
                            <View className="flex-1 gap-1.5">
                                <FieldLabel label="Price (Rp)" required />
                                <Controller
                                    control={control}
                                    name="price"
                                    render={({ field }) => (
                                        <StyledInput
                                            value={field.value === 0 ? '' : String(field.value)}
                                            onChangeText={field.onChange}
                                            placeholder="0"
                                            keyboardType="decimal-pad"
                                            error={!!errors.price}
                                        />
                                    )}
                                />
                                <FieldError message={errors.price?.message} />
                            </View>

                            <View className="flex-1 gap-1.5">
                                <FieldLabel label="Original price (Rp)" />
                                <Controller
                                    control={control}
                                    name="original_price"
                                    render={({ field }) => (
                                        <StyledInput
                                            value={field.value == null ? '' : String(field.value)}
                                            onChangeText={(v) => field.onChange(v === '' ? null : v)}
                                            placeholder="Kosongkan jika tidak diskon"
                                            keyboardType="decimal-pad"
                                            error={!!errors.original_price}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        {/* Active toggle */}
                        <View className="flex-row items-center justify-between">
                            <View className="gap-0.5">
                                <Typography className="text-sm font-medium text-foreground">Active</Typography>
                                <Typography className="text-xs text-muted-foreground">
                                    {isActive ? 'Product is visible on POS' : 'Product is hidden from POS'}
                                </Typography>
                            </View>
                            <Controller
                                control={control}
                                name="is_active"
                                render={({ field }) => (
                                    <Pressable
                                        onPress={() => field.onChange(!field.value)}
                                        style={{
                                            width: 48,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: field.value ? '#22c55e' : '#e5e7eb',
                                            padding: 2,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                backgroundColor: 'white',
                                                shadowColor: '#000',
                                                shadowOpacity: 0.15,
                                                shadowRadius: 2,
                                                shadowOffset: { width: 0, height: 1 },
                                                alignSelf: field.value ? 'flex-end' : 'flex-start',
                                            }}
                                        />
                                    </Pressable>
                                )}
                            />
                        </View>
                    </Card.Body>
                </Card>

                {/* ── Add-on groups ── */}
                <Card>
                    <Card.Header>
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Card.Title>Add-on Groups</Card.Title>
                                <Card.Description>
                                    {addOnGroups.length === 0
                                        ? 'No add-on groups yet'
                                        : `${addOnGroups.length} group${addOnGroups.length !== 1 ? 's' : ''}`}
                                </Card.Description>
                            </View>
                            <Pressable
                                className="flex-row items-center gap-1 active:opacity-70"
                                onPress={() => {/* no-op */}}
                            >
                                <Ionicons name="add-circle-outline" size={18} color="hsl(var(--primary))" />
                                <Typography className="text-sm text-primary">Add group</Typography>
                            </Pressable>
                        </View>
                    </Card.Header>

                    {addOnGroups.length > 0 && (
                        <Card.Body className="gap-0 p-0">
                            {addOnGroups.map((group, index) => {
                                const isExpanded = expandedGroupId === group.id;
                                return (
                                    <View key={group.id}>
                                        {index > 0 && <Separator />}
                                        <Pressable
                                            onPress={() => setExpandedGroupId(isExpanded ? null : group.id)}
                                            className="flex-row items-center gap-3 px-4 py-3 active:bg-muted/30"
                                        >
                                            <View className="flex-1 gap-0.5">
                                                <Typography className="text-sm font-semibold text-foreground">
                                                    {group.name}
                                                </Typography>
                                                <Typography className="text-xs text-muted-foreground">
                                                    {addonConstraintLabel(group)} · {group.options.length} option{group.options.length !== 1 ? 's' : ''}
                                                </Typography>
                                            </View>
                                            <View className="flex-row items-center gap-2">
                                                <Pressable onPress={() => {}} className="p-1.5 active:opacity-70">
                                                    <Ionicons name="pencil-outline" size={16} color="hsl(var(--muted-foreground))" />
                                                </Pressable>
                                                <Pressable onPress={() => setAddOnGroups((prev) => prev.filter((g) => g.id !== group.id))} className="p-1.5 active:opacity-70">
                                                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                                </Pressable>
                                                <Ionicons
                                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                    size={14}
                                                    color="#9ca3af"
                                                />
                                            </View>
                                        </Pressable>

                                        {isExpanded && (
                                            <View className="bg-muted/20 px-4 pb-3 gap-1">
                                                {group.options.map((opt) => (
                                                    <View key={opt.id} className="flex-row items-center justify-between py-1.5">
                                                        <Typography className="text-sm text-foreground">{opt.name}</Typography>
                                                        <Typography className="text-sm font-semibold text-foreground">
                                                            {opt.price === 0 ? 'Free' : `+${formatRupiah(opt.price)}`}
                                                        </Typography>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </Card.Body>
                    )}
                </Card>
            </ScrollView>

            {/* ── Footer actions ── */}
            <View className="flex-row gap-3 bg-surface p-4 border-t border-border">
                <Button variant="outline" onPress={() => router.back()}>
                    Cancel
                </Button>
                <Button className="flex-1" onPress={handleSubmit(onSubmit)}>
                    <Ionicons name="checkmark-outline" size={16} color="white" />
                    <Button.Label className="ml-1.5">
                        {isNew ? 'Create product' : 'Save changes'}
                    </Button.Label>
                </Button>
            </View>
        </View>
    );
}

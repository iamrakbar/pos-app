import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/data/pos-mock';
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
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { AddOnGroup } from '@/types/pos';

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
    const isNew = id === 'new';

    const existingProduct = isNew ? null : MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
    const [addOnGroups, setAddOnGroups] = React.useState<AddOnGroup[]>(
        existingProduct?.add_ons ?? [],
    );
    const [expandedGroupId, setExpandedGroupId] = React.useState<string | null>(null);

    const {
        control,
        handleSubmit,
        watch,
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

    const imageUrl = watch('image_url');
    const isActive = watch('is_active');

    const onSubmit = (_values: ProductFormValues) => {
        // No-op — will wire to API later
        router.back();
    };

    const selectedCategory = MOCK_CATEGORIES.find(
        (c) => c.id === watch('category_id'),
    );

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

                {/* ── Image preview ── */}
                {imageUrl ? (
                    <View className="w-full aspect-video rounded-xl overflow-hidden bg-muted">
                        <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
                    </View>
                ) : (
                    <View className="w-full aspect-video rounded-xl bg-muted items-center justify-center gap-2">
                        <Ionicons name="image-outline" size={40} color="#9ca3af" />
                        <Typography className="text-xs text-muted-foreground">No image</Typography>
                    </View>
                )}

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
                                                {MOCK_CATEGORIES.map((cat) => (
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

                {/* ── Images ── */}
                <Card>
                    <Card.Header>
                        <Card.Title>Images</Card.Title>
                        <Card.Description>Paste image URLs (Unsplash, CDN, etc.)</Card.Description>
                    </Card.Header>
                    <Card.Body className="gap-4">
                        <View className="gap-1.5">
                            <FieldLabel label="Image URL" />
                            <Controller
                                control={control}
                                name="image_url"
                                render={({ field }) => (
                                    <StyledInput
                                        value={field.value ?? ''}
                                        onChangeText={(v) => field.onChange(v || null)}
                                        placeholder="https://..."
                                        keyboardType="url"
                                    />
                                )}
                            />
                        </View>
                        <View className="gap-1.5">
                            <FieldLabel label="Thumbnail URL" />
                            <Controller
                                control={control}
                                name="thumbnail_url"
                                render={({ field }) => (
                                    <StyledInput
                                        value={field.value ?? ''}
                                        onChangeText={(v) => field.onChange(v || null)}
                                        placeholder="https://..."
                                        keyboardType="url"
                                    />
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

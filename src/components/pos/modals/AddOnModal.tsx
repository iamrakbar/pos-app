import { useCartStore } from '@/stores/useCartStore';
import { usePOSStore } from '@/stores/usePOSStore';
import { createAddOnSchema, type AddOnFormValues } from '@/schemas/addon';
import type { AddOnGroup, AddOnOption } from '@/types/pos';
import { formatRupiah } from '@/utils/format';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Checkbox,
    Dialog,
    RadioGroup,
    Separator,
    Typography,
    TextArea,
    Surface,
    ControlField,
    Label,
} from 'heroui-native';
import type { JSX } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import React, { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

function constraintLabel(group: AddOnGroup): string {
    if (!group.required) {
        return `Opsional${group.max > 0 ? `, maks. ${group.max}` : ''}`;
    }
    return `Wajib, min. ${group.min}, pilih ${group.max}`;
}

function optionLabel(option: AddOnOption): string {
    if (option.price === 0) return `${option.name} +Rp0`;
    return `${option.name} +${formatRupiah(option.price)}`;
}

export default function AddOnModal(): JSX.Element {
    const modal = usePOSStore((s) => s.modal);
    const product = usePOSStore((s) => s.selectedProduct);
    const editingCartItemId = usePOSStore((s) => s.editingCartItemId);
    const closeModal = usePOSStore((s) => s.closeModal);

    const cartProducts = useCartStore((s) => s.products);
    const addItem = useCartStore((s) => s.addItem);
    const removeItem = useCartStore((s) => s.removeItem);

    const { height: windowHeight } = useWindowDimensions();
    const isOpen = modal === 'addon';

    const dialogMaxHeight = windowHeight * 0.88;
    const scrollMaxHeight = dialogMaxHeight - 220;

    const schema = useMemo(
        () => createAddOnSchema(product?.add_ons ?? []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [product?.id],
    );

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddOnFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { radioSelections: {}, checkboxSelections: {}, notes: '' },
    });

    useEffect(() => {
        if (!isOpen) {
            reset({ radioSelections: {}, checkboxSelections: {}, notes: '' });
            return;
        }
        if (editingCartItemId && product) {
            const existing = cartProducts.find((i) => i.id === editingCartItemId);
            if (existing) {
                const radioSelections: Record<string, string> = {};
                const checkboxSelections: Record<string, string[]> = {};
                existing.add_ons.forEach((ao) => {
                    const group = product.add_ons.find((g) => g.id === ao.id);
                    if (!group) return;
                    if (group.multiple) {
                        checkboxSelections[ao.id] = ao.options.map((o) => o.id);
                    } else {
                        const first = ao.options[0];
                        if (first) radioSelections[ao.id] = first.id;
                    }
                });
                reset({ radioSelections, checkboxSelections, notes: existing.notes ?? '' });
            }
        }
    }, [isOpen, editingCartItemId, cartProducts, product, reset]);

    if (!product) return <></>;

    const buildCartAddOns = (values: AddOnFormValues) => {
        return product.add_ons
            .map((group) => {
                const selectedOptionIds = group.multiple
                    ? (values.checkboxSelections[group.id] ?? [])
                    : values.radioSelections[group.id]
                        ? [values.radioSelections[group.id]]
                        : [];
                const options = group.options.filter((o) => selectedOptionIds.includes(o.id));
                if (options.length === 0) return null;
                return { id: group.id, name: group.name, options };
            })
            .filter(Boolean) as { id: string; name: string; options: AddOnOption[] }[];
    };

    const onSubmit = (values: AddOnFormValues) => {
        const addOns = buildCartAddOns(values);
        const addOnTotal = addOns.flatMap((ao) => ao.options).reduce((sum, o) => sum + o.price, 0);
        if (editingCartItemId) removeItem(editingCartItemId);
        addItem({
            product_id: product.id,
            name: product.name,
            price: product.price + addOnTotal,
            qty: 1,
            notes: values.notes.trim() || null,
            add_ons: addOns,
        });
        closeModal();
    };

    return (
        <Dialog isOpen={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    isSwipeable={false}
                    className="w-full max-w-3xl self-center bg-background p-0 overflow-hidden"
                    style={{ maxHeight: dialogMaxHeight }}
                >
                    <View className="flex-row justify-between gap-4 bg-surface p-4">
                        <View >
                            <Dialog.Title>{product.name}</Dialog.Title>
                            <Typography className="text-sm text-muted-foreground">
                                {formatRupiah(product.price)}
                            </Typography>
                        </View>
                        <Dialog.Close />
                    </View>

                    <Separator />

                    <ScrollView
                        showsVerticalScrollIndicator
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: scrollMaxHeight }}
                        contentContainerClassName='p-4 gap-4 bg-background'
                    >
                        {product.add_ons.map((group) => (
                            <View key={group.id} className="gap-4">
                                <Typography className="text-sm font-semibold text-foreground">
                                    {group.name}
                                    {group.required && <Typography className="text-danger"> *</Typography>}
                                </Typography>

                                {!group.multiple ? (
                                    <Controller
                                        control={control}
                                        name={`radioSelections.${group.id}`}
                                        render={({ field }) => (
                                            <Surface className="py-5 w-full">
                                                <RadioGroup value={field.value ?? ''} onValueChange={field.onChange}>
                                                    {group.options.map((option, index) => (
                                                        <React.Fragment key={option.id}>
                                                            {index > 0 && <Separator className="my-1" />}
                                                            <RadioGroup.Item value={option.id}>
                                                                {optionLabel(option)}
                                                            </RadioGroup.Item>
                                                        </React.Fragment>
                                                    ))}
                                                </RadioGroup>
                                            </Surface>

                                        )}
                                    />
                                ) : (
                                    <Controller
                                        control={control}
                                        name={`checkboxSelections.${group.id}`}
                                        render={({ field }) => {
                                            const selected: string[] = field.value ?? [];
                                            return (
                                                <Surface className="py-5 w-full">
                                                    {group.options.map((option, index) => {
                                                        const isSelected = selected.includes(option.id);
                                                        const maxReached = !isSelected && selected.length >= group.max;
                                                        return (
                                                            <React.Fragment key={option.id}>
                                                                {index > 0 && <Separator className="my-4" />}
                                                                <ControlField
                                                                    isSelected={isSelected}
                                                                    isDisabled={maxReached}
                                                                    onSelectedChange={() => {
                                                                        const next = isSelected
                                                                            ? selected.filter((id) => id !== option.id)
                                                                            : [...selected, option.id];
                                                                        field.onChange(next);
                                                                    }}>
                                                                    <View className="flex-1">
                                                                        <Label>{optionLabel(option)}</Label>
                                                                    </View>
                                                                    <ControlField.Indicator>
                                                                        <Checkbox className="mt-0.5" />
                                                                    </ControlField.Indicator>
                                                                </ControlField>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </Surface>
                                            );
                                        }}
                                    />
                                )}

                                <Typography className="text-xs text-muted-foreground">{constraintLabel(group)}</Typography>
                                {(errors.radioSelections?.[group.id] || errors.checkboxSelections?.[group.id]) && (
                                    <Typography className="text-xs text-danger">
                                        {errors.radioSelections?.[group.id]?.message ??
                                            errors.checkboxSelections?.[group.id]?.message}
                                    </Typography>
                                )}
                            </View>
                        ))}

                        <View className="gap-2">
                            <Typography className="text-sm font-semibold text-foreground">Catatan</Typography>
                            <Controller
                                control={control}
                                name="notes"
                                render={({ field }) => (
                                    <TextArea
                                        value={field.value}
                                        onChangeText={field.onChange}
                                        placeholder=""
                                        className="min-h-20"
                                    />
                                )}
                            />
                        </View>
                    </ScrollView>

                    <Separator />

                    <View className="flex-row gap-3 bg-surface p-4">
                        <Button variant="outline" onPress={closeModal}>
                            Batal
                        </Button>
                        <Button className="flex-1" onPress={handleSubmit(onSubmit)}>
                            {editingCartItemId ? 'Simpan perubahan' : 'Tambahkan ke keranjang'}
                        </Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

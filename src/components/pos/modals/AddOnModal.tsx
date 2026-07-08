import { useCartStore } from "@/stores/useCartStore";
import { usePOSStore } from "@/stores/usePOSStore";
import { createAddOnSchema, type AddOnFormValues } from "@/schemas/addon";
import type { AddOnGroup, AddOnOption } from "@/types/pos";
import { formatRupiah } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
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
    FieldError,
    Description,
} from "heroui-native";
import type { JSX } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import React, { memo, useCallback, useMemo, useEffect, useState } from "react";
import { useForm, Controller, type Control } from "react-hook-form";

function constraintLabel(group: AddOnGroup): string {
    if (!group.required) {
        return `Opsional${group.max > 0 ? `, maks. ${group.max}` : ""}`;
    }
    return `Wajib, min. ${group.min}, pilih ${group.max}`;
}

function optionLabel(option: AddOnOption): string {
    if (option.price === 0) return `${option.name} +Rp0`;
    return `${option.name} +${formatRupiah(option.price)}`;
}

type AddOnSelectionControlProps = {
    control: Control<AddOnFormValues>;
    group: AddOnGroup;
};

const AddOnRadioGroup = memo(function AddOnRadioGroup({
    control,
    group,
}: AddOnSelectionControlProps): JSX.Element {
    const options = useMemo(
        () => group.options.map((option) => ({ ...option, label: optionLabel(option) })),
        [group.options]
    );

    return (
        <Controller
            control={control}
            name={`radioSelections.${group.id}`}
            render={({ field }) => (
                <ControlField>
                    <Surface className="py-5 w-full">
                        <RadioGroup value={field.value ?? ""} onValueChange={field.onChange}>
                            {options.map((option, index) => (
                                <React.Fragment key={option.id}>
                                    {index > 0 && <Separator className="my-1" />}
                                    <RadioGroup.Item value={option.id}>{option.label}</RadioGroup.Item>
                                </React.Fragment>
                            ))}
                        </RadioGroup>
                    </Surface>
                </ControlField>
            )}
        />
    );
});

const AddOnCheckboxGroup = memo(function AddOnCheckboxGroup({
    control,
    group,
}: AddOnSelectionControlProps): JSX.Element {
    const options = useMemo(
        () => group.options.map((option) => ({ ...option, label: optionLabel(option) })),
        [group.options]
    );

    return (
        <Controller
            control={control}
            name={`checkboxSelections.${group.id}`}
            render={({ field }) => {
                const selected: string[] = field.value ?? [];
                return (
                    <Surface className="py-5 w-full">
                        {options.map((option, index) => {
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
                                        }}
                                    >
                                        <View className="flex-1">
                                            <Label>{option.label}</Label>
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
    );
});

export default function AddOnModal(): JSX.Element {
    const modal = usePOSStore((s) => s.modal);
    const product = usePOSStore((s) => s.selectedProduct);
    const editingCartItemId = usePOSStore((s) => s.editingCartItemId);
    const closeModal = usePOSStore((s) => s.closeModal);

    const editingCartItem = useCartStore((s) =>
        editingCartItemId ? s.products.find((item) => item.id === editingCartItemId) : undefined
    );
    const addItem = useCartStore((s) => s.addItem);
    const removeItem = useCartStore((s) => s.removeItem);

    const { height: windowHeight } = useWindowDimensions();
    const isOpen = modal === "addon";

    const dialogMaxHeight = windowHeight * 0.88;
    const scrollMaxHeight = dialogMaxHeight - 220;
    const [submitError, setSubmitError] = useState<string | null>(null);

    const schema = useMemo(
        () => createAddOnSchema(product?.add_ons ?? []),
        [product?.add_ons]
    );

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddOnFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { radioSelections: {}, checkboxSelections: {}, notes: "" },
    });

    useEffect(() => {
        if (editingCartItemId && product) {
            const existing = editingCartItem;
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
                reset({ radioSelections, checkboxSelections, notes: existing.notes ?? "" });
            }
            return;
        }
        if (isOpen) {
            reset({ radioSelections: {}, checkboxSelections: {}, notes: "" });
        }
    }, [isOpen, editingCartItemId, editingCartItem, product, reset]);

    if (!product) return <></>;

    const buildCartAddOns = useCallback((values: AddOnFormValues) => {
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
    }, [product.add_ons]);

    const onSubmit = useCallback((values: AddOnFormValues) => {
        setSubmitError(null);
        const addOns = buildCartAddOns(values);
        if (editingCartItemId) removeItem(editingCartItemId);
        addItem({
            product_id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            notes: values.notes.trim() || null,
            add_ons: addOns,
        });
        closeModal();
    }, [addItem, buildCartAddOns, closeModal, editingCartItemId, product.id, product.name, product.price, removeItem]);

    const onInvalid = useCallback(() => {
        setSubmitError("Lengkapi pilihan add-on yang wajib diisi sebelum menambahkan produk.");
    }, []);

    const handleCancel = useCallback(() => {
        setSubmitError(null);
        closeModal();
    }, [closeModal]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) handleCancel();
        },
        [handleCancel]
    );

    return (
        <Dialog
            isOpen={isOpen}
            onOpenChange={handleOpenChange}
        >
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    isSwipeable={false}
                    className="w-full max-w-3xl self-center bg-background p-0 overflow-hidden"
                    style={{ maxHeight: dialogMaxHeight }}
                >
                    <View className="flex-row justify-between gap-4 bg-surface p-4">
                        <View>
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
                        contentContainerClassName="p-4 gap-6 bg-background"
                    >
                        {submitError && (
                            <View className="flex-row items-start gap-3 rounded-lg border border-danger bg-danger/10 px-3 py-3">
                                <Typography className="text-sm text-danger flex-1">{submitError}</Typography>
                            </View>
                        )}

                        {product.add_ons.map((group) => (
                            <View key={group.id} className="gap-2">
                                <View className="flex-row items-center justify-between gap-2">
                                    <Label isRequired={group.required}>
                                        <Label.Text>{group.name}</Label.Text>
                                    </Label>
                                    <Description>{constraintLabel(group)}</Description>
                                </View>
                                {!group.multiple ? (
                                    <AddOnRadioGroup control={control} group={group} />
                                ) : (
                                    <AddOnCheckboxGroup control={control} group={group} />
                                )}
                                <FieldError
                                    isInvalid={
                                        !!(errors.radioSelections?.[group.id] || errors.checkboxSelections?.[group.id])
                                    }
                                >
                                    {errors.radioSelections?.[group.id]?.message ??
                                        errors.checkboxSelections?.[group.id]?.message}
                                </FieldError>
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
                        <Button variant="outline" onPress={handleCancel}>
                            Batal
                        </Button>
                        <Button className="flex-1" onPress={handleSubmit(onSubmit, onInvalid)}>
                            {editingCartItemId ? "Simpan perubahan" : "Tambahkan ke keranjang"}
                        </Button>
                    </View>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog>
    );
}

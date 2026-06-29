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
  Text,
  TextArea,
} from 'heroui-native';
import type { JSX } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useMemo, useEffect } from 'react';
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
  }, [isOpen, editingCartItemId]);

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
          className="w-[90%] max-w-2xl"
          style={{ maxHeight: dialogMaxHeight }}
        >
          <Dialog.Close />

          <View className="mb-3 pr-8">
            <Dialog.Title>{product.name}</Dialog.Title>
            <Text className="text-sm text-muted-foreground">
              {formatRupiah(product.price)}
            </Text>
          </View>

          <Separator />

          <ScrollView
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: scrollMaxHeight }}
            contentContainerStyle={{ paddingVertical: 20, gap: 24 }}
          >
            {product.add_ons.map((group) => (
              <View key={group.id} className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {group.name}
                  {group.required && <Text className="text-danger"> *</Text>}
                </Text>

                {!group.multiple ? (
                  <Controller
                    control={control}
                    name={`radioSelections.${group.id}`}
                    render={({ field }) => (
                      <RadioGroup value={field.value ?? ''} onValueChange={field.onChange}>
                        {group.options.map((option) => (
                          <RadioGroup.Item key={option.id} value={option.id}>
                            {optionLabel(option)}
                          </RadioGroup.Item>
                        ))}
                      </RadioGroup>
                    )}
                  />
                ) : (
                  <Controller
                    control={control}
                    name={`checkboxSelections.${group.id}`}
                    render={({ field }) => {
                      const selected: string[] = field.value ?? [];
                      return (
                        <View className="gap-2">
                          {group.options.map((option) => {
                            const isSelected = selected.includes(option.id);
                            const maxReached = !isSelected && selected.length >= group.max;
                            return (
                              <View key={option.id} className="flex-row items-center gap-2">
                                <Checkbox
                                  isSelected={isSelected}
                                  isDisabled={maxReached}
                                  onSelectedChange={() => {
                                    const next = isSelected
                                      ? selected.filter((id) => id !== option.id)
                                      : [...selected, option.id];
                                    field.onChange(next);
                                  }}
                                />
                                <Text className="text-sm text-foreground">{optionLabel(option)}</Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    }}
                  />
                )}

                <Text className="text-xs text-muted-foreground">{constraintLabel(group)}</Text>
                {(errors.radioSelections?.[group.id] || errors.checkboxSelections?.[group.id]) && (
                  <Text className="text-xs text-danger">
                    {errors.radioSelections?.[group.id]?.message ??
                      errors.checkboxSelections?.[group.id]?.message}
                  </Text>
                )}
              </View>
            ))}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Catatan</Text>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <TextArea
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder=""
                    className="min-h-[80px]"
                  />
                )}
              />
            </View>
          </ScrollView>

          <Separator />

          <View className="flex-row gap-3 pt-4">
            <Button className="flex-1" onPress={handleSubmit(onSubmit)}>
              {editingCartItemId ? 'Simpan perubahan' : 'Tambahkan ke keranjang'}
            </Button>
            <Button variant="outline" onPress={closeModal}>
              Batal
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

import type { AddOnGroup, POSProduct } from "@/types/pos";
import type { AddOnFormValues } from "@/schemas/addon";

function selectedOptionIds(group: AddOnGroup, values: AddOnFormValues): Set<string> {
  const radioSelection = values.radioSelections?.[group.id];
  const ids = group.multiple
    ? (values.checkboxSelections?.[group.id] ?? [])
    : radioSelection
      ? [radioSelection]
      : [];
  return new Set(ids);
}

export function buildCartAddOns(product: POSProduct, values: AddOnFormValues) {
  return product.add_ons.flatMap((group) => {
    const selectedIds = selectedOptionIds(group, values);
    const options = group.options.filter((option) => selectedIds.has(option.id));
    return options.length > 0 ? [{ id: group.id, name: group.name, options }] : [];
  });
}

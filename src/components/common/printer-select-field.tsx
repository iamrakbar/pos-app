import { Separator, Select } from "heroui-native";
import React from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

type SelectOption = { value: string; label: string };

export default function PrinterSelectField<T extends FieldValues>({
  control,
  name,
  options,
  presentation,
  placeholder,
  listLabel,
  onChange,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  options: readonly SelectOption[];
  presentation: "dialog" | "popover" | "bottom-sheet";
  placeholder: string;
  listLabel: string;
  onChange?: (value: string) => void;
}): React.JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange: setValue } }) => (
        <Select
          presentation={presentation}
          value={options.find((option) => option.value === value)}
          onValueChange={(option) => {
            if (!option) return;
            setValue(option.value);
            onChange?.(option.value);
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder={placeholder} numberOfLines={1} />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content
              presentation={presentation}
              width={presentation === "popover" ? "trigger" : undefined}
            >
              <Select.ListLabel className="mb-2">{listLabel}</Select.ListLabel>
              {options.map((item, index) => (
                <React.Fragment key={item.value}>
                  <Select.Item value={item.value} label={item.label} />
                  {index < options.length - 1 ? <Separator /> : null}
                </React.Fragment>
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      )}
    />
  );
}

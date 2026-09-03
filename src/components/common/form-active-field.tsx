import { Switch, Typography } from "heroui-native";
import React from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Pressable, View } from "react-native";

export default function FormActiveField<T extends FieldValues>({
  control,
  name,
  label,
  description,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description: string;
}): React.JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: value }}
          onPress={() => onChange(!value)}
          className="flex-row items-center justify-between gap-4 py-1"
        >
          <View className="flex-1">
            <Typography type="body-sm" weight="semibold">
              {label}
            </Typography>
            <Typography type="body-xs" color="muted">
              {description}
            </Typography>
          </View>
          <Switch isSelected={value} onSelectedChange={onChange} />
        </Pressable>
      )}
    />
  );
}

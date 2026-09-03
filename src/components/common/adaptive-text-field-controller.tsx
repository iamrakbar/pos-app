import { AdaptiveFormKeyboardHandlers } from "@/components/common/adaptive-form-overlay";
import { Input, Label, TextField, Typography } from "heroui-native";
import React from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

export default function AdaptiveTextFieldController<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder: string;
  error?: string;
}): React.JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <TextField isRequired isInvalid={Boolean(error)}>
          <Label>{label}</Label>
          <AdaptiveFormKeyboardHandlers>
            {(keyboardHandlers) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                variant="secondary"
                {...keyboardHandlers}
              />
            )}
          </AdaptiveFormKeyboardHandlers>
          {error ? (
            <Typography type="body-xs" className="text-danger">
              {error}
            </Typography>
          ) : null}
        </TextField>
      )}
    />
  );
}

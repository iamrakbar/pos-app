import { Label } from "heroui-native";
import { NumberField, type NumberFieldInputProps, type NumberFieldProps } from "heroui-native-pro";
import type { ReactNode } from "react";

type StringNumberFieldProps = Omit<NumberFieldProps, "children" | "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  placeholder?: string;
  inputVariant?: NumberFieldInputProps["variant"];
  inputProps?: Omit<NumberFieldInputProps, "placeholder" | "variant">;
  children?: ReactNode;
};

export default function StringNumberField({
  value,
  onChange,
  label,
  placeholder,
  inputVariant,
  inputProps,
  formatOptions,
  locale,
  children,
  ...props
}: StringNumberFieldProps) {
  const numericValue = value.trim() === "" ? Number.NaN : Number(value);
  const resolvedLocale = locale ?? (formatOptions?.currency === "IDR" ? "id-ID" : undefined);

  return (
    <NumberField
      {...props}
      value={numericValue}
      onChange={(nextValue) => onChange(Number.isNaN(nextValue) ? "" : String(nextValue))}
      formatOptions={formatOptions ?? { maximumFractionDigits: 0 }}
      locale={resolvedLocale}
    >
      {label ? <Label>{label}</Label> : null}
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input placeholder={placeholder} variant={inputVariant} {...inputProps} />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {children}
    </NumberField>
  );
}

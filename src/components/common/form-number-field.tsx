import { IDR_NUMBER_FIELD_FORMAT_OPTIONS } from "@/utils/format";
import { InputGroup, Label, Typography } from "heroui-native";
import { NumberField, type NumberFieldInputProps, type NumberFieldProps } from "heroui-native-pro";
import React, { useState, type ReactNode } from "react";

const DEFAULT_NUMBER_FORMAT_OPTIONS = {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} satisfies Intl.NumberFormatOptions;
const RUPIAH_PREFIX = "Rp";
type NumberFieldBlurEvent = Parameters<NonNullable<NumberFieldInputProps["onBlur"]>>[0];
type LocalizedInputState = {
  formatKey: string;
  sourceValue: number;
  displayValue: string;
};
type LocalizedNumberInputOptions = {
  value: string;
  onChange: (value: string) => void;
  formatOptions: Intl.NumberFormatOptions;
  minValue?: number;
  maxValue?: number;
  inputProps?: Omit<NumberFieldInputProps, "placeholder" | "variant">;
};

const indonesianFormatterCache = new Map<string, Intl.NumberFormat>();

function getIndonesianFormatter(
  formatKey: string,
  formatOptions: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const cachedFormatter = indonesianFormatterCache.get(formatKey);
  if (cachedFormatter) return cachedFormatter;

  const formatter = new Intl.NumberFormat("id-ID", formatOptions);
  indonesianFormatterCache.set(formatKey, formatter);
  return formatter;
}

function parseIndonesianNumber(value: string, useGrouping: boolean): number {
  if (!value.trim()) return Number.NaN;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(useGrouping ? /\./g : /$^/g, "")
    .replace(",", ".");

  return Number(normalized);
}

function useLocalizedNumberInput({
  value,
  onChange,
  formatOptions,
  minValue,
  maxValue,
  inputProps,
}: LocalizedNumberInputOptions) {
  const numericValue = value.trim() === "" ? Number.NaN : Number(value);
  const formatKey = JSON.stringify(formatOptions);
  const formatter = getIndonesianFormatter(formatKey, formatOptions);
  const formatValue = (nextValue: number): string =>
    Number.isNaN(nextValue) ? "" : formatter.format(nextValue);
  const [localizedInputState, setLocalizedInputState] = useState<LocalizedInputState>(() => ({
    formatKey,
    sourceValue: numericValue,
    displayValue: formatValue(numericValue),
  }));
  const localizedDisplayValue =
    localizedInputState.formatKey === formatKey &&
    Object.is(localizedInputState.sourceValue, numericValue)
      ? localizedInputState.displayValue
      : formatValue(numericValue);
  const useGrouping = formatOptions.useGrouping === true;

  const clampValue = (nextValue: number): number =>
    Math.min(
      maxValue ?? Number.POSITIVE_INFINITY,
      Math.max(minValue ?? Number.NEGATIVE_INFINITY, nextValue)
    );

  const localizedInputProps = {
    value: localizedDisplayValue,
    onChangeText: (nextValue: string) => {
      setLocalizedInputState({
        formatKey,
        sourceValue: numericValue,
        displayValue: nextValue,
      });
      const parsedValue = parseIndonesianNumber(nextValue, useGrouping);
      if (Number.isFinite(parsedValue)) {
        onChange(String(clampValue(parsedValue)));
      } else if (!nextValue.trim()) {
        onChange("");
      }
      inputProps?.onChangeText?.(nextValue);
    },
    onBlur: (event: NumberFieldBlurEvent) => {
      const parsedValue = parseIndonesianNumber(localizedDisplayValue, useGrouping);
      if (Number.isFinite(parsedValue)) {
        const boundedValue = clampValue(parsedValue);
        onChange(String(boundedValue));
        setLocalizedInputState({
          formatKey,
          sourceValue: boundedValue,
          displayValue: formatValue(boundedValue),
        });
      } else {
        setLocalizedInputState({
          formatKey,
          sourceValue: numericValue,
          displayValue: formatValue(numericValue),
        });
      }
      inputProps?.onBlur?.(event);
    },
  };

  return { numericValue, localizedInputProps };
}

export type FormNumberFieldProps = Omit<NumberFieldProps, "children" | "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  placeholder?: string;
  inputVariant?: NumberFieldInputProps["variant"];
  inputProps?: Omit<NumberFieldInputProps, "placeholder" | "variant">;
  showStepper?: boolean;
  decreaseAccessibilityLabel?: string;
  increaseAccessibilityLabel?: string;
  children?: ReactNode;
};

export function FormNumberField({
  value,
  onChange,
  label,
  placeholder,
  inputVariant,
  inputProps,
  showStepper = false,
  decreaseAccessibilityLabel,
  increaseAccessibilityLabel,
  formatOptions,
  children,
  ...props
}: FormNumberFieldProps): React.JSX.Element {
  const resolvedFormatOptions = { ...DEFAULT_NUMBER_FORMAT_OPTIONS, ...formatOptions };
  const { numericValue, localizedInputProps } = useLocalizedNumberInput({
    value,
    onChange,
    formatOptions: resolvedFormatOptions,
    minValue: props.minValue,
    maxValue: props.maxValue,
    inputProps,
  });

  return (
    <NumberField
      {...props}
      value={numericValue}
      onChange={(nextValue) => onChange(Number.isNaN(nextValue) ? "" : String(nextValue))}
      formatOptions={resolvedFormatOptions}
    >
      {label ? <Label>{label}</Label> : null}
      <NumberField.Group className="relative">
        {showStepper ? (
          <NumberField.DecrementButton accessibilityLabel={decreaseAccessibilityLabel} />
        ) : null}
        <NumberField.Input
          placeholder={placeholder}
          variant={inputVariant}
          isAutoPaddingActive={showStepper}
          {...inputProps}
          {...localizedInputProps}
        />
        {showStepper ? (
          <NumberField.IncrementButton accessibilityLabel={increaseAccessibilityLabel} />
        ) : null}
      </NumberField.Group>
      {children}
    </NumberField>
  );
}

export type RupiahFieldProps = Omit<FormNumberFieldProps, "formatOptions" | "prefix">;

export function RupiahField({
  value,
  onChange,
  label,
  placeholder,
  inputVariant,
  inputProps,
  showStepper = false,
  decreaseAccessibilityLabel,
  increaseAccessibilityLabel,
  children,
  ...props
}: RupiahFieldProps): React.JSX.Element {
  const { numericValue, localizedInputProps } = useLocalizedNumberInput({
    value,
    onChange,
    formatOptions: IDR_NUMBER_FIELD_FORMAT_OPTIONS,
    minValue: props.minValue,
    maxValue: props.maxValue,
    inputProps,
  });

  return (
    <NumberField
      {...props}
      value={numericValue}
      onChange={(nextValue) => onChange(Number.isNaN(nextValue) ? "" : String(nextValue))}
      formatOptions={IDR_NUMBER_FIELD_FORMAT_OPTIONS}
    >
      {label ? <Label>{label}</Label> : null}
      <NumberField.Group className="relative">
        {showStepper ? (
          <NumberField.DecrementButton accessibilityLabel={decreaseAccessibilityLabel} />
        ) : null}
        <InputGroup className="relative w-full">
          <InputGroup.Prefix isDecorative>
            <Typography type="body-sm" weight="medium" color="muted">
              {RUPIAH_PREFIX}
            </Typography>
          </InputGroup.Prefix>
          <InputGroup.Input
            placeholder={placeholder}
            variant={inputVariant}
            keyboardType="numeric"
            {...inputProps}
            {...localizedInputProps}
          />
        </InputGroup>
        {showStepper ? (
          <NumberField.IncrementButton accessibilityLabel={increaseAccessibilityLabel} />
        ) : null}
      </NumberField.Group>
      {children}
    </NumberField>
  );
}

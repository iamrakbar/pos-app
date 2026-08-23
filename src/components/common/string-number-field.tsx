import { Label, Typography } from "heroui-native";
import { NumberField, type NumberFieldInputProps, type NumberFieldProps } from "heroui-native-pro";
import { useState, type ReactNode } from "react";
import { View } from "react-native";

type NumberFieldBlurEvent = Parameters<NonNullable<NumberFieldInputProps["onBlur"]>>[0];
type LocalizedInputState = {
  formatKey: string;
  sourceValue: number;
  displayValue: string;
};

const indonesianFormatterCache = new Map<string, Intl.NumberFormat>();

function getIndonesianFormatter(
  formatKey: string,
  formatOptions?: Intl.NumberFormatOptions
): Intl.NumberFormat | null {
  if (!formatKey) return null;
  const cachedFormatter = indonesianFormatterCache.get(formatKey);
  if (cachedFormatter) return cachedFormatter;

  const formatter = new Intl.NumberFormat("id-ID", {
    useGrouping: false,
    ...formatOptions,
  });
  indonesianFormatterCache.set(formatKey, formatter);
  return formatter;
}

function parseIndonesianNumber(value: string): number {
  if (!value.trim()) return Number.NaN;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  return Number(normalized);
}

function parsePlainNumber(value: string): number {
  if (!value.trim()) return Number.NaN;

  const normalized = value
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  return Number(normalized);
}

type StringNumberFieldProps = Omit<NumberFieldProps, "children" | "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  placeholder?: string;
  prefix?: ReactNode;
  inputVariant?: NumberFieldInputProps["variant"];
  inputProps?: Omit<NumberFieldInputProps, "placeholder" | "variant">;
  children?: ReactNode;
};

export default function StringNumberField({
  value,
  onChange,
  label,
  placeholder,
  prefix,
  inputVariant,
  inputProps,
  formatOptions,
  children,
  ...props
}: StringNumberFieldProps) {
  const numericValue = value.trim() === "" ? Number.NaN : Number(value);
  const formatKey = `${prefix ? String(prefix) : "plain"}:${JSON.stringify(formatOptions ?? {})}`;
  const indonesianFormatter = getIndonesianFormatter(formatKey, formatOptions);
  const formatIndonesianValue = (nextValue: number): string =>
    Number.isNaN(nextValue) ? "" : (indonesianFormatter?.format(nextValue) ?? String(nextValue));
  const [localizedInputState, setLocalizedInputState] = useState<LocalizedInputState>(() => ({
    formatKey,
    sourceValue: numericValue,
    displayValue: formatIndonesianValue(numericValue),
  }));
  const localizedDisplayValue =
    localizedInputState.formatKey === formatKey &&
    Object.is(localizedInputState.sourceValue, numericValue)
      ? localizedInputState.displayValue
      : formatIndonesianValue(numericValue);

  const localizedInputProps = {
    value: localizedDisplayValue,
    onChangeText: (nextValue: string) => {
      setLocalizedInputState({
        formatKey,
        sourceValue: numericValue,
        displayValue: nextValue,
      });
      const parsedValue = prefix ? parseIndonesianNumber(nextValue) : parsePlainNumber(nextValue);
      if (Number.isFinite(parsedValue)) {
        const boundedValue = Math.min(
          props.maxValue ?? Number.POSITIVE_INFINITY,
          Math.max(props.minValue ?? Number.NEGATIVE_INFINITY, parsedValue)
        );
        onChange(String(boundedValue));
      } else if (!nextValue.trim()) {
        onChange("");
      }
      inputProps?.onChangeText?.(nextValue);
    },
    onBlur: (event: NumberFieldBlurEvent) => {
      const parsedValue = prefix
        ? parseIndonesianNumber(localizedDisplayValue)
        : parsePlainNumber(localizedDisplayValue);
      if (Number.isFinite(parsedValue)) {
        const boundedValue = Math.min(
          props.maxValue ?? Number.POSITIVE_INFINITY,
          Math.max(props.minValue ?? Number.NEGATIVE_INFINITY, parsedValue)
        );
        onChange(String(boundedValue));
        setLocalizedInputState({
          formatKey,
          sourceValue: boundedValue,
          displayValue: formatIndonesianValue(boundedValue),
        });
      } else {
        setLocalizedInputState({
          formatKey,
          sourceValue: numericValue,
          displayValue: formatIndonesianValue(numericValue),
        });
      }
      inputProps?.onBlur?.(event);
    },
  };

  return (
    <NumberField
      {...props}
      value={numericValue}
      onChange={(nextValue) => onChange(Number.isNaN(nextValue) ? "" : String(nextValue))}
      formatOptions={formatOptions ?? { maximumFractionDigits: 0 }}
    >
      {label ? <Label>{label}</Label> : null}
      <NumberField.Group className="relative">
        {prefix ? (
          <View pointerEvents="none" className="absolute inset-y-0 left-3 z-10 justify-center">
            <Typography type="body-sm" weight="medium" color="muted">
              {prefix}
            </Typography>
          </View>
        ) : null}
        <NumberField.Input
          placeholder={placeholder}
          variant={inputVariant}
          isAutoPaddingActive={false}
          {...inputProps}
          {...localizedInputProps}
          className={
            [prefix ? "pl-12" : undefined, inputProps?.className].filter(Boolean).join(" ") ||
            undefined
          }
        />
      </NumberField.Group>
      {children}
    </NumberField>
  );
}

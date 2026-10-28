import { useState } from "react";
import type { TextInputProps } from "react-native";

type NumberFieldBlurEvent = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];
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
  inputProps?: Omit<TextInputProps, "placeholder">;
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

export function parseIndonesianNumber(value: string, useGrouping: boolean): number {
  if (!value.trim()) return Number.NaN;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(useGrouping ? /\./g : /$^/g, "")
    .replace(",", ".");

  return Number(normalized);
}

export function useLocalizedNumberInput({
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
      const parsedValue = parseIndonesianNumber(nextValue, useGrouping);
      const boundedValue = Number.isFinite(parsedValue) ? clampValue(parsedValue) : Number.NaN;
      setLocalizedInputState({
        formatKey,
        sourceValue: Number.isFinite(boundedValue)
          ? boundedValue
          : nextValue.trim()
            ? numericValue
            : Number.NaN,
        displayValue: nextValue,
      });
      if (Number.isFinite(boundedValue)) {
        onChange(String(boundedValue));
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

/** Keeps independent edit buffers for dynamic field-array rows, keyed by their stable IDs. */
export function useLocalizedNumberInputList(formatOptions: Intl.NumberFormatOptions) {
  const [states, setStates] = useState<Record<string, LocalizedInputState>>({});
  const formatKey = JSON.stringify(formatOptions);
  const formatter = getIndonesianFormatter(formatKey, formatOptions);

  return (id: string, value: string, onChange: (value: string) => void, onBlur?: () => void) => {
    const numericValue = value.trim() === "" ? Number.NaN : Number(value);
    const format = (number: number) => (Number.isNaN(number) ? "" : formatter.format(number));
    const state = states[id];
    const displayValue =
      state?.formatKey === formatKey && Object.is(state.sourceValue, numericValue)
        ? state.displayValue
        : format(numericValue);
    const save = (sourceValue: number, nextDisplayValue: string) =>
      setStates((previous) => ({
        ...previous,
        [id]: { formatKey, sourceValue, displayValue: nextDisplayValue },
      }));
    return {
      value: displayValue,
      onChangeText: (text: string) => {
        const parsed = parseIndonesianNumber(text, formatOptions.useGrouping === true);
        const bounded = Number.isFinite(parsed) ? Math.max(0, parsed) : Number.NaN;
        save(Number.isFinite(bounded) ? bounded : text.trim() ? numericValue : Number.NaN, text);
        if (Number.isFinite(bounded)) onChange(String(bounded));
        else if (!text.trim()) onChange("");
      },
      onBlur: () => {
        const parsed = parseIndonesianNumber(displayValue, formatOptions.useGrouping === true);
        if (Number.isFinite(parsed)) {
          const bounded = Math.max(0, parsed);
          onChange(String(bounded));
          save(bounded, format(bounded));
        } else save(numericValue, format(numericValue));
        onBlur?.();
      },
    };
  };
}

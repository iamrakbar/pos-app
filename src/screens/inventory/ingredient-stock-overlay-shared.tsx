import { isApiError } from "@/api/api-error";
import { Button, Typography } from "heroui-native";
import React from "react";
import { View } from "react-native";

export const QUANTITY_FORMAT_OPTIONS = {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
} satisfies Intl.NumberFormatOptions;

export type Ingredient = App.Data.Merchant.Inventory.IngredientData;

export function FieldMessage({ message }: { message?: string }): React.JSX.Element | null {
  return message ? (
    <Typography type="body-xs" className="text-danger">
      {message}
    </Typography>
  ) : null;
}

export function mapServerErrors<T extends string>(
  error: unknown,
  fields: readonly T[],
  setError: (field: T, error: { type: string; message: string }) => void
): boolean {
  if (!isApiError(error) || !error.errors) return false;

  let hasFieldError = false;
  for (const field of fields) {
    const message = error.errors[field]?.[0];
    if (!message) continue;
    setError(field, { type: "server", message });
    hasFieldError = true;
  }
  return hasFieldError;
}

export function OverlayFooter({
  isPending,
  submitLabel,
  pendingLabel,
  cancelLabel,
  onSubmit,
  onCancel,
}: {
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  return (
    <View className="gap-3 px-5 pb-safe pt-4 flex-row">
      <Button variant="ghost" onPress={onCancel} isDisabled={isPending}>
        <Button.Label>{cancelLabel}</Button.Label>
      </Button>
      <Button onPress={onSubmit} isDisabled={isPending} className="flex-1">
        <Button.Label>{isPending ? pendingLabel : submitLabel}</Button.Label>
      </Button>
    </View>
  );
}

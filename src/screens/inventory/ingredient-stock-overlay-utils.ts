import { isApiError } from "@/api/api-error";

export const QUANTITY_FORMAT_OPTIONS = {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
} satisfies Intl.NumberFormatOptions;

export type Ingredient = App.Data.Merchant.Inventory.IngredientData;

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

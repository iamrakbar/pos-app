import { isApiError } from "@/api/api-error";
import type { ProductFormValues } from "@/schemas/product";
import type { UseFormSetError } from "react-hook-form";

const PRODUCT_FORM_FIELDS = new Set<keyof ProductFormValues>([
  "category_id",
  "name",
  "description",
  "price",
  "code",
  "inventory_mode",
  "inventory_cost",
  "stock_alert",
  "active",
  "image",
]);

const PRODUCT_SERVER_FIELD_MAP: Record<string, keyof ProductFormValues> = {
  cost: "inventory_cost",
};

export function applyProductServerErrors(
  error: unknown,
  setError: UseFormSetError<ProductFormValues>
): boolean {
  if (!isApiError(error) || !error.errors) return false;
  let applied = false;

  for (const [field, messages] of Object.entries(error.errors)) {
    const formField = PRODUCT_SERVER_FIELD_MAP[field] ?? (field as keyof ProductFormValues);
    if (PRODUCT_FORM_FIELDS.has(formField) && messages[0]) {
      setError(formField, { type: "server", message: messages[0] });
      applied = true;
    }
  }

  return applied;
}

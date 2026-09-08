import type { ProductImageAsset } from "@/api/endpoints/products";
import { getErrorMessage } from "@/api/api-error";
import type { ProductFormPayload } from "@/hooks/db/use-products";
import type { Translate } from "@/locales";
import type { ProductFormValues } from "@/schemas/product";
import type { UseFormSetError } from "react-hook-form";

export function toProductPayload(values: ProductFormValues): ProductFormPayload {
  return {
    values: {
      name: values.name.trim(),
      code: values.code.trim() || null,
      category_id: values.category_id,
      description: values.description.trim() || null,
      price: Number(values.price),
      active: values.active,
      add_ons:
        values.add_ons.length > 0
          ? values.add_ons.map((addOn) => ({
              name: addOn.name.trim(),
              required: addOn.required,
              multiple: addOn.multiple,
              min: addOn.required && addOn.multiple ? Number(addOn.min) : addOn.required ? 1 : 0,
              max: addOn.multiple ? Number(addOn.max) : 1,
              options: addOn.options.map((option) => ({
                name: option.name.trim(),
                price: Number(option.price),
              })),
            }))
          : undefined,
    },
    image: values.image as ProductImageAsset | null,
  };
}

type ProductMutation = {
  mutateAsync: (payload: ProductFormPayload) => Promise<{ id: string }>;
};

type InventoryMutation = {
  mutateAsync: (variables: {
    productId: string;
    values: App.Requests.Merchant.Product.UpdateInventoryRequest;
  }) => Promise<unknown>;
};

type Toast = {
  show: (options: {
    variant: "success" | "warning" | "danger";
    label: string;
    description?: string;
  }) => void;
};

type Router = {
  back: () => void;
};

export async function saveProduct({
  catalogPayload,
  isNew,
  createMutation,
  updateMutation,
  updateInventoryMutation,
  inventoryValues,
  applyServerErrors,
  setError,
  toast,
  t,
  router,
  onProductCreated,
}: {
  catalogPayload: ProductFormPayload;
  isNew: boolean;
  createMutation: ProductMutation;
  updateMutation: ProductMutation;
  updateInventoryMutation: InventoryMutation;
  inventoryValues: App.Requests.Merchant.Product.UpdateInventoryRequest;
  applyServerErrors: (error: unknown) => boolean;
  setError: UseFormSetError<ProductFormValues>;
  toast: Toast;
  t: Translate;
  router: Router;
  onProductCreated?: (productId: string) => void;
}): Promise<void> {
  let savedProduct: { id: string } | undefined;

  try {
    savedProduct = await (isNew
      ? createMutation.mutateAsync(catalogPayload)
      : updateMutation.mutateAsync(catalogPayload));

    if (isNew && inventoryValues.inventory_mode === "recipe") {
      onProductCreated?.(savedProduct.id);
      toast.show({
        variant: "warning",
        label: t("productForm.createdRecipeSetupRequired"),
      });
      return;
    }

    await updateInventoryMutation.mutateAsync({
      productId: savedProduct.id,
      values: inventoryValues,
    });
    toast.show({
      variant: "success",
      label: isNew ? t("productForm.created") : t("productForm.updated"),
    });
    router.back();
  } catch (error: unknown) {
    const hasFieldErrors = applyServerErrors(error);
    const message = hasFieldErrors ? t("productForm.checkFields") : getErrorMessage(error);
    setError("root.server", { type: "server", message });
    toast.show({
      variant: "danger",
      label: savedProduct
        ? t("productForm.inventoryUpdateFailed")
        : isNew
          ? t("productForm.createFailed")
          : t("productForm.updateFailed"),
      description: message,
    });
    if (isNew && savedProduct) onProductCreated?.(savedProduct.id);
  }
}

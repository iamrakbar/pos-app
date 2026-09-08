import { test } from "bun:test";
import {
  createProductAdjustmentSchema,
  createProductOpeningBalanceSchema,
  toProductAdjustmentRequest,
  toProductOpeningBalanceRequest,
} from "../src/schemas/product-stock";
import {
  getProductInventoryCapabilities,
  toProductInventoryPayload,
} from "../src/schemas/product-inventory";
import { validateRecipeDraft } from "../src/schemas/product-recipe";
import { PRODUCT_INVENTORY_MODES } from "../src/types/product-inventory";
import type { Translate } from "../src/locales";
import { saveProduct, toProductPayload } from "../src/screens/products/form/product-form-save";
import { applyProductServerErrors } from "../src/screens/products/form/product-form-errors";
import type { ProductFormValues } from "../src/schemas/product";
import type { UseFormSetError } from "react-hook-form";
import { ApiError } from "../src/api/api-error";

const t: Translate = (key) => key;

const productValues: ProductFormValues = {
  category_id: "category-1",
  name: " Product name ",
  description: " Description ",
  price: "25000",
  code: " SKU-1 ",
  inventory_mode: "unlimited",
  inventory_cost: "",
  stock_alert: "",
  active: true,
  image: null,
  add_ons: [],
};

function assertEqual(actual: unknown, expected: unknown): void {
  if (actual !== expected) throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
}

function assertDeepEqual(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

test("product inventory modes expose the complete contract", () => {
  assertDeepEqual(PRODUCT_INVENTORY_MODES, ["unlimited", "manual", "recipe"]);
});

test("catalog payload excludes inventory balance fields", () => {
  const payload = toProductPayload(productValues);
  assertDeepEqual(payload.values, {
    name: "Product name",
    code: "SKU-1",
    category_id: "category-1",
    description: "Description",
    price: 25000,
    active: true,
    add_ons: undefined,
  });
});

test("inventory capabilities keep unsupported product relationships hidden", () => {
  assertDeepEqual(getProductInventoryCapabilities("unlimited", false), {
    showInventoryCost: false,
    showStockAlert: false,
    showCurrentStock: false,
    showOpeningBalance: false,
    showAdjustment: false,
    showMovements: false,
    showRecipe: false,
  });
  assertDeepEqual(getProductInventoryCapabilities("manual", false), {
    showInventoryCost: true,
    showStockAlert: true,
    showCurrentStock: true,
    showOpeningBalance: true,
    showAdjustment: true,
    showMovements: true,
    showRecipe: false,
  });
  assertDeepEqual(getProductInventoryCapabilities("recipe", false), {
    showInventoryCost: false,
    showStockAlert: false,
    showCurrentStock: true,
    showOpeningBalance: false,
    showAdjustment: false,
    showMovements: true,
    showRecipe: true,
  });
  assertEqual(getProductInventoryCapabilities("manual", true).showMovements, false);
});

test("inventory payload separates stock configuration from the catalog form", () => {
  assertDeepEqual(
    toProductInventoryPayload({
      inventory_mode: "manual",
      inventory_cost: "25000",
      stock_alert: "2",
    }),
    {
      inventory_mode: "manual",
      cost: 25000,
      stock_alert: 2,
    }
  );

  assertDeepEqual(
    toProductInventoryPayload({
      inventory_mode: "recipe",
      inventory_cost: "25000",
      stock_alert: "9",
    }),
    {
      inventory_mode: "recipe",
      cost: null,
      stock_alert: null,
    }
  );

  assertDeepEqual(
    toProductInventoryPayload({
      inventory_mode: "unlimited",
      inventory_cost: "25000",
      stock_alert: "2",
    }),
    {
      inventory_mode: "unlimited",
      cost: null,
      stock_alert: null,
    }
  );
});

test("product opening balance validates whole quantities and creates an idempotent request", () => {
  const schema = createProductOpeningBalanceSchema(t);
  assertEqual(schema.safeParse({ quantity: "10", cost_per_unit: "25000" }).success, true);
  assertEqual(schema.safeParse({ quantity: "1.5", cost_per_unit: "25000" }).success, false);
  assertDeepEqual(
    toProductOpeningBalanceRequest(
      { quantity: "10", cost_per_unit: "25000" },
      "opening-operation-id"
    ),
    {
      quantity: 10,
      cost_per_unit: 25000,
      operation_id: "opening-operation-id",
    }
  );
});

test("product adjustment requires a reason and uses the target balance contract", () => {
  const schema = createProductAdjustmentSchema(t);
  assertEqual(schema.safeParse({ target_balance: "8", reason: "Cycle count" }).success, true);
  assertEqual(schema.safeParse({ target_balance: "8", reason: "" }).success, false);
  assertDeepEqual(
    toProductAdjustmentRequest(
      { target_balance: "8", reason: "Cycle count" },
      "adjustment-operation-id"
    ),
    {
      target_balance: 8,
      reason: "Cycle count",
      operation_id: "adjustment-operation-id",
    }
  );
});

const ingredients = [
  {
    id: "ingredient-gram",
    base_unit: "gram",
  },
  {
    id: "ingredient-piece",
    base_unit: "piece",
  },
] as App.Data.Merchant.Inventory.IngredientData[];

test("recipe validation accepts compatible lines and rejects invalid drafts", () => {
  assertEqual(
    "error" in
      validateRecipeDraft(
        [{ id: "line-1", ingredient_id: "ingredient-gram", quantity: "18.5", unit: "gram" }],
        ingredients,
        t
      ),
    false
  );
  assertEqual("error" in validateRecipeDraft([], ingredients, t), true);
  assertEqual(
    "error" in
      validateRecipeDraft(
        [
          { id: "line-1", ingredient_id: "ingredient-gram", quantity: "1", unit: "gram" },
          { id: "line-2", ingredient_id: "ingredient-gram", quantity: "2", unit: "gram" },
        ],
        ingredients,
        t
      ),
    true
  );
  assertEqual(
    "error" in
      validateRecipeDraft(
        [{ id: "line-1", ingredient_id: "ingredient-gram", quantity: "0", unit: "gram" }],
        ingredients,
        t
      ),
    true
  );
  assertEqual(
    "error" in
      validateRecipeDraft(
        [{ id: "line-1", ingredient_id: "ingredient-piece", quantity: "1", unit: "gram" }],
        ingredients,
        t
      ),
    true
  );
});

function saveTestInput(
  overrides: Partial<Parameters<typeof saveProduct>[0]> = {}
): Parameters<typeof saveProduct>[0] {
  const errors: unknown[] = [];
  const toasts: unknown[] = [];
  const router = { back: () => undefined };
  const createMutation = { mutateAsync: async () => ({ id: "created-product" }) };
  const updateMutation = { mutateAsync: async () => ({ id: "existing-product" }) };
  const updateInventoryMutation = { mutateAsync: async () => undefined };

  return {
    catalogPayload: toProductPayload(productValues),
    isNew: true,
    createMutation,
    updateMutation,
    updateInventoryMutation,
    inventoryValues: { inventory_mode: "unlimited", cost: null, stock_alert: null },
    applyServerErrors: () => false,
    setError: ((field: keyof ProductFormValues, error: unknown) =>
      errors.push({ field, error })) as unknown as UseFormSetError<ProductFormValues>,
    toast: { show: (options: unknown) => toasts.push(options) },
    t,
    router,
    ...overrides,
  };
}

test("product save orchestrates unlimited, manual, and recipe creation modes", async () => {
  const inventoryCalls: unknown[] = [];
  const createdIds: string[] = [];
  let backCount = 0;
  const input = saveTestInput({
    updateInventoryMutation: {
      mutateAsync: async (variables: unknown) => inventoryCalls.push(variables),
    },
    router: { back: () => (backCount += 1) },
    onProductCreated: (productId) => createdIds.push(productId),
  });

  await saveProduct(input);
  assertEqual(inventoryCalls.length, 1);
  assertEqual(backCount, 1);

  inventoryCalls.length = 0;
  backCount = 0;
  await saveProduct({
    ...input,
    inventoryValues: { inventory_mode: "manual", cost: 25000, stock_alert: 2 },
  });
  assertEqual(inventoryCalls.length, 1);
  assertEqual(backCount, 1);

  inventoryCalls.length = 0;
  backCount = 0;
  await saveProduct({
    ...input,
    inventoryValues: { inventory_mode: "recipe", cost: null, stock_alert: null },
  });
  assertEqual(inventoryCalls.length, 0);
  assertEqual(backCount, 0);
  assertDeepEqual(createdIds, ["created-product"]);
});

test("existing product save uses update and preserves the draft after inventory failure", async () => {
  let updateCalls = 0;
  let inventoryCalls = 0;
  let createdProductId: string | undefined;
  const errors: unknown[] = [];
  const input = saveTestInput({
    isNew: false,
    updateMutation: { mutateAsync: async () => (updateCalls++, { id: "existing-product" }) },
    updateInventoryMutation: {
      mutateAsync: async () => {
        inventoryCalls += 1;
        throw new Error("mode change blocked by open order");
      },
    },
    setError: ((field: keyof ProductFormValues, error: unknown) =>
      errors.push({ field, error })) as unknown as UseFormSetError<ProductFormValues>,
    onProductCreated: (productId) => {
      createdProductId = productId;
    },
  });

  await saveProduct(input);
  assertEqual(updateCalls, 1);
  assertEqual(inventoryCalls, 1);
  assertEqual(createdProductId, undefined);
  assertEqual(errors.length, 1);
});

test("failed inventory configuration after creation retains the created product for retry", async () => {
  let createdProductId: string | undefined;
  let backCount = 0;
  const input = saveTestInput({
    updateInventoryMutation: {
      mutateAsync: async () => {
        throw new Error("inventory validation failed");
      },
    },
    router: { back: () => (backCount += 1) },
    onProductCreated: (productId) => {
      createdProductId = productId;
    },
  });

  await saveProduct(input);
  assertEqual(createdProductId, "created-product");
  assertEqual(backCount, 0);
});

test("server validation maps inventory fields without losing the form draft", () => {
  const errors: unknown[] = [];
  const setError = ((field: keyof ProductFormValues, error: unknown) => {
    errors.push({ field, error });
  }) as unknown as UseFormSetError<ProductFormValues>;
  const applied = applyProductServerErrors(
    new ApiError({
      status: 422,
      message: "Inventory validation failed",
      errors: {
        inventory_mode: ["Mode cannot be changed while an order is open."],
        cost: ["Cost is invalid."],
      },
    }),
    setError
  );

  assertEqual(applied, true);
  assertDeepEqual(errors, [
    {
      field: "inventory_mode",
      error: { type: "server", message: "Mode cannot be changed while an order is open." },
    },
    { field: "inventory_cost", error: { type: "server", message: "Cost is invalid." } },
  ]);
});

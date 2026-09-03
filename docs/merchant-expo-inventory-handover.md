# Expo Merchant Inventory Handover

## Purpose

This document hands over the Merchant Inventory API to the Expo merchant-app team. It describes the Phase 1 contract currently implemented by the Laravel backend.

Backend contract commits: `1cee7977` (inventory API contract) and `4d38f93e` (inventory feature in merchant responses).

Related files:

- [Merchant Postman collection](../docs/postman/Merchant%20API.postman_collection.json)
- [Generated request types](../src/types/merchant-requests.d.ts)
- [Generated Merchant data types](../src/types/merchant-generated.d.ts)

## API connection and access

Use the API root configured for the environment, then append `/v0/merchant`:

~~~text
{API_ROOT}/v0/merchant
~~~

For a local installation, `API_ROOT` commonly includes `/api`:

~~~text
https://example.test/api/v0/merchant
~~~

Send the JWT returned by Login as a Bearer token on protected requests.

Every inventory endpoint is scoped by the selected merchant ID:

~~~text
{API_ROOT}/v0/merchant/{merchant_id}/...
~~~

The authenticated user must belong to that merchant. Cross-merchant inventory records return `404` and must not be exposed in the UI.

### Feature gating

The Login, Me, and merchant profile responses expose the feature list. When inventory is enabled, the selected merchant contains:

~~~json
{
  "features": ["inventory"]
}
~~~

Hide or disable the Inventory navigation when `inventory` is absent. The API also enforces the gate and returns:

~~~json
{
  "success": false,
  "message": "This feature is not available for this merchant.",
  "error_code": "FEATURE_NOT_AVAILABLE"
}
~~~

Do not infer inventory availability from product `stock` or `stock_enabled`. `stock_enabled` is a legacy compatibility field; the inventory API uses `inventory_mode`.

## UI/UX recommendations

The Filament merchant screens are a useful reference for the Expo implementation, but the mobile app should make the workflow more explicit. Inventory has three different concerns: configuration, stock-changing actions, and read-only audit history. Keep these concerns separate so users do not mistake a calculated balance or ledger row for an editable field.

### Drawer menu grouping

Show one Inventory group only when `merchants[].features` contains `inventory`. Suggested grouping:

- **Overview** — low-stock alerts, recipe availability, costs, losses, and failed operations.
- **Manage** — Ingredients and Suppliers.
- **Products** — keep product catalog navigation where it is; expose inventory configuration and Recipe from the product detail screen instead of adding a duplicate product entry.
- **Monitor** — Movements and Operations.

Recommendations:

- Use text labels in the expanded drawer or on first visit; an icon-only drawer is difficult to discover on mobile.
- Keep setup/master data (ingredients, suppliers) separate from monitoring (movements, operations).
- Show a count badge for failed operations and, where supported by the overview response, low-stock alerts.
- Hide the whole group when inventory is unavailable instead of showing several dead-end screens. Still handle `FEATURE_NOT_AVAILABLE` if the feature changes while the app is open.
- Keep terminology consistent with the API and product language. Do not expose legacy `stock_enabled` as a new inventory feature.

### Inventory mode switch on the product form

Use a three-option radio-card or segmented control rather than a generic select. Each option should include a short explanation:

| Mode | User-facing meaning | Expo fields/actions |
|---|---|---|
| `unlimited` | The product does not reserve or deduct tracked stock. | No stock quantity, opening balance, adjustment, or recipe editor. |
| `manual` | The product has a sellable-unit balance maintained by stock actions. | Stock alert plus separate opening-balance and adjustment actions. Quantities are whole numbers. |
| `recipe` | Product sales consume ingredient stock according to a recipe. | Recipe editor and estimated unit COGS; product opening balance is not available. |

The default is `unlimited`, but show that choice explicitly as “No stock tracking” so the user understands what will happen. Do not place an editable `stock` or `opening balance` input beside the mode selector. Configuration should update `inventory_mode`, `cost`, and `stock_alert`; balances must use their dedicated operation endpoints.

Mode-change behavior:

- Before saving, show a confirmation summary of what the selected mode enables and disables.
- A mode change is rejected while the product has an active/open order. Disable the control when that state is known, show the reason next to it, and map the server `422` validation error to the mode field if the state changed between loading and saving.
- Selecting `recipe` should guide the user to add at least one valid recipe line before activation. A practical flow is: add/save the recipe, then save the mode; if the API returns a validation error, keep the draft and show it inline.
- Switching away from `recipe` does not delete stored recipe lines. Tell the user that the recipe is retained but inactive until recipe mode is enabled again.
- Do not expose `stock_enabled` in the new Expo form. It exists only for legacy compatibility, and the API does not accept it in product inventory updates.
- Keep save pending state, prevent duplicate submits, and refetch the product inventory, recipe, overview, and relevant history after success. Do not optimistically calculate balances on the client.

### Relationship-manager UX

Treat relationship managers as contextual sections or tabs on detail screens. Render them from the current mode and feature state rather than showing empty or unsupported managers.

Product detail:

- Always show product configuration and Add-ons where applicable.
- Show **Movement history** for `manual` and `recipe` products. A legacy `unlimited` product with `stock_enabled=true` may also have history; show it read-only when returned by the API.
- Show **Recipe** only for `recipe` products. Do not show a recipe editor for unlimited or manual products.
- A plain unlimited product should not show an empty movement or recipe section.

Ingredient detail:

- Use separate tabs or sections for **Supplier offers** and **Movement history**, matching the Filament reference layout.
- Keep supplier selection out of the base ingredient form. Create the ingredient first, then add one or more supplier offers from its detail screen; an ingredient can have multiple suppliers and pack/pricing options.
- Supplier offers are editable relationships; allow create/edit/deactivate according to the API rules. A preferred offer and supplier name should be visible in the ingredient summary.
- Movement history is an append-only audit ledger. Do not render edit or delete affordances for movement rows. Stock changes belong to opening balance, adjustment, purchase, return, waste, or damage actions.

Table and empty-state recommendations:

- Movement rows should show type, signed quantity, balance after, cost at the time, reason, actor, and timestamp. Add date/type filters and a detail view for the linked operation where useful.
- Recipe rows should show ingredient, quantity, unit, and cost contribution. Prevent duplicate ingredients, validate unit compatibility, and save the complete recipe atomically.
- Use action labels that describe the mutation (“Adjust stock”, “Record purchase”, “Add ingredient”) rather than a generic “Edit”.
- Provide mode-specific empty states with one clear CTA: “Add ingredient” for an empty recipe and “Record opening balance” or “Adjust stock” for a tracked product with no movements.
- When a relation is unavailable because of mode, remove the tab/section instead of disabling an action inside an otherwise empty manager. The server remains the source of truth for authorization and mode validation.

## Contract conventions

- Successful responses use `{ success: true, message?, data }`.
- Paginated responses use `{ success: true, data: [], meta: {...}, links?: {...} }`.
- Errors use `{ success: false, message, error_code, errors? }`.
- Currency values are integer IDR values. Do not send or display them as decimal rupiah amounts.
- Inventory quantities can use up to six decimal places. Format only at the display boundary and avoid client-side floating-point balance calculations.
- Timestamps are ISO 8601 strings.
- UUIDs are strings. Supplier-offer IDs are integers.
- Every stock-changing request requires a client-generated UUID `operation_id`.
- Repeating the same operation with the same payload is idempotent. Reusing the ID for a different payload returns `409 IDEMPOTENCY_CONFLICT`.
- The movement ledger is append-only. There are no update or delete endpoints for movements.

## Endpoint matrix

All paths below are relative to `{API_ROOT}/v0/merchant`.

### Capability, overview, and audit

| Method | Path | Use |
|---|---|---|
| `GET` | `/{merchant_id}/inventory/status` | Supported modes, units, and legacy compatibility. |
| `GET` | `/{merchant_id}/inventory/overview` | Alerts, COGS, losses, gross profit, and failed operations. |
| `GET` | `/{merchant_id}/inventory/movements` | Paginated append-only movement ledger. |
| `GET` | `/{merchant_id}/inventory/operations` | Paginated operation history without movement details. |
| `GET` | `/{merchant_id}/inventory/operations/{operation_id}` | One operation with its movements. |
| `POST` | `/{merchant_id}/inventory/operations/{operation_id}/retry` | Retry a failed order deduction only. |

Movement filters:

~~~text
filter[ingredient_id]={uuid}
filter[product_id]={uuid}
filter[type]={opening|purchase|sale|reversal|adjustment|waste|damage|return}
filter[source]={string}
filter[date_from]=YYYY-MM-DD
filter[date_to]=YYYY-MM-DD
sort=moved_at|-moved_at
page={number}&per_page={1..50}
~~~

Operation filters:

~~~text
filter[source]={string}
filter[status]={processing|posted|reversed|failed}
filter[date_from]=YYYY-MM-DD
filter[date_to]=YYYY-MM-DD
sort=created_at|-created_at
page={number}&per_page={1..50}
~~~

### Ingredients

| Method | Path | Use |
|---|---|---|
| `GET` | `/{merchant_id}/ingredients` | List ingredients. |
| `POST` | `/{merchant_id}/ingredients` | Create an ingredient and optionally create its opening operation. |
| `GET` | `/{merchant_id}/ingredients/{ingredient_id}` | Get ingredient details. |
| `PUT` | `/{merchant_id}/ingredients/{ingredient_id}` | Update details, cost, reorder point, or active status. |
| `DELETE` | `/{merchant_id}/ingredients/{ingredient_id}` | Soft-delete an ingredient. |
| `POST` | `/{merchant_id}/ingredients/{ingredient_id}/opening-balance` | Record the first ingredient balance. |
| `POST` | `/{merchant_id}/ingredients/{ingredient_id}/adjustments` | Set a target balance with a reason. |
| `POST` | `/{merchant_id}/ingredients/{ingredient_id}/movements` | Record purchase, return, waste, or damage. |

Ingredient list filters:

~~~text
filter[active]={0|1}
filter[base_unit]={gram|kilogram|milliliter|liter|piece|serving}
filter[low_stock]={0|1}
filter[search]={text}
sort=name|-name|current_stock|-current_stock|reorder_point|-reorder_point|created_at|-created_at
page={number}&per_page={1..50}
~~~

Create ingredient:

~~~json
{
  "name": "Coffee beans",
  "base_unit": "gram",
  "reorder_point": 500,
  "cost_per_unit": 2,
  "initial_quantity": 1000.5,
  "operation_id": "uuid"
}
~~~

`initial_quantity`, `cost_per_unit`, and `operation_id` are optional individually, but when `initial_quantity > 0`, both cost and operation ID are required. The ingredient starts at zero and the opening operation creates the balance.

Ingredient opening balance:

~~~json
{
  "quantity": 1000.5,
  "cost_per_unit": 2,
  "operation_id": "uuid"
}
~~~

Only one opening balance is allowed per ingredient. `quantity` must be positive. `cost_per_unit` is optional and falls back to the ingredient cost when omitted.

Ingredient adjustment:

~~~json
{
  "target_balance": 850.25,
  "reason": "Cycle count correction",
  "operation_id": "uuid"
}
~~~

Manual movement:

~~~json
{
  "type": "purchase",
  "quantity": 1000.5,
  "reason": "Supplier delivery",
  "cost_per_unit": 2,
  "supplier_offer_id": 123,
  "operation_id": "uuid"
}
~~~

Allowed manual movement types are `purchase`, `return`, `waste`, and `damage`. Send a positive input quantity; the backend makes waste and damage negative ledger movements. A supplier offer can only be attached to purchase or return movements and must belong to the same merchant and ingredient.

Do not send `current_stock` or `initial_quantity` to the normal ingredient update endpoint. Balance changes must use the stock endpoints above.

### Suppliers and supplier offers

| Method | Path | Use |
|---|---|---|
| `GET` | `/{merchant_id}/suppliers` | Paginated supplier list. |
| `POST` | `/{merchant_id}/suppliers` | Create a supplier. |
| `GET` | `/{merchant_id}/suppliers/{supplier_id}` | Get supplier details. |
| `PUT` | `/{merchant_id}/suppliers/{supplier_id}` | Update supplier details. |
| `DELETE` | `/{merchant_id}/suppliers/{supplier_id}` | Soft-delete a supplier. |
| `GET` | `/{merchant_id}/ingredients/{ingredient_id}/supplier-offers` | List offers for an ingredient. |
| `POST` | `/{merchant_id}/ingredients/{ingredient_id}/supplier-offers` | Create an offer. |
| `PUT` | `/{merchant_id}/ingredients/{ingredient_id}/supplier-offers/{offer_id}` | Update an offer. |
| `DELETE` | `/{merchant_id}/ingredients/{ingredient_id}/supplier-offers/{offer_id}` | Delete an offer when it has no movement history. |

Supplier body:

~~~json
{
  "name": "Coffee Supplier",
  "contact_name": "Ayu",
  "email": "ayu@supplier.test",
  "phone": "08123456789",
  "lead_time_days": 2,
  "payment_terms": "COD",
  "active": true
}
~~~

Offer body:

~~~json
{
  "supplier_id": "uuid",
  "supplier_sku": "COFFEE-1KG",
  "purchase_unit": "bag",
  "pack_quantity": 1000,
  "minimum_order_quantity": 1,
  "last_purchase_price": 250000,
  "lead_time_days": 2,
  "is_preferred": true,
  "active": true
}
~~~

Supplier and ingredient must belong to the same merchant. Only one active preferred offer is allowed per ingredient. If an offer has inventory movement history, deletion returns `409 INVENTORY_HISTORY_EXISTS`; deactivate it instead.

### Product inventory and recipes

| Method | Path | Use |
|---|---|---|
| `GET` | `/{merchant_id}/products/{product_id}/inventory` | Product inventory configuration and calculated COGS. |
| `PUT` | `/{merchant_id}/products/{product_id}/inventory` | Update mode, product cost, or stock alert. |
| `GET` | `/{merchant_id}/products/{product_id}/recipe` | Get recipe lines and estimated unit COGS. |
| `PUT` | `/{merchant_id}/products/{product_id}/recipe` | Atomically replace the complete recipe. |
| `POST` | `/{merchant_id}/products/{product_id}/opening-balance` | Record product opening stock. |
| `POST` | `/{merchant_id}/products/{product_id}/adjustments` | Adjust a manual product target balance. |

Product inventory update:

~~~json
{
  "inventory_mode": "manual",
  "cost": 25000,
  "stock_alert": 2
}
~~~

Modes are `unlimited`, `manual`, and `recipe`. Do not send `stock`, `stock_enabled`, `current_stock`, `quantity`, or `target_balance` to this endpoint. Balance changes use the opening-balance and adjustment endpoints.

Mode changes are rejected while the product has an active/open order. Activating `recipe` requires at least one valid recipe line. Existing recipe lines remain stored when switching away from recipe mode.

Recipe replacement:

~~~json
{
  "ingredients": [
    {
      "ingredient_id": "uuid",
      "quantity": 18.5,
      "unit": "gram"
    }
  ]
}
~~~

Recipe rules:

- Ingredient IDs must be unique within the recipe.
- Ingredients must belong to the selected merchant.
- Quantity must be greater than zero.
- `unit` must be compatible with the ingredient `base_unit`.
- Replacement is atomic; invalid lines do not partially update the recipe.

Product opening balance and adjustment quantities must be whole numbers because products represent sellable units:

~~~json
{
  "quantity": 10,
  "operation_id": "uuid"
}
~~~

~~~json
{
  "target_balance": 8,
  "reason": "Cycle count correction",
  "operation_id": "uuid"
}
~~~

Product opening balances require `inventory_mode=manual`, and only one opening balance is allowed per product.

## Response shapes

The complete generated response declarations are in [merchant-generated.d.ts](../src/types/merchant-generated.d.ts). These are the practical Expo-facing shapes:

~~~ts
type ProductInventory = {
  id: string;
  inventory_mode: 'unlimited' | 'manual' | 'recipe';
  cost: number | null;
  stock: number;
  stock_alert: number | null;
  has_recipe: boolean;
  estimated_unit_cogs: number;
};

type Ingredient = {
  id: string;
  merchant_id: string;
  name: string;
  base_unit: 'gram' | 'kilogram' | 'milliliter' | 'liter' | 'piece' | 'serving';
  current_stock: number;
  reorder_point: number;
  cost_per_unit: number | null;
  active: boolean;
  preferred_supplier: {
    id: string;
    name: string;
    offer_id: number;
  } | null;
  supplier_offer_count: number;
  created_at: string;
  updated_at: string;
};

type Supplier = {
  id: string;
  merchant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  lead_time_days: number | null;
  payment_terms: string | null;
  active: boolean;
  active_offer_count: number;
  created_at: string;
  updated_at: string;
};

type SupplierOffer = {
  id: number;
  supplier_id: string;
  supplier_name: string | null;
  ingredient_id: string;
  supplier_sku: string | null;
  purchase_unit: string;
  pack_quantity: number;
  minimum_order_quantity: number | null;
  last_purchase_price: number | null;
  lead_time_days: number | null;
  is_preferred: boolean;
  active: boolean;
};
~~~

~~~ts
type Recipe = {
  product_id: string;
  inventory_mode: 'unlimited' | 'manual' | 'recipe';
  has_recipe: boolean;
  estimated_unit_cogs: number;
  ingredients: Array<{
    ingredient_id: string;
    name: string;
    base_unit: string;
    quantity: number;
    unit: string;
    cost_per_unit: number | null;
    cost_contribution: number | null;
  }>;
};

type InventoryMovement = {
  id: string;
  ingredient_id: string | null;
  product_id: string | null;
  order_id: string | null;
  operation_id: string | null;
  supplier_ingredient_id: number | null;
  supplier_offer_id: number | null;
  type: 'opening' | 'purchase' | 'sale' | 'reversal' | 'adjustment' | 'waste' | 'damage' | 'return';
  source: string;
  source_id: string | null;
  quantity: number;
  balance_after: number;
  cost_per_unit: number | null;
  total_cost: number | null;
  reason: string | null;
  moved_at: string;
  ingredient: { id: string; name: string; base_unit: string } | null;
  product: { id: string; name: string } | null;
  order: { id: string; code: string; status: string } | null;
  supplier_offer: { id: number; supplier_id: string; supplier_name: string | null; supplier_sku: string | null } | null;
  actor: { id: string; name: string } | null;
  created_by: string | null;
  operation: { id: string; status: string; source: string } | null;
};

type InventoryOperation = {
  id: string;
  source: string;
  source_id: string | null;
  status: 'processing' | 'posted' | 'reversed' | 'failed';
  movement_count: number;
  attempts: number;
  actor: { id: string; name: string } | null;
  failure_reason: string | null;
  created_at: string;
  processed_at: string | null;
  failed_at: string | null;
  movements: InventoryMovement[] | null;
};

type InventoryOverview = {
  low_stock_ingredient_count: number;
  low_stock_manual_product_count: number;
  unavailable_recipe_count: number;
  lowest_recipe_capacity: number;
  recognized_cogs: number;
  inventory_losses: number;
  gross_profit: number;
  failed_operation_count: number;
};
~~~

The API returns enum values as strings in inventory responses. The generated backend data declaration currently represents some enum fields as `any`; the explicit unions above are the intended Expo-facing contract.

## Recommended Expo data flow

Use the selected merchant ID as part of every query key. A practical query layout is:

~~~text
inventory-status:{merchantId}
inventory-overview:{merchantId}
ingredients:{merchantId}:{filters}:{page}
ingredient:{merchantId}:{ingredientId}
ingredient-offers:{merchantId}:{ingredientId}
suppliers:{merchantId}:{filters}:{page}
product-inventory:{merchantId}:{productId}
product-recipe:{merchantId}:{productId}
inventory-movements:{merchantId}:{filters}:{page}
inventory-operations:{merchantId}:{filters}:{page}
inventory-operation:{merchantId}:{operationId}
~~~

After a successful stock mutation, invalidate or refetch:

- the affected ingredient or product;
- inventory overview;
- movement history;
- the returned operation detail/history.

Do not optimistically modify balances. The backend calculates `balance_after`, costs, recipe deductions, and reversals transactionally. Render the returned operation and refetch the affected queries instead.

For retries, keep the original operation ID and call the retry endpoint only when the operation is `failed` and its source is an order. Treat `INVENTORY_RETRY_NOT_ALLOWED` as a terminal UI error.

## Suggested screens and actions

1. **Inventory overview** — alert counts, recipe availability, COGS/losses/profit, and failed operations.
2. **Ingredients** — paginated list with search, active/unit/low-stock filters, create/edit, opening balance, adjustment, and movement entry.
3. **Ingredient detail** — current balance, cost, reorder point, movement history, supplier offers, and preferred offer.
4. **Suppliers** — paginated CRUD list and active-offer count.
5. **Product inventory** — mode, cost, stock alert, recipe availability, and estimated COGS.
6. **Recipe editor** — replace the complete recipe in one submit; validate duplicate ingredients and compatible units client-side for better UX, while retaining backend validation.
7. **Inventory operations** — operation status, attempts, error reason, movement count, details, and retry for eligible failed order deductions.

## Error handling

| HTTP | `error_code` | Expo behavior |
|---:|---|---|
| `401` | `UNAUTHENTICATED` or auth-specific code | Refresh/logout according to the existing auth flow. |
| `403` | `FEATURE_NOT_AVAILABLE` | Hide inventory or show that it is unavailable for this merchant. |
| `403` | authorization response | Do not retry with another inventory ID. |
| `404` | not found / tenant mismatch | Clear stale resource state and return to the parent list. |
| `409` | `INSUFFICIENT_STOCK` | Show the current stock conflict and refetch the resource. |
| `409` | `IDEMPOTENCY_CONFLICT` | Generate a new operation ID only after confirming whether the original request succeeded. |
| `409` | `INVENTORY_HISTORY_EXISTS` | Offer deactivation instead of deletion. |
| `409` | `INVENTORY_RETRY_NOT_ALLOWED` | Remove or disable the retry action. |
| `422` | `VALIDATION_ERROR` | Map `errors[field]` to the form; preserve server message for general errors. |

Do not decide success from HTTP status alone; check `success` and parse `error_code`.

## Delivery checklist

- [ ] Add inventory feature navigation gated by `merchants[].features`.
- [ ] Group the drawer into Overview, Manage, Products, and Monitor; use discoverable labels and hide the group when the feature is unavailable.
- [ ] Add shared API client methods with merchant-scoped paths and bearer auth.
- [ ] Add typed request/response models based on this document.
- [ ] Add overview, ingredient, supplier, product inventory, recipe, movement, and operation screens.
- [ ] Build mode-aware product inventory UX: explicit unlimited/manual/recipe choices, open-order lock handling, recipe activation guidance, and separate stock actions.
- [ ] Build contextual relationship sections: supplier offers and movements for ingredients; movements and recipe only when supported for products.
- [ ] Implement pagination and filter state in query parameters exactly as documented.
- [ ] Generate UUID `operation_id` values for every stock-changing submit.
- [ ] Prevent duplicate submits while a mutation is pending.
- [ ] Invalidate affected queries after every successful stock mutation.
- [ ] Add UI for validation, feature-disabled, insufficient-stock, idempotency, history, and retry conflicts.
- [ ] Verify the flow against the Merchant Postman collection before integration testing.
- [ ] Finalize and verify TypeScript request/response types against the generated declarations and confirm enum unions are not widened to `any`.
- [ ] Update the Merchant Postman collection with the final inventory requests, example bodies, filters, and expected error cases.

## Backend verification references

The backend contract was verified with:

- `php artisan route:list --path=api/v0/merchant`
- Merchant OpenAPI export via `npm run api:merchant`
- `npm run types:merchant`
- `npm run types:verify-isolation`
- Merchant inventory Pest suites and surrounding Product, Cart, Checkout, Order, POS, and Filament tests

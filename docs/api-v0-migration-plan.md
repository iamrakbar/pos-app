# Migration Plan: Merchant API v0

## Context

The backend has moved to a new, much larger "Merchant API" (`docs/postman/Merchant API.postman_collection.json` + matching environment file), replacing the narrow "SoEat - Merchant Cart and Checkout" collection the initial integration (`docs/api-integration-plan.md`) was built against. `src/types/merchant-generated.d.ts` has already been regenerated against the new backend (see `git diff`); `src/types/merchant-requests.d.ts` is unchanged — the request shapes we already coded against (checkout, cart validate, order status, guests, categories, add-ons) were already correct, only wider than what the old collection exposed.

This plan updates the app to the new API version and — because several previously-documented limitations are now resolved by real endpoints — removes workarounds that are no longer necessary. It does **not** propose building out the large new admin surface (Reviews, Galleries, Staff, Subscription, Finance, Discounts, Coupons, Delivery, Analytics, Dashboard, Notifications) — those are listed at the bottom as available-but-out-of-scope.

## What actually changed

**Base URL & routing**: `base_url` is now the bare domain root (env default `http://localhost:8000`); every request path is `/api/v0/merchant/...`. Previously `API_BASE_URL` already included the `/merchant` segment. `src/api/config.ts` needs `API_BASE_URL = <root>/api/v0/merchant` and `API_ROOT_URL = <root>` (no more regex-stripping a `/merchant` suffix).

**Uniform response envelope**: every endpoint in the new collection asserts `{ success: true, data: ..., meta?, links? }` — including single-resource endpoints that previously appeared unwrapped (login, order detail, payment-status). Confirmed via the collection's own `pm.test` assertions (no example bodies are saved anywhere in this collection — assertions are the source of truth). `src/api/client.ts`/`ApiError` normalization and each endpoint's response type need a `success: boolean` field added; nothing else about the envelope shape changes for the endpoints we already integrated.

**Real refresh & logout now exist** (this reverses a decision from the first integration):
- `POST /api/v0/merchant/refresh` — no request body; authenticates via `Authorization: Bearer <current access_token>` (per the collection's pre-request headers), returns a new `access_token`. The environment also has a `refresh_token` variable populated from login, but no request in the collection ever sends it — treat it as store-and-ignore for now (capture if present on `AuthTokenData`, don't build logic around it since nothing consumes it).
- `POST /api/v0/merchant/logout` — real server-side logout.
- `GET /api/v0/merchant/me` — fetch current user (usable for session restore / auth guard revalidation instead of just trusting a stored token).
- `PUT /api/v0/merchant/me` — update profile (`UpdateProfileRequest`, already typed).

**Real order status update now exists**: `PATCH /api/v0/merchant/orders/:orderId/status`, body `{status, reason}` using the already-typed `UpdateOrderStatusRequest` enum (`"new" | "process" | "completed" | "rejected"`). This directly resolves the gap from the first integration where Order Detail's status buttons were removed for lack of a backing endpoint.

**Real POS-specific product & table endpoints now exist** — these resolve the two biggest limitations flagged in the first integration:
- `GET /api/v0/merchant/:merchantId/pos/products?filter[category_id]&filter[search]&sort=name` → flat unpaginated array. Confirmed shape (via the collection's assertions): each item has `add_ons: []` (populated!), `discount`, `is_po`, `po_availability`, `stock: { enabled, qty }` (structured, not a flat number), `image: { default, thumbnail }` (structured, not flat URL strings). This is `App.Data.Merchant.Pos.ProductData` in the regenerated types — note Scramble still couldn't resolve `stock`/`image`/`discount`/`category` to concrete shapes (typed `Array<any>`), so the concrete field names above come from the Postman test assertions, not the `.d.ts` file; treat them as confirmed-but-manually-documented, same tier of trust as the `.d.ts` for typed fields.
- `GET /api/v0/merchant/:merchantId/pos/tables` → flat unpaginated array of `App.Data.Merchant.Pos.PosTableData` (`id, name, area_id, area_name, pax`) — exactly the shape our local `POSTable` type already uses.

**Real category & product & add-on management now exists** (full CRUD): `/categories` (+ `/reorder`), `/products` (+ image upload/delete), `/products/:id/add-ons` (+ get/update/delete). Request shapes match `StoreCategoryRequest`/`UpdateCategoryRequest`/`StoreProductRequest`/`UpdateProductRequest`/`StoreAddOnRequest`/`UpdateAddOnRequest`, all already present in `merchant-requests.d.ts` unchanged. This means the Products management screens we disabled in the first integration (no CRUD endpoint existed) can now actually be wired up — proposed as a **follow-up**, not part of this migration (see Out of scope).

**Orders list query params changed** from flat `status=&per_page=` to Laravel bracket-filter convention: `filter[order_status]`, `filter[payment_status]`, `filter[merchant_id]`, `filter[search]`, `filter[date_from]`, `filter[date_to]`, `sort=-created_at`, `per_page`. The response envelope is confirmed paginated (`{success, data: [...], meta, links}`), matching what we already built `useOrders` to tolerate — only the query-building needs to change.

**Gap — no payment-methods listing endpoint** in the new collection at all (no `/payments`, no `customer_id`-adjacent equivalent, and no `payment_id` environment variable — the Checkout example body hardcodes a literal `"payment-uuid"` placeholder). The old integration's `GET /customer/payments` call (a different, non-`/api/v0/merchant`-prefixed path) isn't part of this collection either way. **This blocks populating the payment method picker in Checkout** and needs a decision before implementation — see Open Questions.

## File-by-file changes

**`src/api/config.ts`** — `API_BASE_URL` becomes `${root}/api/v0/merchant`; `API_ROOT_URL` becomes the bare root (no stripping needed, since `base_url` env var is already root).

**`src/api/client.ts`** — no structural change to the request/response mechanics, but `handleUnauthorized()` should attempt one `POST /refresh` before forcing logout (see Auth section below), and the generic response-envelope `success` field should be considered when deciding what counts as a normalized error (a `200` with `success: false` body, if the API ever does that, isn't handled by the current "non-2xx → ApiError" logic — worth a defensive check, but no evidence yet that the API returns `success:false` with a 2xx; flag as an assumption, not a required change).

**`src/api/endpoints/auth.ts`** — add `refresh()` (`POST /refresh`, no body, uses current token) and `logout()` (`POST /logout`) and `getMe()` (`GET /me`). Update `login()`'s response type to the enveloped `{ success, data: AuthTokenData }` (drop the old "maybe unwrapped" defensive check — envelope is now confirmed).

**`src/api/endpoints/products.ts`** — replace `getProducts` (generic `/products` list) with `getPosProducts(merchantId, { category_id?, search? })` hitting `/pos/products`, typed to return `App.Data.Merchant.Pos.ProductData[]` (flat, unpaginated, per the `{success, data: [...]}` shape). Keep the old `/products` CRUD functions only if the follow-up product-management work happens (see Out of scope) — not needed for this migration's scope.

**`src/api/endpoints/tables.ts`** (new) — `getPosTables(merchantId)` hitting `/pos/tables`.

**`src/hooks/db/useProducts.ts`** — repoint at `getPosProducts`; `mapProduct` updates to read the confirmed real shape: `add_ons` (finally real — drop the `add_ons: []` limitation and the dead-`AddOnModal` comment), `original_price` derived from `discount` (shape still unconfirmed — access defensively, e.g. `discount?.price ?? null`, same pattern as other opaque fields), `thumbnail_url`/`image_url` from `image.thumbnail`/`image.default` instead of the old flat fields, `is_active` from `is_active` (unchanged).

**`src/hooks/db/useTables.ts`** — replace the local SQLite-backed `useTables()` with a live query against `getPosTables`, removing the last "stays local" limitation from the first integration. `src/db/schema.ts`'s `tables`/`areas` tables and their seed data become fully dead once this lands (drop in the same pass, mirroring the Phase 7 cleanup pattern from the first integration).

**`src/hooks/db/useCategories.ts`** — the "derive from product.category" approach was a workaround for "no categories endpoint"; that's no longer true. Simplest correct fix: keep deriving from `/pos/products`' embedded `category` field for the POS category filter (unchanged, still works, avoids a second network call) — **not** worth switching to the paginated `/categories` management endpoint for this read-only filter use case. No code change required here beyond whatever `mapProduct`-adjacent shape changes ripple through.

**`src/stores/useAuth.ts`** — add `refreshToken: string | null` (optional field, store if present on login response, per the "store-and-ignore" note above). Add a `refresh()` action that calls `api/endpoints/auth.refresh()` and updates the token on success, throws/logs out on failure. Consider calling `getMe()` on app boot (instead of just trusting the persisted token) to catch server-side-revoked sessions — recommended addition, not strictly required.

**`src/api/client.ts` 401 handling** — currently `handleUnauthorized()` immediately logs out. With a real refresh endpoint, the standard pattern applies: on 401, try `POST /refresh` once; if that succeeds, retry the original request with the new token; if refresh also fails, log out. This reverses the explicit "no refresh flow" decision from the first integration's plan.

**`src/app/sign-in.tsx`** — no change needed; `useLogin`'s `onSuccess` already calls `useAuth.getState().login(payload)`, which should be extended to also store `refresh_token` if present.

**`src/hooks/db/useOrders.ts`** — `useOrders`'s query-building changes from `{status, per_page, page}` to the bracket-filter convention: `filter[order_status]`, `filter[search]`, `filter[date_from]`, `filter[date_to]`, `sort`, `per_page`, `page`. `src/api/endpoints/orders.ts`'s `getOrders()` needs its query param names updated to match (this is purely a query-string change; the paginated envelope shape we already built for is confirmed correct).

**`src/screens/orders/index.tsx`** — the status filter pills currently pass free-text status straight through; update the candidate filter values to match the confirmed `order_status` write-side enum (`new/process/completed/rejected`) via `filter[order_status]` instead of the old bare `status` param.

**`src/screens/orders/detail.tsx` + new `src/hooks/db/useUpdateOrderStatus.ts`** — restore a real status-update action now that `PATCH /orders/:orderId/status` exists, replacing the "Refresh payment status only" fallback from the first integration. Map `new → process → completed`/`rejected` to whatever UI actions make sense (e.g. "Accept" for new→process, "Mark Completed" for process→completed, "Reject" for →rejected) — needs a UX decision, not just a mechanical swap, since the enum doesn't map 1:1 to the old completed/pending/cancelled model. Keep the "Refresh payment status" action alongside it — that endpoint is unchanged and still useful independently of order status.

**`src/hooks/db/useCheckout.ts` / `useCart.ts`** — no change; `CheckoutRequest`/`CartValidateRequest` are unchanged and the endpoint paths (`/:merchantId/cart/validate`, `/:merchantId/checkout`) are unchanged, just now reached via the new base URL.

**`src/hooks/db/useGuests.ts` / `useCustomers.ts`** — no structural change; response envelopes gain `success` (harmless), `listGuests` is confirmed unpaginated (matches current code).

## Decisions

1. **Payment methods now have a real endpoint**: `GET /api/v0/merchant/payments?group_type=` (optional, case-insensitive partial match). Superseded the earlier "hardcode Cash/QRIS" decision — no env vars or guessed UUIDs needed. Confirmed response shape (from the endpoint's own Postman documentation, not just the generated types — `App.Data.Customer.Payment.PaymentData.fees` is still typed opaque `Array<any>` by Scramble, but the real shape is documented directly):
   ```json
   {
     "success": true,
     "data": [
       { "group_type": "Cash", "group_label": "Cash", "payments": [
           { "id": "uuid", "code": "cashier", "name": "Kasir", "image": null, "fees": { "payment_fee": 0, "app_fee": 0, "total_fee": 0, "unit": "fixed" }, "is_active": true }
       ]},
       { "group_type": "E-Money", "group_label": "E-Money", "payments": [
           { "id": "uuid", "code": "qris", "name": "QRIS", "image": "https://...jpg", "fees": { "payment_fee": 0.7, "app_fee": 0, "total_fee": 0.7, "unit": "percentage" }, "is_active": true }
       ]}
     ]
   }
   ```
   Update `src/api/endpoints/payments.ts`'s `getPaymentGroups()` to hit `/payments` (merchant-scoped now, under the new base URL — no more `root: true` absolute-path override needed, unlike the old `/customer/payments`). Update `src/api/mappers/order.ts`'s `extractFeeRate()` to read the confirmed shape directly instead of guessing: `unit === 'percentage' ? total_fee / 100 : 0` for a rate, and separately expose the `unit === 'fixed'` `total_fee` as a flat amount — `POSPayment.fee_rate` (a single percentage number) doesn't have room for a fixed-fee model, so `src/types/pos.ts`'s `POSPayment` type needs a small shape change (e.g. `{ fee_unit: 'fixed'|'percentage', fee_value: number }` replacing `fee_rate`), with `CheckoutModal.tsx`'s fee math (`Math.round(subtotal * feeRate)`) updated to branch on `fee_unit`.
2. **Order status is a 5-value enum**: `new, process, completed, cancelled, rejected`. Note the write-side `UpdateOrderStatusRequest.status` type only allows `"new" | "process" | "completed" | "rejected"` (no `cancelled`) — cancellation is presumably a separate/system/customer-initiated transition, not a merchant-settable status via this endpoint. Order List filter pills should offer all 5 (read-side). Order Detail's action buttons should only offer the 4 merchant-settable transitions (e.g. New → "Accept" (process), Process → "Mark Completed", New/Process → "Reject"), and continue to just display (not offer a button for) `cancelled` when that's the current status.
3. **Session restore stays as-is** — trust the persisted token on boot, no `GET /me` validation call added.
4. **Scope stays Auth + Orders + POS only.** Product/category/add-on management CRUD is explicitly a separate future follow-up; do not touch `src/screens/products/*` in this migration.
5. **Checkout must be completed end-to-end through payment confirmation**, not just order creation. Concretely: Cash orders are effectively settled immediately (no polling needed — the payment-status endpoint may still report pending briefly, but the UI shouldn't block on it for cash), QRIS orders should continue polling `GET /orders/:orderId/payment-status` (already built in `PaymentModal.tsx`) until `is_successful: true`, then transition to `PaymentSuccessModal`. Verify this full loop works against the new API version — this is the primary functional regression risk of the base-URL/envelope change, since every call in the chain (validate → checkout → payment-status) is affected.

## Out of scope for this migration

Delivery (dispatch/tracking/waybill), Analytics, Dashboard summary, Notifications, Reviews, Galleries, Cancellation Requests (decision endpoint), Staff management, Subscription/plans, Finance (payouts/beneficiaries), Discounts, Coupons, Areas/Tables CRUD (as opposed to the read-only `/pos/tables` this plan does use), and all Product/Category/Add-on management CRUD (per decision 4 above, follow-up).

## Verification

1. Update `.env` to the new `base_url` (root domain) and confirm `EXPO_PUBLIC_API_BASE_URL` composition resolves to `.../api/v0/merchant`.
2. Login → confirm `access_token`/`refresh_token` persisted; force a 401 and confirm one silent refresh-and-retry happens before logout (not an immediate logout).
3. POS screen: confirm products now show real add-ons (AddOnModal reachable again) and discount pricing where present; confirm table selection now comes from `/pos/tables` instead of the local mock; confirm the Cash/QRIS payment picker in Checkout works with no network call.
4. Orders: confirm bracket-filter queries return correctly filtered/paginated results; confirm all 4 merchant-settable status transitions via the new PATCH endpoint update both detail and list views; confirm `cancelled` displays correctly wherever it appears but has no action button.
5. Full checkout regression: guest/customer/anonymous × dine-in/takeaway × cash/QRIS, through to `PaymentSuccessModal`, confirming the QRIS polling loop actually reaches `is_successful: true` against the new API and cash orders don't get stuck waiting on it.

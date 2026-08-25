# Align pos-app with new merchant order-domain contract

## Context

Backend contract changed (confirmed by diffs in `src/types/merchant-generated.d.ts`, `src/types/merchant-requests.d.ts`, `docs/postman/Merchant API.postman_collection.json`, and cross-checked against `/Users/rakbar/Herd/soeat-app/docs/merchant-order-domain-handoff.md` and `ORDER_FLOW_MATRIX.md`):

- `order_status` collapses to three values: `open | completed | cancelled` (old `new`/`process`/`rejected` are gone; merchant rejection is now `cancelled` + `cancellation_reason_code=merchant_rejected`).
- `OrderData`/`OrderListData` gained `cancellation_reason_code` and `kitchen_ticket` (nullable KDS ticket).
- `MerchantProfileData`/`UpdateMerchantProfileRequest` dropped `auto_process_on_payment_settlement` entirely.
- Order endpoints moved under a merchant-scoped path: `/v0/merchant/{merchant_id}/orders...` (previously unscoped `/v0/merchant/orders...`). Same pattern already used by `getDashboard`, `listGuests`, `checkout` (merchantId threaded from `useAuth`).
- New KDS endpoints exist server-side (`/kitchen-tickets`, `/kitchen-tickets/{id}`, `/kitchen-tickets/{id}/status`) but are out of scope for this pass — types only, no new screen/endpoints yet (per user decision).

Goal: make the app compile and behave correctly against the new contract — fix everything that reads/writes the old status enum or the removed field, thread `merchant_id` into order API calls, and rework the order accept/complete action into a single open→completed/cancelled flow. Do not build a KDS screen yet.

## Changes

### 1. Remove `auto_process_on_payment_settlement`
- `src/schemas/merchant-profile.ts:23` — drop the zod field.
- `src/screens/settings/merchant-profile/index.tsx` — delete the `Controller name="auto_process_on_payment_settlement"` block (~320-335) and its three payload references (profile→form mapping ~537, form defaults ~563, submit payload ~624, reset-after-save ~640).
- `src/locales/en.ts:1085-1086` and `src/locales/id.ts:1089-1090` — remove `autoProcessTitle`/`autoProcessDescription` keys.

### 2. Order status enum: `open | completed | cancelled`
- `src/api/mappers/order.ts` — rewrite `ORDER_STATUSES` map to `open` (warning), `completed` (success), `cancelled` (danger). Drop `new`, `process`, `rejected`, duplicate `canceled`.
- `src/hooks/db/use-orders.ts` — fix `getOptimisticStatus()` (lines ~12-25): `is_final` = `status === "completed" || status === "cancelled"`; `can_be_cancelled` = `false` (both target states are terminal); `next_status` = `null` (no more `process` chaining), since `OrderStatusValue` is now only the request's `"completed" | "cancelled"`.
- `src/screens/orders/index.tsx` — `StatusFilter` type (line 28) and `STATUS_FILTERS` (line 30) become `"all" | "open" | "completed" | "cancelled"`; delete the stale commented-out line 27.
- `src/locales/en.ts` (~746-757) and `src/locales/id.ts` mirror — update `orders.filters` and `orders.status` keys to `open/completed/cancelled`; drop `rejected`/`new`/`process` copy.

### 3. Order detail: single complete/cancel action
- `src/screens/orders/detail/index.tsx`, `OrderStatusActions` (lines 128-171):
  - Prop type `onUpdate` becomes `(input: { id: string; status: "completed" | "cancelled"; reason?: string | null }) => void`.
  - Guard becomes `if (status !== "open") return null;`.
  - Render two actions when open: "Mark completed" (`status: "completed"`) and "Cancel order" (`status: "cancelled"`) — cancel opens a small reason prompt/input (free text, optional) passed through as `reason`, matching `UpdateOrderStatusRequest.reason`.
  - Drop the old `accept`/`markCompleted` two-step copy; reuse/rename `orders.detail.markCompleted` and add a `orders.detail.cancelOrder` + `orders.detail.cancelReasonPrompt` locale key (en/id).
- `statusCode` usage at line ~573 stays the same shape (still reads `orderStatus.value`).
- Optionally surface `cancellation_reason_code` next to the cancelled badge if present (small text, e.g. via a label lookup) — keep it simple, no new component.

### 4. Thread `merchant_id` into order endpoints
- `src/api/endpoints/orders.ts` — add `merchantId: string` as first param to `getOrder`, `getOrders`, `getPaymentStatus`, `updateOrderStatus`; build paths as `` `/${merchantId}/orders/...` `` (matches Postman's `/merchant/{merchant_id}/orders`, consistent with `API_BASE_URL` already being `.../api/v0/merchant`).
- `src/hooks/db/use-orders.ts` — `useOrders`, `useOrder`, `useUpdateOrderStatus` pull `merchantId` from `useAuth((s) => s.merchantId)` (same pattern as `use-checkout.ts:86`, `use-guests.ts:6`), pass it through, add it to query keys (`["orders", merchantId, orderStatus]`, `["order", merchantId, id]`), and gate `enabled: !!merchantId` alongside existing `!!id`.

### 5. Fix `OrderListData` construction gap
- `src/hooks/db/use-checkout.ts`, `toOrderListData()` (~48-63) — add `cancellation_reason_code: null` and `kitchen_ticket: null` so the optimistic post-checkout cache patch satisfies the (now stricter) `OrderListData` type.

## Files touched
- `src/schemas/merchant-profile.ts`
- `src/screens/settings/merchant-profile/index.tsx`
- `src/api/mappers/order.ts`
- `src/hooks/db/use-orders.ts`
- `src/hooks/db/use-checkout.ts`
- `src/api/endpoints/orders.ts`
- `src/screens/orders/index.tsx`
- `src/screens/orders/detail/index.tsx`
- `src/locales/en.ts`, `src/locales/id.ts`

## Verification
- `npx tsc --noEmit` — must be clean (this is what will actually surface every stale-enum/removed-field reference).
- Run the app (`expo start`), open Orders screen: filters show open/completed/cancelled, list renders correctly.
- Open an order detail with `order_status=open`: confirm "Mark completed" and "Cancel order" (with reason prompt) both work and refetch.
- Settings → Merchant Profile: confirm the auto-process switch is gone and save still succeeds.
- Grep after: `grep -rn "auto_process_on_payment_settlement\|\"process\"\|'process'" src` should return nothing order/profile-related.

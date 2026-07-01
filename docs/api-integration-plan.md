# Integrate pos-app with the Laravel Merchant REST API

## Context

The app currently runs fully offline: Auth, POS (products/payments/tables), and Orders all read/write a local SQLite DB via Drizzle (seeded from mock data, with `is_dirty`/`synced_at` scaffolding for a sync feature that was never built). The goal is to wire Auth, POS, Order List, and Order Detail to the real Laravel Merchant API (`https://soeat-app.test/api/v1/merchant`), using the Postman collection "SoEat - Merchant Cart and Checkout" (15 endpoints) as the single source of truth, per the user's brief.

Investigation surfaced real gaps between the generic integration brief and what the API actually supports. These were resolved with the user up front (see "Decisions" below) rather than guessed at implementation time. The auto-generated types at `src/types/merchant-generated.d.ts` (`App.Data.Merchant.*` / `App.Data.Customer.*`) and `src/types/merchant-requests.d.ts` (`App.Requests.Merchant.*`) are authoritative and already match the Postman collection — verified directly (e.g. `CheckoutRequest`, `StoreGuestRequest`, `AuthTokenData`). Use these types; don't hand-roll duplicates.

**Decisions already made with the user (do not re-litigate):**
1. Products/Payments/Orders become pure server-state via TanStack Query hitting the live API. Local SQLite stays only for printer settings, receipt settings, and **tables** (no `/tables` endpoint exists in the collection — dine-in table selection stays local/mock, an accepted limitation).
2. No refresh-token flow (none exists server-side — login only returns `access_token` + `expires_in`, no `refresh_token`). Any 401 response → clear session, redirect to sign-in.
3. Order Detail's "Mark Completed"/"Cancel" buttons are **removed** (no status-update endpoint in the collection). Replaced with a "Refresh payment status" action hitting `GET /merchant/orders/:orderId/payment-status`.
4. Checkout's customer selection is extended from the current `'merchant'|'registered'` enum to the API's real `'guest'|'customer'|'anonymous'` model, with guest search/inline-create and registered-customer search.

**Known limitations to flag, not silently paper over (confirmed against the generated types):**
- `App.Data.Merchant.Product.ProductData` has **no `add_ons` field** and no add-ons endpoint exists in the collection → product add-ons are unreachable post-migration; every product tap adds straight to cart. Leave `AddOnModal.tsx` mounted but effectively dead, with a one-line comment.
- No discount/`original_price` field on `ProductData` → the strikethrough-discount UI has no backing data; always renders full price.
- No standalone categories endpoint → categories are derived from the `category` object embedded on each product.
- `src/screens/products/*` (create/edit) write directly to local SQLite tables that Products (read) no longer sources from. Rather than let Save silently no-op, disable those actions with a "not yet connected" banner.
- Several nested response fields are typed `any[]` by Scramble (`order_status`, `payment`, `pricing`, `customer`, `fees`, etc.) — meaning "opaque object, exact shape unconfirmed." Build defensive accessor helpers and verify exact shapes with a one-time `__DEV__` log against the live server during implementation, rather than guessing.
- `GET /customer/payments` and `GET /merchant/orders(...)` don't follow the `/merchant/:merchantId/...` path pattern the other endpoints use — the API client needs an escape hatch for absolute/differently-scoped paths, not just merchant-prefixed ones.

## Implementation

### 1. API client (`src/api/`)
- `src/api/config.ts` — `API_BASE_URL` from `EXPO_PUBLIC_API_BASE_URL` env var (default `https://soeat-app.test/api/v1/merchant`), `API_TIMEOUT_MS = 30_000`. Add `.env.example`.
- `src/api/ApiError.ts` — `ApiError { status, code?, message, errors?, raw? }` + `isApiError()`.
- `src/api/client.ts` — thin `fetch` + `AbortController` wrapper (no new dependency — 15 endpoints don't justify axios/ky). Injects `Authorization: Bearer <token>` from `useAuth.getState().token`, normalizes non-2xx into `ApiError`, and on 401 calls a `handleUnauthorized()` that logs out + redirects to `/sign-in`. Support both merchant-scoped paths and an absolute/override path for `/customer/payments` and `/merchant/orders/...`.
- `src/api/endpoints/{auth,products,payments,guests,customers,cart,checkout,orders}.ts` — one function per Postman endpoint, typed with the generated `App.Data.Merchant.*`/`App.Requests.Merchant.*` types.
- `src/api/mappers/order.ts` — defensive accessors for opaque fields (`extractStatusLabel`, `extractStatusColor`, `extractCustomerName`, `extractPaymentName`, etc.), used instead of assuming shapes.

### 2. Authentication
- `src/stores/useAuth.ts`: add `merchantId`, `activeMerchant` (from `merchants[0]`), `hasHydrated` (set via `persist`'s `onRehydrateStorage`, so `_layout.tsx` doesn't flash sign-in during the async SecureStore read). Replace `loginLocal` with `login(payload: AuthTokenData)`. Add `partialize` to persist only durable fields.
- `src/types/user.ts`: alias `User = App.Data.Merchant.Auth.MerchantUserProfileData` (fields match exactly).
- `src/schemas/auth.ts` (new): `loginSchema` (email/password, Zod).
- `src/hooks/useLogin.ts` (new): mutation wrapping `POST /login`; on success calls `useAuth.getState().login(payload)` and `router.replace('/(app)')`.
- `src/app/sign-in.tsx`: wire RHF + `zodResolver(loginSchema)`, fix the existing bug where both email/password inputs share one `value` state (needs two separate `Controller`-bound fields), add loading/error states.
- `src/app/_layout.tsx`: replace `const session = true` with `useAuth((s) => !!s.token)`, gate on `hasHydrated` first, wire `setQueryClientRef(queryClient)` in a mount effect, add `retry` policy to `QueryClient` defaults (no retry on 4xx, limited retry on 5xx/network).

### 3. POS — Products, Categories, Payments
- `src/hooks/db/useProducts.ts`: `useProducts(search?, categoryId?)` / `useProduct(id)` keep their names/signatures but now call `GET /merchant/:merchantId/products`, gated on `merchantId` from `useAuth`. Map `ProductData → POSProduct` with `add_ons: []`, `original_price: null` (documented limitations above). No single-product-by-id endpoint exists, so `useProduct` derives from the already-fetched list.
- `src/hooks/db/useCategories.ts`: derive distinct `{id, name}` from each product's embedded `category` object (reuses the `useProducts` query cache — no second network call in the common case).
- `src/hooks/db/usePayments.ts`: `usePaymentGroups()` calls `GET /customer/payments` (absolute-path override). `fees` is opaque — write a defensive `extractFeeRate()` helper, verify its real shape against the live server, then finalize (this directly feeds `CheckoutModal`'s fee math).
- `src/screens/products/index.tsx` / `form.tsx`: leave local-SQLite logic in place but disable Save/Create with a "not yet connected to the live API" banner, rather than letting them silently write to a table nothing reads anymore.

### 4. Checkout
- `src/schemas/checkout.ts` + `src/types/pos.ts` (`CheckoutFormState`): extend `customer_type` to `'guest'|'customer'|'anonymous'`, add `guest_id`, `guest_name/email/phone`, `customer_id`, `pickup_time` (takeaway). Update `DEFAULT_CHECKOUT_FORM` in `usePOSStore.ts`.
- New hooks: `useGuests`/`useCreateGuest` (`src/hooks/db/useGuests.ts`), `useCustomerSearch` (`src/hooks/db/useCustomers.ts`, enabled once query ≥ 2 chars), `useValidateCart` (`src/hooks/db/useCart.ts`, wraps `POST .../cart/validate`, surfaces `409 PRICE_CHANGES_DETECTED`), `useCheckout` (`src/hooks/db/useCheckout.ts`, wraps `POST .../checkout`, builds `CheckoutRequest` from `useCartStore` + `checkoutForm`).
- `src/components/pos/modals/CheckoutModal.tsx`: replace the `merchant/registered` pill group with `guest/customer/anonymous`; guest path adds a search-existing-or-create-inline flow; customer path keeps the existing search UI wired to `useCustomerSearch`; anonymous needs no fields. Takeaway shows a pickup-time input instead of table select; dine-in keeps the existing (local/mock) table select. Before opening the payment modal, call `useValidateCart`; on success call `useCheckout` (real order creation) instead of fabricating a local `PaymentSession`.
- `src/components/pos/modals/PaymentModal.tsx`: "Check Payment" calls the real `GET .../orders/:orderId/payment-status` (via the order id returned from checkout) and only proceeds to success when `is_successful === true`.
- `src/hooks/db/useCreateOrder.ts`: **delete** — checkout already creates the order server-side, so there's nothing left for this hook to do.
- `src/components/pos/modals/PaymentSuccessModal.tsx` + `usePOSStore.ts`: add `checkoutResult: CheckoutData | null`, set by `CheckoutModal` on `useCheckout` success; `PaymentSuccessModal` renders from this real result instead of inserting a fake local order.

### 5. Order List & Detail
- `src/hooks/db/useOrders.ts`: `useOrders(status?)` becomes `useInfiniteQuery` against `GET /merchant/orders?status=&per_page=20&page=`, tolerating either a bare array or a Laravel `paginate()` envelope. This is a real signature change from flat array to paginated — call it out in the PR description. `useOrder(id)` calls `GET /merchant/orders/:orderId`. `useUpdateOrderStatus` is deleted (decision 3). New `src/hooks/db/usePaymentStatus.ts` wraps `GET .../orders/:orderId/payment-status` and patches the `['order', id]` cache on success.
- `src/screens/orders/index.tsx`: flatten `data.pages`, wire `fetchNextPage`/pull-to-refresh; pass `status` straight through to the server instead of client-side filtering; drop or clearly label the stat cards ("this page only") since there's no summary endpoint in the collection to back accurate today/pending/cancelled totals.
- `src/screens/orders/detail.tsx`: remove the Mark Completed/Cancel block; add "Refresh payment status" using `usePaymentStatus`, rendering `payment_status_label`/`payment_status_color` (concretely typed strings — safe to use directly). Replace flat `MockOrder` field access with real `OrderData` fields (`order.code` as display id, `subtotal`/`total`/`total_tax_and_fee` are concrete numbers; `order_status`/`payment_status`/`customer`/`payment` go through the Phase-1 mapper helpers).

### 6. Error handling & UI states
- `src/components/common/{ErrorState,LoadingState,EmptyState}.tsx` (new, small/reusable) — applied to Products/Orders/Order Detail screens, which today only handle the empty case.
- `src/components/common/ErrorBoundary.tsx` (new) wrapping the app content for render-time crashes.
- Mutation errors (`useLogin`, `useCreateGuest`, `useCheckout`, `useValidateCart`) surface `ApiError.message`/`errors` inline near the relevant field, matching `CheckoutModal`'s existing validation-error pattern.

### 7. Cleanup
- Delete `src/hooks/db/useCreateOrder.ts`, `src/data/orders-mock.ts` (and the now-unused `MOCK_PAYMENT_GROUPS`/`MOCK_CATEGORIES` in `src/data/pos-mock.ts`, keeping `MOCK_TABLES`).
- `src/db/schema.ts` / `src/db/seed.ts`: drop `payment_methods`, `orders`, `order_items` (no remaining consumer); **keep** `products`/`categories` tables since the disabled-but-present products management screen still reads/writes them. Regenerate a Drizzle migration for the schema change.
- Grep-verify no leftover imports: `grep -rn "orders-mock\|useCreateOrder\|useUpdateOrderStatus" src/`.

## Verification
1. `.env`: `EXPO_PUBLIC_API_BASE_URL=https://soeat-app.test/api/v1/merchant`; confirm the dev client can reach the `.test` host (may need a hosts entry/trusted cert — an environment step, not code).
2. Login with `owner@soeat.id`/`password`; confirm token+merchantId persist across app restart; confirm bad password shows inline error.
3. Force a 401 (corrupt persisted token) and confirm auto-logout + redirect to sign-in.
4. POS screen: confirm real products/categories load; confirm tapping a product adds straight to cart (add-ons path is dead per the documented limitation).
5. Checkout: exercise all three customer_type paths (new guest, existing guest, registered customer search, anonymous); temporarily log the outgoing `CheckoutRequest` body to confirm correct shape.
6. Force a stale price to confirm the `cart/validate` 409 banner blocks checkout.
7. Confirm `PaymentSuccessModal` renders from the real `CheckoutData`, and the new order appears in Order List immediately after.
8. Order List: force multiple pages (temporarily lower `per_page`) and confirm pagination + pull-to-refresh work.
9. Order Detail: confirm "Refresh payment status" updates the displayed status, and the removed Mark Completed/Cancel buttons are gone.
10. Point `EXPO_PUBLIC_API_BASE_URL` at an unreachable host and confirm Products/Orders show the new error state with a working Retry, not a blank screen or crash.

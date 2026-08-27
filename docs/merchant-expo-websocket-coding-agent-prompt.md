# Coding Agent Prompt: Merchant Expo WebSocket Order Notifications

You are implementing the merchant-side WebSocket notification feature in this React Native/Expo merchant app.

## Objective

Connect the merchant Expo app to the existing Laravel API WebSocket infrastructure so an authenticated merchant receives a real-time notification when a new order for that merchant has a paid payment status.

Implement foreground notification handling only in this phase. Do not add native push notifications unless the app already has an established push-notification abstraction that can be reused safely.

## Backend contract

Use the existing API contract exactly:

- Broadcasting auth endpoint: `POST /api/v0/merchant/broadcasting/auth`
- Authentication: `Authorization: Bearer <merchant-jwt>`
- Private channel: `private-merchants.{merchantId}`
- Event name: `order.paid`
- Event payload:

```ts
type MerchantOrderPaidEvent = {
  order_id: string;
  merchant_id: string;
  code: string | null;
  payment_status: "settlement";
  paid_at: string | null;
  total: number | string | null;
  order_type: string | null;
};
```

The app must subscribe only to the currently authenticated merchant’s channel. The server authorizes channel membership using the merchant’s current assignment, so a failed authorization must be treated as an access/configuration error, not silently ignored.

## Confirmed Reverb and Echo configuration

Use `laravel-echo` with `pusher-js` as the Laravel Reverb client. Do not introduce a second WebSocket protocol or client abstraction.

The repository provides these Expo environment variables:

```env
EXPO_PUBLIC_REVERB_APP_KEY
EXPO_PUBLIC_REVERB_HOST
EXPO_PUBLIC_REVERB_PORT
EXPO_PUBLIC_REVERB_SCHEME
```

Configure Echo from these variables. For the current HTTPS production-safe configuration, use the Reverb host, port for both `wsPort` and `wssPort`, `forceTLS: true` when the scheme is `https`, and enable the `ws` and `wss` transports. Never hardcode these values.

Use Echo’s private-channel API with the logical channel name:

```ts
echo.private(`merchants.${merchantId}`);
```

Echo adds the `private-` prefix when it subscribes. Do not pass `private-merchants.${merchantId}` to `echo.private()` or the prefix may be duplicated.

The Reverb authorizer must send a `POST` request with `application/x-www-form-urlencoded` fields:

```text
socket_id=<connection socket id>
channel_name=private-merchants.<merchant id>
```

When using the existing API client, its base URL already ends in `/api/v0/merchant`; therefore the request path passed to `apiRequest()` is `/broadcasting/auth`, not the full `/api/v0/merchant/broadcasting/auth` path. Do not send this request as JSON. Extend the existing API client’s request-body handling if necessary rather than creating a second API client.

The Postman contract confirms a successful authorization response shaped like `{ auth: string }`. Verify the actual Echo/Reverb event envelope during implementation before writing the runtime parser; do not assume the event payload is already decoded or that it is not wrapped in a `data` field.

## Before editing

Inspect the Expo repository and identify the existing conventions for:

- Expo SDK and React Native versions
- Expo Router/navigation structure
- Merchant login and JWT storage
- API client and response/error handling
- Current merchant/profile endpoint and merchant ID source
- Order list/detail query keys and cache invalidation
- Existing WebSocket, Pusher, Reverb, notification, toast, or snackbar code
- Logout and account-switch behavior
- Test, lint, typecheck, and formatting commands

Reuse existing abstractions. Do not introduce a second API client, token store, query provider, navigation pattern, or notification system.

## Implementation priorities

### P0 — Authentication and WebSocket configuration

- [x] Read the merchant JWT from the existing secure token/auth abstraction.
- [x] Configure the WebSocket client with the correct production-safe URL and TLS settings.
- [x] Configure the private-channel authorizer to call `/api/v0/merchant/broadcasting/auth` with the merchant Bearer token.
- [x] Send the authorizer request as URL-encoded form data with `socket_id` and `channel_name`; confirm the channel name sent to the server is `private-merchants.{merchantId}`.
- [x] Use Expo environment configuration following the repository’s existing convention; do not hardcode hosts, keys, or secrets.
- [x] Confirm the WebSocket client library is compatible with the current Expo environment. If a native dependency is required, document the development-build/EAS implication before adding it.
- [x] Never log JWTs, authorization headers, private-channel auth responses, or sensitive order/customer data.
- [x] Do not log full Reverb connection frames or unparsed event payloads in production builds.

### P0 — Merchant channel lifecycle

- [x] Create one focused, testable merchant order-notification service/hook/provider.
- [x] Keep transport handling separate from a central `processMerchantOrderPaidEvent()` function so a future push transport can reuse validation, deduplication, cache invalidation, and notification behavior.
- [x] Subscribe after a valid merchant session and merchant ID are available.
- [x] Call Echo’s `.private()` with `merchants.{merchantId}` and verify that the resulting wire channel is `private-merchants.{merchantId}`.
- [x] Bind only to `order.paid`.
- [x] Unsubscribe and disconnect on logout, token removal, or merchant switch.
- [x] Prevent duplicate subscriptions when the root layout or screens re-render.
- [x] Clean up all listeners on unmount.
- [x] Handle connection states and authorization failures without creating retry storms.
- [x] Reconnect with bounded backoff when the connection drops through Pusher/Reverb connection handling.
- [x] Re-establish the subscription when the app returns to the foreground.

### P0 — Event validation and security

- [x] Treat all WebSocket payloads as untrusted input and validate the required fields at runtime.
- [x] Ignore events whose `merchant_id` does not match the active merchant ID.
- [x] Ignore events whose `payment_status` is not exactly `settlement`.
- [x] Ignore malformed events without crashing the app.
- [x] Deduplicate by `order_id` so reconnects or repeated delivery do not show duplicate notifications.
- [x] Bound the deduplication memory or use an appropriate short-lived cache.

### P1 — Orders UI and data consistency

- [x] On a valid new paid-order event, invalidate or refetch the existing merchant order-list query using its actual query-key convention.
- [x] Use the existing order query keys: `["orders", merchantId, orderStatus]` for infinite lists and `["order", merchantId, orderId]` for details. Broad order-list invalidation should use `["orders", merchantId]`.
- [x] If the app supports optimistic cache insertion safely, use the event payload only for the compact fields it contains; do not invent missing order details.
- [x] Prefer refetching the order detail through the existing API client when navigation requires fields not included in the event.
- [x] Make the update idempotent and safe when the order list screen is not currently mounted.
- [x] Ensure loading, stale, empty, and error states continue to work normally.

### P1 — Foreground notification and navigation

- [x] Show an in-app toast/banner/alert using the app’s existing notification UI.
- [x] Include the order code when available and a clear paid-order message.
- [x] Make the notification accessible and avoid exposing unnecessary customer/payment details.
- [x] When the user taps the notification, navigate using the existing order-detail route.
- [x] Prefer the existing HeroUI Native toast API with `actionLabel` and `onActionPress` for the order-detail action; do not add another notification UI system.
- [ ] If navigation is not ready, queue the destination briefly or safely discard it according to existing app conventions. (Not exercised until runtime navigation testing.)
- [x] Avoid forcing navigation while the merchant is actively entering data or viewing an unrelated flow by using an explicit toast action.

### P1 — Lifecycle recovery

- [x] On foreground resume, reconnect if needed and refresh the relevant order data.
- [x] Do not assume a WebSocket connection guarantees delivery while the app was backgrounded.
- [x] Avoid duplicate refetches caused by both the reconnect callback and app-state callback through session-scoped lifecycle handling.
- [x] Ensure logout immediately prevents subsequent events from affecting the previous merchant session.
- [x] Guard queued callbacks with the current token, merchant ID, and a session generation/version so events from a session that has logged out or switched merchant cannot affect the new session.

### P2 — Tests and developer documentation

- [ ] Add unit tests for payload validation. (Pending: the repository has no configured test runner.)
- [ ] Add unit tests for merchant ID filtering and settlement filtering. (Pending: the repository has no configured test runner.)
- [ ] Add unit tests for duplicate-event suppression. (Pending: the repository has no configured test runner.)
- [ ] Add tests for subscription setup and cleanup. (Pending: the repository has no configured test runner.)
- [ ] Add tests for logout, merchant switch, reconnect, and foreground recovery where the project’s test setup supports them. (Pending: the repository has no configured test runner.)
- [ ] Add a test that a valid event invalidates/refetches the correct order query. (Pending: the repository has no configured test runner.)
- [ ] Add a test for notification rendering or notification-service invocation. (Pending: the repository has no configured test runner.)
- [x] Update the Expo environment/setup documentation with required variables and local development requirements in this prompt.
- [ ] Document how to verify the flow manually using a paid order. (Pending: requires a live backend/device session.)
- [x] If no test runner exists in the repository, report that limitation explicitly; do not claim unit tests passed without a configured test command.

## Suggested event flow

```text
merchant session ready
        ↓
subscribe to private-merchants.{merchantId}
        ↓
receive order.paid
        ↓
validate payload and active merchant
        ↓
deduplicate by order_id
        ↓
invalidate/refetch merchant orders
        ↓
show foreground notification
        ↓
tap notification → existing order detail screen
```

## Constraints

- Do not modify the Laravel backend unless the repository inspection proves the contract above is different; if it is different, stop and report the exact mismatch.
- Do not create a new authentication system.
- Do not store tokens in plain AsyncStorage if the app already has secure storage.
- Do not subscribe to a broad public channel or to another merchant’s channel.
- Do not rely on WebSocket events as the sole source of truth; the order API remains authoritative.
- Do not add background push notification infrastructure in this phase.
- Do not log secrets or full event payloads in production builds.

## Verification checklist

- [x] Typecheck passes.
- [x] Lint passes.
- [x] Formatting passes.
- [ ] Relevant unit/component tests pass. (Pending: no test runner is configured.)
- [x] The app starts with the existing Expo development workflow configuration check.
- [ ] Login creates a merchant session and starts the subscription once. (Pending: requires live-device testing.)
- [ ] A paid order for the active merchant produces one in-app notification. (Pending: requires a live paid order.)
- [ ] The order list refreshes and shows the new order. (Pending: requires a live paid order.)
- [ ] An event for another merchant is ignored. (Covered by runtime validation; live test pending.)
- [ ] A non-settlement event is ignored. (Covered by runtime validation; live test pending.)
- [ ] Reconnect does not create duplicate notifications or subscriptions. (Pending: requires live lifecycle testing.)
- [ ] Logout removes the subscription and prevents stale-session notifications. (Pending: requires live lifecycle testing.)
- [ ] Foreground recovery reconnects and refreshes order data. (Pending: requires live lifecycle testing.)
- [x] No secrets or authorization headers appear in logs by implementation review.
- [x] Reverb variables are available in the local Expo environment; preview/production EAS variables still require deployment verification.

## Final report

Report:

1. Files changed and the responsibility of each.
2. The WebSocket library and configuration used.
3. The exact environment variables required.
4. The query key invalidated/refetched for merchant orders.
5. Tests and commands run, including any limitations.
6. Any native-build, EAS, backend, or manual-testing follow-up still required.

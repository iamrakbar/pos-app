# POS Feature Gap Analysis and Roadmap

## Executive summary

The app currently implements the core of a lightweight restaurant POS:

- Authentication and token refresh
- Dashboard summary
- POS product browsing and cart
- Dine-in and takeaway checkout
- Cash and electronic payments
- Basic table selection
- Product CRUD
- Order listing, details, and status updates
- Earnings
- Receipt and printer configuration

The included merchant API is considerably broader:

- 104 documented API requests
- 71 generated merchant response types
- 39 generated request types
- 22 endpoint functions currently implemented in the app

This does not mean that exactly 82 features are missing. Multiple requests belong
to one feature, and some workflows need API capabilities that do not exist yet.
It does confirm that the current UI exposes only a small part of an already
available back-office API.

## Unused and partially used API domains

### Unused merchant domains

| Domain         | API readiness | Recommended feature                        |
| -------------- | ------------- | ------------------------------------------ |
| `Area`         | Strong        | Area and table management                  |
| `AddOn`        | Strong        | Product modifier and add-on editor         |
| `Discount`     | Strong        | Automatic product promotions               |
| `Coupon`       | Strong        | Coupon management and checkout application |
| `Staff`        | Strong        | Employee accounts and roles                |
| `Review`       | Strong        | Review moderation                          |
| `Gallery`      | Strong        | Merchant gallery management                |
| `Cancellation` | Strong        | Cancellation approval workflow             |
| `Delivery`     | Moderate      | Dispatch and tracking tools                |
| `Finance`      | Moderate      | Payouts and bank beneficiaries             |
| `Subscription` | Moderate      | Plan and billing management                |
| `Analytics`    | Strong        | Expanded reporting                         |

### Partially implemented domains

- `Category`: list only; CRUD and reorder APIs already exist.
- `Customer`: search only; list and detail APIs exist.
- `Guest`: list only; create and detail APIs exist.
- `Profile`: read only; update, logo, and cover APIs exist.
- `Product`: image deletion and add-on management are missing.
- `Checkout`: generated types support `coupon_codes`, but the checkout schema and
  UI omit them.
- `Auth`: refresh is implemented internally, but profile update, server logout,
  and session validation are incomplete.
- `Pos`: tables are selectable, but there is no operational table-status
  workflow.

## API contract work required first

Several generated fields are effectively untyped:

- Cancellation status: `Array<any>`
- Delivery courier, driver, address, and tracking information: `Array<any>`
- Payout status: `Array<any>`
- Review status: `Array<any>`
- Staff role: `Array<any>`
- Subscription status: `Array<any>`
- Gallery category: `Array<any>`
- Several order-list fields: `Array<any>`

There are also documented endpoints without complete generated types:

- Notifications
- Subscription plans
- Payout balance
- Beneficiary validation metadata
- Possibly pagination envelopes

Before implementing the larger modules:

1. Regenerate types from the current backend OpenAPI specification.
2. Replace `Array<any>` status objects with shared
   `{ value, label, color, ... }` types.
3. Add missing notification, balance, plan, pagination, and disbursement types.
4. Confirm whether image endpoints expect multipart data rather than the
   generated `string`.
5. Add contract fixtures or endpoint tests for each response shape.

Without this work, a screen may compile while still making unsafe assumptions
about production responses.

## Recommended implementation roadmap

### Phase 1: Complete daily restaurant setup

This phase has the highest operational value and the lowest backend risk.

#### 1. Category management

Build:

- Category list with search and active filters
- Create, edit, and delete
- Drag or explicit-button reorder
- Product count
- Active and inactive status
- Deletion conflict handling when products are attached

Products already require categories, but users cannot fully administer them in
the app.

#### 2. Areas and tables

Build:

- Area CRUD
- Table CRUD within an area
- Capacity and active status
- Area-based table list
- Quick access from POS settings
- Clear handling when deleting a table referenced by an order

The API supports configuration, but not a live restaurant floor. Treat this
first version as setup rather than operational table management.

#### 3. Product add-ons

Build add-on management inside each product:

- Add-on group name
- Minimum and maximum selections
- Option names and prices
- Add, update, and remove options
- Validation such as `min <= max`
- Preview of how the modifier appears in POS

The POS already consumes add-ons, making this one of the clearest missing
workflows.

#### 4. Merchant operational settings

Use the profile API to manage:

- Merchant name and contact details
- Address
- Dine-in, takeaway, and delivery availability
- Tax name and percentage
- Payment-fee charging
- Automatic processing of paid orders
- Weekly schedule
- Logo and cover image

This exposes restaurant configuration that currently exists only on the
backend.

### Phase 2: Selling and customer operations

#### 5. Discounts and coupons

Implement discounts first, followed by coupons.

Discounts:

- Fixed or percentage value
- Date range
- Product assignment
- Active status

Coupons:

- Code, type, quota, usage limits, and date range
- Active status
- Checkout coupon entry
- Cart revalidation after adding or removing a coupon
- Display of the discount and final total before payment

The API already supports `coupon_codes`, but the current checkout form omits
them.

#### 6. Customer and guest management

Build:

- Customer list and detail
- Order history
- Search by name, email, and phone
- Guest creation from checkout
- Guest detail
- Clear distinction between merchant guest, registered customer, and walk-in

This can later become the foundation for loyalty and marketing features.

#### 7. Staff management and access control

Build:

- Staff list, detail, create, edit, and delete
- Owner, manager, cashier, waiter, and chef roles
- Role-aware navigation and action visibility
- Fresh authentication for sensitive actions
- Protection against deleting or demoting the last owner

Role enforcement must also exist on the server. Hiding an action in the app is
not a security boundary.

### Phase 3: Order operations

#### 8. Notifications

The Postman collection includes a complete notification workflow:

- List
- Unread count
- Read one or all
- Delete

Use notifications for:

- New orders
- Payment changes
- Cancellation requests
- Delivery events
- Low-stock or account events if exposed later

The generated notification contract appears to be missing and should be
repaired first.

#### 9. Cancellation requests

Build:

- Pending request queue
- Request detail
- Approve or reject with a reason
- Link to the associated order
- Remove from the pending queue only after a successful decision

An unhandled cancellation can create fulfillment and refund problems, making
this an operationally important module.

#### 10. Delivery operations

Build after replacing weak `any` fields:

- Delivery detail
- Dispatch
- Waybill submission
- Tracking timeline
- Tracking refresh
- Redispatch
- Courier and driver information

Delivery operations should be accessible from order details rather than
becoming a disconnected top-level module.

### Phase 4: Owner and growth tools

#### 11. Expanded analytics

Add:

- Date presets and custom ranges
- Orders chart
- Top products
- Revenue by order type
- Payment-method breakdown
- Average order value
- Product performance
- CSV export if the backend supports it

#### 12. Finance and payouts

Build with additional safeguards:

- Available payout balance
- Beneficiary list
- Bank-account validation
- Add and delete beneficiary
- Payout history and detail
- Payout creation with confirmation and fresh authentication

Financial mutations should never show optimistic success before the server
confirms them.

#### 13. Subscription management

Build:

- Current plan
- Days remaining
- Available plans
- Payment history
- Subscribe or renew
- Payment completion flow

Confirm the missing plan type and external payment behavior before
implementation.

#### 14. Reviews and gallery

These are useful back-office modules but are less important to daily POS
operation:

- Review list, details, and moderation
- Gallery list, upload, edit, and delete
- Food and ambience grouping
- Consistent logo, cover, and gallery image behavior

## Suggested navigation

Avoid putting every module in the main drawer.

### Main drawer

- Dashboard
- POS
- Orders
- Products
- Earnings
- Settings

### Products workspace

- Products
- Categories
- Add-ons
- Discounts
- Coupons

### Operations workspace

- Areas and tables
- Customers
- Staff
- Cancellations

### Settings

- Merchant profile
- Taxes and service modes
- Receipt
- Printers
- Subscription
- App updates

### Order details

- Delivery operations
- Cancellation state
- Payment state
- Printing

This preserves the current layout instead of turning the drawer into a long
back-office menu.

## Industry benchmarks

### Closest regional benchmark: Moka POS

Moka is the most useful primary benchmark because it targets Indonesian
merchants and combines restaurant POS, digital payments, table management,
inventory, promotions, employee controls, customer management, and integrated
online orders. Its restaurant offering also includes offline synchronization
and split bills.

References:

- [Moka restaurant POS](https://www.mokapos.com/restoran)
- [Moka POS capabilities](https://www.mokapos.com/point-of-sale)
- [Moka online order management](https://www.mokapos.com/online-order-management)

The practical product target should be:

> Reach Moka-level daily restaurant operations first, then use Toast and Square
> as longer-term restaurant workflow benchmarks.

### Global restaurant benchmarks: Toast and Square

Toast provides a model for an integrated restaurant platform covering POS,
orders, payments, inventory, staff, customers, kitchen operations, and
multi-location management.

- [Toast POS](https://pos.toasttab.com/products/point-of-sale/)

Square is a useful workflow benchmark for:

- Table and seat management
- Floor plans
- Split checks
- Coursing
- Kitchen displays
- Customer profiles
- Online and delivery orders
- Offline payments
- Staff and inventory management

References:

- [Square for Restaurants](https://squareup.com/us/en/point-of-sale/restaurants)
- [Square restaurant capabilities](https://squareup.com/us/en/restaurants/capabilities?section=keep-business-flowing)

## Gaps the current API cannot close

These areas need backend and product design rather than only new React Native
screens.

### Critical restaurant workflows

- Open checks or saved bills
- Add items to an existing table order
- Transfer or merge tables
- Split bills by item, seat, amount, or payer
- Multiple payment methods on one bill
- Partial payments, deposits, and tips
- Refunds, voids, comps, and manager approval
- Cash-drawer sessions and end-of-day reconciliation
- Table occupancy and elapsed dining time
- Reservations and waitlist
- Seat-level ordering
- Course firing

Moka and Square treat saved bills, split bills, and operational table
management as core restaurant capabilities:

- [Moka POS](https://www.mokapos.com/point-of-sale)
- [Square table management](https://squareup.com/au/en/point-of-sale/restaurants/features/table-management-system)

### Kitchen operations

- Kitchen display system
- Printer routing by category or station
- Ticket timers
- Bump and recall
- Preparation statuses
- Course sequencing
- Kitchen capacity indicators

Toast describes real-time POS-to-kitchen ticket flow and station-specific
displays as central high-volume restaurant capabilities:

- [Toast Kitchen Display System](https://pos.toasttab.com/hardware/kitchen-display-system)

### Inventory

Current stock management covers finished-product quantity only. An
industry-grade restaurant system eventually needs:

- Ingredients
- Recipes and yields
- Automatic ingredient depletion
- Units and conversions
- Stock adjustments and history
- Waste and spoilage
- Suppliers
- Purchase orders
- Receiving
- Stock transfers
- Par levels
- Cost of goods sold and menu margin

Toast and Square's restaurant inventory offerings include recipes, purchasing,
suppliers, waste, and actual-versus-theoretical usage:

- [Toast Inventory](https://pos.toasttab.com/products/inventory-management)
- [Square Restaurant Inventory](https://squareup.com/us/en/inventory-management/restaurants)

### Reliability

- Offline order and mutation queue
- Persisted React Query cache
- Conflict resolution after reconnection
- Idempotency keys for checkout
- Device and session registration
- Real-time order updates
- Push notifications
- Audit logs
- Crash and operational telemetry
- Remote printer health

The app currently detects network errors and shows an offline banner, but it
cannot safely sell offline. That distinction should be explicit to users.

### Commercial capabilities

- Loyalty points
- Gift cards or store credit
- Customer marketing and segmentation
- Multi-location catalog and reporting
- Shift scheduling and time clock
- Payroll integrations
- Reservations
- Online and self-service ordering
- QR ordering tied to tables
- Customer-facing display
- Integrated card terminal
- Barcode scanning

## Milestone 1: Self-service restaurant administration

**Status:** In progress

This milestone uses mature existing endpoints, removes the largest
administration gaps, and makes the current POS meaningfully self-service
without depending on major backend redesign.

Checklist rules:

- Mark implementation items complete only after the code is present.
- Mark validation items complete only after the named check passes.
- A task is complete only when all implementation and validation items are
  checked.
- Backend-blocked behavior remains unchecked and must include a short blocker
  note.

### Task 1: Category CRUD and reorder

**Status:** In progress

API and data:

- [x] Add typed list parameters for search, active status, sorting, and page
      size.
- [x] Add typed get, create, update, delete, and bulk reorder endpoint
      functions.
- [x] Preserve the lightweight active-category query used by POS and product
      forms.
- [x] Add management queries and mutations with consistent cache
      invalidation.
- [x] Add a category form schema matching the generated request contract.

Routes and UI:

- [x] Add category list and category form routes under the Products stack.
- [x] Add a category management entry point from the Products screen.
- [x] Keep category management out of the global sidebar and expose it through
      a clearly labeled Categories menu in the existing Products toolbar.
- [x] Support search and active/inactive filtering.
- [x] Show product count, position, and active status.
- [x] Support create and edit with field-level API validation errors.
- [x] Support delete with explicit confirmation and server conflict errors.
- [x] Support accessible move-up and move-down reordering with an explicit
      save action.
- [x] Provide loading, empty, error, retry, and mutation-pending states.

Validation:

- [x] TypeScript passes.
- [x] ESLint passes for changed category files.
- [x] Android Expo/Metro export resolves all new routes and imports.
- [x] React Doctor full scan remains at 100/100 with `vendor/**` excluded.
- [ ] Manual API smoke test passes against an authenticated merchant account.

Manual test blocker: this requires a reachable API, an authenticated merchant
account, and disposable category data. Keep the task in progress until create,
edit, reorder, and delete have been exercised safely against that account.

Contract note: the Postman documentation mentions `parent_id`, but the current
generated category request and response types do not expose hierarchy. This
milestone implements a flat category manager until the generated contract
supports parent categories.

### Task 2: Area and table CRUD

**Status:** Not started

API and data:

- [ ] Add typed area list, detail, create, update, and delete endpoints.
- [ ] Add typed nested table list, create, update, and delete endpoints.
- [ ] Add area and table query-key factories and cache invalidation.
- [ ] Preserve the flat POS table query used by checkout.
- [ ] Add area and table form schemas.

Routes and UI:

- [ ] Add area list, area form, and nested table management routes.
- [ ] Add an Areas and Tables entry point under operational settings.
- [ ] Show table count per area.
- [ ] Support table name, capacity, and active status.
- [ ] Handle deletion conflicts and referenced-table errors clearly.
- [ ] Provide loading, empty, error, retry, and pending states.

Validation:

- [ ] TypeScript passes.
- [ ] ESLint passes for changed area and table files.
- [ ] Android Expo/Metro export passes.
- [ ] React Doctor remains at 100/100 with `vendor/**` excluded.
- [ ] Manual CRUD smoke test passes against an authenticated merchant.
- [ ] Checkout still lists active POS tables grouped by area.

### Task 3: Product add-on CRUD

**Status:** Not started

API and data:

- [ ] Add typed list, detail, create, update, and delete endpoints scoped to a
      product.
- [ ] Add product add-on queries and mutations.
- [ ] Invalidate management-product and POS-product caches after mutations.
- [ ] Add schemas for add-on groups and options.
- [ ] Validate `min <= max` and ensure selection limits are compatible with
      available options.

Routes and UI:

- [ ] Add an add-on management section to product detail/edit.
- [ ] Support group name, minimum, maximum, option name, and option price.
- [ ] Support adding, editing, removing, and restoring option rows before save.
- [ ] Add destructive confirmation for deleting an add-on group.
- [ ] Preview how the group appears to the cashier.
- [ ] Provide loading, empty, error, retry, and pending states.

Validation:

- [ ] TypeScript passes.
- [ ] ESLint passes for changed add-on files.
- [ ] Android Expo/Metro export passes.
- [ ] React Doctor remains at 100/100 with `vendor/**` excluded.
- [ ] Manual CRUD smoke test passes.
- [ ] POS selection rules and prices match the saved add-on configuration.

### Task 4: Merchant operational settings

**Status:** Not started

API and data:

- [ ] Add profile update, logo upload, and cover upload endpoints.
- [ ] Add a profile mutation with cache synchronization.
- [ ] Add schemas for business details, address, service modes, taxes, payment
      fees, and schedule.
- [ ] Add explicit mapping between the request schedule array and response
      schedule record.

Routes and UI:

- [ ] Add business-details and operational-settings screens.
- [ ] Support merchant contact details and address.
- [ ] Support dine-in, takeaway, and delivery toggles.
- [ ] Support tax enablement, label, and percentage.
- [ ] Support payment-fee charging and paid-order auto-processing.
- [ ] Support weekly opening hours.
- [ ] Support logo and cover selection, optimization, upload, and preview.
- [ ] Provide loading, error, retry, validation, and pending states.

Validation:

- [ ] TypeScript passes.
- [ ] ESLint passes for changed merchant-setting files.
- [ ] Android Expo/Metro export passes.
- [ ] React Doctor remains at 100/100 with `vendor/**` excluded.
- [ ] Manual profile update and image upload smoke tests pass.
- [ ] Receipt defaults and POS service modes reflect updated merchant data.

### Task 5: Coupon application during checkout

**Status:** Not started

API and data:

- [ ] Add coupon codes to the checkout and cart-validation schemas.
- [ ] Preserve server-calculated discount, fee, and total values.
- [ ] Define behavior for invalid, expired, exhausted, and inapplicable
      coupons.
- [ ] Revalidate the cart whenever a coupon is added or removed.

Routes and UI:

- [ ] Add coupon entry and applied-coupon display to checkout.
- [ ] Show validation progress and field-level server errors.
- [ ] Show coupon discount in the cost summary before payment.
- [ ] Allow an applied coupon to be removed.
- [ ] Prevent duplicate coupon codes.
- [ ] Preserve applied coupons across non-destructive checkout field changes.

Validation:

- [ ] TypeScript passes.
- [ ] ESLint passes for changed checkout files.
- [ ] Android Expo/Metro export passes.
- [ ] React Doctor remains at 100/100 with `vendor/**` excluded.
- [ ] Manual valid, invalid, expired, and removed-coupon smoke tests pass.
- [ ] Cash sufficiency and payment totals use the server-confirmed final total.

### Task 6: Staff role-aware navigation

**Status:** Not started

API and data:

- [ ] Add typed staff list, detail, create, update, and delete endpoints.
- [ ] Add staff queries and mutations.
- [ ] Add staff form validation for owner, manager, cashier, waiter, and chef.
- [ ] Define a centralized role-capability matrix.
- [ ] Confirm server authorization for every protected mutation.

Routes and UI:

- [ ] Add staff list and staff form routes.
- [ ] Add role-aware visibility for navigation and sensitive actions.
- [ ] Prevent deleting or demoting the last owner.
- [ ] Require confirmation and fresh authentication for destructive role
      changes.
- [ ] Display server authorization failures clearly.
- [ ] Provide loading, empty, error, retry, and pending states.

Validation:

- [ ] TypeScript passes.
- [ ] ESLint passes for changed staff files.
- [ ] Android Expo/Metro export passes.
- [ ] React Doctor remains at 100/100 with `vendor/**` excluded.
- [ ] Manual role-by-role navigation checks pass.
- [ ] Manual server-authorization checks confirm hidden actions cannot be
      called by unauthorized roles.

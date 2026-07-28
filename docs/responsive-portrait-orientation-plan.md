# Responsive Portrait Orientation Plan

## Objective

Make the application responsive across portrait and landscape orientations without compromising
the existing tablet-oriented POS workflow.

The work must support:

- Phones and tablets in portrait and landscape.
- Android multi-window and iPad split view.
- Runtime rotation without losing cart, checkout, form, or navigation state.
- HeroUI Native and HeroUI Native Pro component patterns.
- Consistent spacing, typography, surfaces, actions, and accessibility.

This document is an implementation plan. It does not include responsive code changes.

## Current-State Findings

### Native orientation is locked

`app.config.js` currently contains:

```js
orientation: "landscape";
```

Changing this to `"default"` affects native configuration and requires new iOS and Android builds.
It cannot be delivered only through an EAS Update.

### POS assumes a permanent landscape split

`src/screens/pos/index.tsx` always renders:

```text
Product catalog | Cart panel
```

The cart receives one-third of the total viewport width. This is not suitable for portrait phones
and is cramped on portrait tablets.

### Product grid uses global window measurements

`src/screens/pos/components/product-grid.tsx` calculates its width by subtracting the expected cart
width from the full window. It should calculate columns from the measured width of its actual
container.

### POS overlays need compact variants

The add-on, checkout, payment, and table-selection dialogs use screen-percentage sizing designed
primarily for landscape tablets. Their bodies, footers, grids, and keyboard behavior need compact
layouts.

### Most CRUD screens already have a suitable foundation

Product, category, area, table, printer, order, and add-on screens generally use:

- Vertically scrolling content.
- Full-width containers.
- Constrained `max-w-3xl` forms.
- Stack navigation headers.

These screens need targeted responsive cleanup rather than structural rewrites.

### Some dashboards and controls have restrictive widths

Dashboard and earnings widgets use minimum widths such as `min-w-[220px]`. These can overflow
narrow screens after accounting for gaps and page padding.

### Receipt setup already has a useful breakpoint

Receipt setup switches between single- and two-column layouts at `900px`. This is a useful starting
pattern, although compact height, keyboard, and preview overflow still require validation.

## Responsive Layout Model

Use usable content width as the primary decision input:

| Layout  | Usable width | Typical devices                             |
| ------- | -----------: | ------------------------------------------- |
| Compact |      `< 600` | Phones and narrow split-screen windows      |
| Medium  |    `600–899` | Portrait tablets and large phones           |
| Wide    |     `>= 900` | Landscape tablets and desktop-sized windows |

Orientation can be exposed as supplementary information:

```ts
const isPortrait = height > width;
```

Width-based decisions are required because orientation alone does not describe Android
multi-window, iPad split view, or foldable device layouts.

## Shared Responsive Foundation

Introduce a shared hook such as `useResponsiveLayout()` that returns:

```ts
{
  width,
  height,
  isCompact,
  isMedium,
  isWide,
  isPortrait,
  horizontalPagePadding,
}
```

Guidelines:

- Derive values directly from `useWindowDimensions`.
- Do not store orientation-derived state that can become stale.
- Use container measurement when a child occupies only part of the screen.
- Centralize route, form-sheet, and remaining dialog safe-area calculations.
- Keep breakpoint names semantic and avoid device-specific names.
- Avoid over-abstracting ordinary one-column screen content.

Suggested responsive spacing:

| Context                 | Compact | Medium/Wide |
| ----------------------- | ------- | ----------- |
| Page horizontal padding | 16px    | 20–24px     |
| Modal body padding      | 12–16px | 16–20px     |
| Grid gap                | 8–12px  | 12–16px     |
| Section gap             | 16px    | 20–24px     |

## Target POS Layouts

### Wide

Keep the existing two-column workflow:

```text
┌───────────────────────────────┬──────────────────┐
│ Search and product catalog    │ Cart             │
│                               │                  │
│ Product grid                  │ Items and total  │
└───────────────────────────────┴──────────────────┘
```

Improvements:

- Clamp cart width rather than always using one-third of the viewport.
- Suggested cart width:

  ```ts
  Math.min(Math.max(viewportWidth * 0.34, 340), 460);
  ```

- Measure the catalog container for grid-column calculations.
- Maintain current fast product-to-cart workflow.

### Compact and medium

Use a single product-catalog view with a fixed floating cart button:

```text
┌───────────────────────────────────┐
│ Menu  Search            Filters   │
│ Category chips                    │
│                                   │
│ Product grid                      │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ Cart · 4 items       Rp120.000│ │
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
```

Behavior:

- Use a regular HeroUI `Button`, not a FAB.
- Position it above the bottom safe-area inset without affecting product-grid layout.
- Show a cart icon, `Cart · {count} items`, and the subtotal.
- Cap the displayed count at `99+`.
- Use full available width with 16px side insets on compact screens.
- Constrain and center the button on medium screens.
- Show it when the cart contains items; visibility and count changes must not shift surrounding
  content.
- Add equivalent bottom padding to the product list so the button never covers the final row.
- Pressing the button navigates to `/pos/cart`.
- Preserve cart data in Zustand while switching layouts or rotating.
- Continue checkout from the cart screen.
- Do not mount `CartPanel` in compact or medium layouts.
- Do not mount the floating cart button in the wide layout.
- Do not mount separate independent cart state for each layout.

This follows the design-system principle of replacing persistent side panels on small and medium
viewports with progressive disclosure.

## Expo Router Presentation Architecture

Use Expo Router routes for substantial POS workflows instead of controlling them through a single
modal state value.

Proposed routes:

```text
src/app/(app)/pos/
├── _layout.tsx
├── index.tsx
├── cart.tsx
├── checkout.tsx
├── payment.tsx
├── add-ons.tsx
├── table-selection.tsx
└── payment-success.tsx
```

Route files must remain thin and render screen components from `src/screens/pos`. Components,
business logic, types, and utilities must not be placed in the route directory.

Recommended presentation:

| Workflow        | Compact/medium               | Wide                                         |
| --------------- | ---------------------------- | -------------------------------------------- |
| Cart            | `card` screen                | Persistent inline panel; route is a fallback |
| Checkout        | `card` screen                | `formSheet` at `[0.9, 1]`                    |
| Payment         | `card` screen                | `formSheet` or `modal`                       |
| Add-ons         | `formSheet` at `[0.75, 1]`   | `formSheet`                                  |
| Table selection | `formSheet` at `[0.65, 0.9]` | `formSheet`                                  |
| Payment success | `card` screen                | `card` screen                                |

The POS `_layout.tsx` can select route options from `useWindowDimensions`. Presentation is selected
when a route opens. Do not remount or key the entire navigator during rotation to force an already
open route to transform from a card into a sheet.

If dynamic native presentation proves inconsistent during device testing, create paired thin route
wrappers such as `checkout.tsx` and `checkout-sheet.tsx`. Both wrappers must render the same shared
`CheckoutContent`; responsive navigation chooses the route without duplicating workflow logic.

Form-sheet requirements:

- Use numeric detents rather than `fitToContents` for scrollable or `flex: 1` content.
- Use no more than three detents because Android supports a maximum of three.
- Render titles, close actions, and footers inside form-sheet content because Android does not
  support native stack headers within form sheets.
- Keep the sheet root at `flex: 1`.
- Keep primary actions reachable at every allowed detent.
- Guard or disable dismissal while a payment submission is in progress or a dirty workflow requires
  confirmation.
- Use route parameters only for identifiers such as product ID or cart-item ID. Keep mutable cart and
  checkout state in the existing stores or form state.

## Implementation Phases

### Phase 1: Responsive foundation

Tasks:

- Add the shared responsive hook.
- Define compact, medium, and wide thresholds.
- Add shared responsive route, form-sheet, and dialog dimension helpers.
- Establish constrained page-container conventions.
- Ensure responsive values update during rotation and window resizing.
- Audit safe-area behavior in headerless screens.

Do not unlock native orientation during this phase.

### Responsive Mounting Rules

Responsive variants that are not visible must not remain mounted.

Use conditional composition:

```tsx
{
  isWide ? <CartPanel /> : <FloatingCartButton />;
}
```

Do not render both variants and hide one using `display: "none"`, opacity, absolute off-screen
positioning, or equivalent utility classes.

Requirements:

- Hidden responsive variants must not execute hooks, queries, subscriptions, calculations, or
  effects.
- The compact cart route must mount only after navigation to `/pos/cart`.
- Cart data remains independent of presentation in the shared Zustand store.
- Shared presentation components may be imported in both paths, but only the active path is
  rendered.
- Route screens retained in the navigation stack must use focus-aware effects for polling or other
  active-only work.
- Payment polling must stop or pause when its route is unfocused.
- Rotation must switch responsive variants without duplicating subscriptions or losing store-backed
  state.

### Phase 2: POS shell

Files:

- `src/screens/pos/index.tsx`
- `src/screens/pos/components/product-grid.tsx`
- `src/screens/pos/components/search-bar.tsx`
- `src/screens/pos/components/cart-panel.tsx`
- `src/app/(app)/pos/cart.tsx`

Tasks:

- Switch between split and single-pane layouts at the wide breakpoint.
- Conditionally mount `CartPanel` only in the wide branch.
- Conditionally mount the floating cart button only in the compact/medium branch.
- Measure the product-grid container with `onLayout`.
- Allow one grid column on narrow screens rather than forcing at least two.
- Recalculate columns without unstable keys or visible layout jumping.
- Extract shared `CartContent` used by the wide cart panel and compact cart screen.
- Add the fixed floating cart button containing icon, item count, and subtotal.
- Navigate the floating button to `/pos/cart`.
- Add a responsive bottom content inset to the product grid.
- Keep the button outside product-list layout flow so count and visibility changes cannot shift the
  grid.
- Allow cart-header controls to wrap or move to a second row.
- Keep order type, table, and time labels at `text-sm`.
- Stack footer actions if horizontal space is insufficient.
- Preserve scroll position and cart state during rotation.
- Validate popovers near all screen edges.

### Phase 3: Routed POS workflows and sheets

Files:

- `src/app/(app)/pos/_layout.tsx`
- `src/app/(app)/pos/checkout.tsx`
- `src/app/(app)/pos/payment.tsx`
- `src/app/(app)/pos/add-ons.tsx`
- `src/app/(app)/pos/table-selection.tsx`
- `src/screens/pos/components/modals/add-on-modal.tsx`
- `src/screens/pos/components/modals/checkout-modal.tsx`
- `src/screens/pos/components/modals/payment-modal.tsx`
- `src/screens/pos/components/modals/table-selection-modal.tsx`
- `src/screens/pos/components/checkout-content.tsx`
- `src/screens/pos/components/payment-content.tsx`

Tasks:

- Move cart, checkout, payment, add-ons, and table selection into Expo Router routes.
- Replace store-controlled modal presentation with route navigation while retaining domain state in
  stores.
- Configure responsive `card`, `formSheet`, and `modal` presentations in the POS stack.
- Extract shared content before removing old modal wrappers.
- Remove old route or modal wrappers after all callers use the new navigation flow.
- Standardize routed headers, scrollable bodies, footers, width, and height.
- Use normal full-screen routes for compact checkout and payment.
- Respect top, bottom, and keyboard safe areas.
- Keep route and sheet footers visible while bodies scroll.
- Preserve constrained sheets on wide screens.
- Stack checkout fields that currently rely on horizontal rows.
- Switch QR payment from horizontal to vertical below the wide breakpoint.
- Scale QR codes from available width instead of fixed `256×256` boxes.
- Calculate table-card columns from modal content width.
- Use one or two table columns on compact widths.
- Use two or three columns on medium widths.
- Use three or four columns on wide widths.
- Stack footer actions on narrow devices.
- Re-test TimePicker, Select, DatePicker, and scroll gestures after rotation.
- Verify Android back navigation and sheet dismissal guards.
- Verify deep linking and direct route restoration when transient state is unavailable.

### Phase 4: Dashboard and earnings

Files:

- `src/screens/dashboard/index.tsx`
- `src/screens/earnings/index.tsx`

Tasks:

- Stack page headers on compact widths.
- Move date-range and POS actions to a dedicated responsive control row.
- Display summary widgets as:
  - One column on compact screens.
  - Two columns on medium screens.
  - Up to four columns on wide screens.
- Remove minimum widths that exceed compact content width.
- Give charts explicit responsive heights.
- Verify chart labels and legends on narrow widths.
- Make period chips horizontally scrollable when they cannot fit.
- Preserve `tabular-nums` on financial and statistical values.

### Phase 5: Navigation and application chrome

Tasks:

- Keep the app drawer as an overlay on compact and medium screens.
- Constrain the drawer width.
- Confirm every top-level destination exposes a drawer menu button.
- Audit safe-area handling on:
  - Dashboard.
  - POS.
  - Cart.
  - Checkout.
  - Payment.
  - Payment success.
- Ensure offline and update banners do not cover headers or modal controls.
- Verify rotation while the drawer is open.
- Verify drawer gestures do not compete with form sheets or horizontal chip scrollers.

The existing stack-based navigation for nested CRUD screens can remain.

### Phase 6: Forms, lists, and detail screens

| Area                                          | Required work                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Products, categories, areas, tables, printers | Verify trailing controls, long labels, and row wrapping                |
| Product and add-on forms                      | Stack action rows and paired fields on compact screens                 |
| Printer form                                  | Stack diagnostic and action rows; verify device list widths            |
| Order detail                                  | Wrap summary rows and prevent totals/status chips from colliding       |
| Settings                                      | Replace fixed label widths such as `w-36` with responsive alternatives |
| Sign-in                                       | Support short screen heights and keyboard-visible layouts              |
| Payment success                               | Stack footer actions on compact widths                                 |
| Confirmation dialogs                          | Apply responsive margins and stack actions when necessary              |

List rows should retain consistent heights and alignment. Supplementary metadata may wrap or be
de-emphasized, but primary identity and actions must remain visible.

### Phase 7: Receipt setup

Tasks:

- Preserve the existing wide two-pane layout.
- Use a single-column flow below `900px`.
- In portrait and other single-column layouts, render the receipt preview first and the receipt form
  below it.
- Keep the visual order and accessibility traversal order identical; do not rely only on
  `flex-col-reverse`.
- Extract reusable `ReceiptPreview` and `ReceiptSettingsForm` sections if needed so each layout can
  compose them in the correct order without duplicating their logic.
- Keep both receipt sections mounted because both are visible in the single-column layout.
- Ensure both form and preview remain reachable.
- Avoid competing independently constrained vertical scroll regions on short screens.
- Scale the preview or allow horizontal scrolling when thermal-paper width exceeds the container.
- Ensure keyboard opening does not hide the form footer or permanently collapse the preview.

### Phase 8: Unlock native orientation

After the responsive screens pass validation, change:

```js
orientation: "default";
```

Then:

- Regenerate native configuration where required.
- Build new iOS and Android development clients.
- Validate supported orientation declarations.
- Produce new EAS preview and production binaries.
- Use EAS Update for later JavaScript-only responsive fixes.

## HeroUI Design Standards

Implementation must follow these rules:

- Use HeroUI Native and HeroUI Native Pro compound-component APIs.
- Verify component APIs against current HeroUI documentation before implementation.
- Prefer semantic variants and tokens over raw colors.
- Preserve default control sizing rather than shrinking text to force content to fit.
- Reflow content when space is constrained.
- Maintain one clear primary action per modal or form footer.
- Use outline or ghost variants for secondary actions.
- Keep chips content-sized and horizontally scroll them when necessary.
- Avoid unnecessary borders where surfaces and spacing already define hierarchy.
- Preserve `tabular-nums` for prices, totals, quantities, and statistics.
- Maintain 44–48px minimum touch targets.
- Avoid layout shifts when orientation or selected state changes.
- Use Expo Router `formSheet` for routed sheets, HeroUI `Dialog` for short confirmations, and
  built-in Card, Chip, Select, DatePicker, TimePicker, and related components instead of
  reimplementing standard interactions.
- Ensure icon-only controls have accessibility labels and discoverable behavior.

## State and Rotation Requirements

Rotation must not reset:

- Cart products and quantities.
- Order type, table, and pickup time.
- Checkout customer and payment selections.
- Open form data.
- Selected filters and sort.
- Selected dashboard period.
- Receipt settings.

Transient presentation state may close during rotation only if the underlying native component
cannot reposition safely. Pushed routes must remain mounted. Preferred behavior is to keep sheets
open and allow popovers to remeasure or close predictably without losing selection.

## Validation Matrix

Test at minimum:

| Device class                   | Portrait | Landscape |
| ------------------------------ | -------: | --------: |
| Small phone: 360×800           | Required |  Required |
| Large phone: 430×932           | Required |  Required |
| Small tablet: 600×960          | Required |  Required |
| Standard tablet: 800×1280      | Required |  Required |
| Large tablet: 1024×1366        | Required |  Required |
| Split-screen around 500px wide | Required |       N/A |

For each size:

- Rotate with an empty cart.
- Rotate with multiple cart items and add-ons.
- Rotate while every POS route and form sheet is open.
- Rotate with the keyboard open.
- Verify the floating cart button at every safe-area configuration.
- Verify the final product-grid row is never covered by the floating cart button.
- Verify `CartPanel` hooks and subscriptions are not active below the wide breakpoint.
- Verify the floating cart button is not mounted in the wide layout.
- Verify receipt preview appears before the settings form in portrait accessibility and visual
  order.
- Open the drawer, Select, TimePicker, DatePicker, and table selector.
- Test long product, category, table, and customer names.
- Test loading, error, empty, and populated states.
- Test large cart quantities and long add-on descriptions.
- Test font scaling at 100%, 130%, and 150%.
- Verify no unintended horizontal clipping.
- Verify every intended scroll area responds to touch.
- Verify all primary actions remain visible or reachable.
- Verify safe-area padding on devices with cutouts and gesture navigation.

## Automated and Build Validation

Run after each implementation phase:

```bash
npm run typecheck
npm run lint
npx react-doctor@latest --verbose --scope changed
npx expo-doctor
```

Before unlocking orientation:

```bash
npx expo export --platform android
npx expo export --platform ios
```

After changing native orientation configuration:

```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

Complete preview builds after the development-client test matrix passes.

## Recommended Execution Order

1. Responsive hook and shared route/sheet sizing.
2. POS single-pane layout and fixed floating cart button.
3. Product-grid container measurement and bottom inset.
4. Cart route and shared cart content.
5. Checkout, payment, table, and add-on routes.
6. Expo Router responsive card/form-sheet presentation.
7. Dashboard and earnings.
8. Navigation, forms, settings, order detail, and payment success.
9. Receipt setup and preview.
10. Native orientation unlock.
11. Full device matrix.
12. EAS development, preview, and production builds.

The POS and all routed workflows must be responsive before changing the native orientation setting.
Otherwise portrait orientation would become available before the application's primary workflow is
usable.

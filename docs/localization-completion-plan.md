# Localization Completion Plan

## Objective

Complete the English and Indonesian translations across the application without changing
product behavior or redesigning the affected screens.

The finished application should:

- Show the selected language consistently across screens, dialogs, sheets, validation
  messages, toasts, receipts, and accessibility labels.
- Format dates and numbers with the active locale while preserving IDR as the application's
  currency.
- Keep server-provided names and messages intact unless the application supplies a local
  fallback.
- Prevent new hardcoded user-facing strings from being introduced.

## Current Baseline

The existing locale catalogs are structurally synchronized:

- `src/locales/en.ts`: 71 entries.
- `src/locales/id.ts`: 71 entries.
- Both catalogs conform to the same `TranslationSchema`.

However, the catalogs cover only a small part of the interface. The audit found:

- Approximately 330 directly rendered text literals across 35 UI files.
- 18 hardcoded validation messages.
- 33 hardcoded toast messages.
- 12 local error and fallback messages.
- More than 400 user-visible strings in total when repeated labels, receipt text, status
  labels, and accessibility text are included.
- Only about 15 UI files currently call `useTranslation`.

These counts are a lower bound. Text assembled dynamically or passed through helper functions
may not be detected by a simple source scan.

## Highest-Priority Areas

| Area             | Main gaps                                                       | Relative effort |
| ---------------- | --------------------------------------------------------------- | --------------- |
| Product form     | Field labels, helper text, add-on controls, actions, validation | High            |
| Printer form     | Connection settings, receipt settings, prompts, errors          | High            |
| Earnings         | Date controls, summaries, empty states, chart context           | Medium          |
| Order detail     | Status, payment, customer, receipt, actions                     | Medium          |
| Receipt settings | Preview controls, layout options, helper text                   | Medium          |
| Checkout         | Customer fields, notes, payment, progress and error states      | Medium          |
| Dashboard        | Date-range text, metrics, contextual descriptions               | Medium          |
| Product list     | Filters, empty states, actions, toasts                          | Medium          |
| Category form    | Form labels, validation, destructive actions                    | Low             |
| App updates      | Availability, progress, failure and restart messages            | Low             |
| Areas and tables | Forms, dialogs, card actions and empty states                   | Low             |

## Localization Principles

### Translate at the presentation boundary

Business and API layers should return stable semantic values such as `processing` or
`cancelled`. Screens and receipt builders should translate those values when presenting them.
This prevents translated labels from becoming application state.

### Keep both catalogs complete

Every new key must be added to English and Indonesian in the same change. The schema should
continue to make a missing entry a type error.

### Do not translate server-owned content

Product names, customer names, merchant names, API error details, and other content authored
outside the app should be shown as received. Only app-owned labels and local fallback messages
belong in the catalogs.

### Preserve meaning, not word order

Use interpolation for values embedded in sentences. Do not build translated sentences by
joining several fragments because English and Indonesian may require different word order.

### Treat accessibility text as user-facing text

Screen-reader labels, hints, image descriptions, and action names must use the same
localization system as visible copy.

## Key Organization

Group translation keys by feature and purpose:

```text
common.*
auth.*
dashboard.*
earnings.*
orders.*
orderStatus.*
pos.*
checkout.*
payment.*
products.*
categories.*
addOns.*
areas.*
tables.*
printers.*
receipt.*
settings.*
updates.*
validation.*
accessibility.*
```

Prefer specific keys such as `checkout.submitOrder` over generic numbered keys or keys copied
from the full English sentence. Shared labels such as Save, Cancel, Delete, Retry, and Search
should live under `common`.

## Implementation Phases

### Phase 1: Strengthen the localization foundation

1. Export a `TranslationKey` type derived from `TranslationSchema`.
2. Update the translation function to accept only valid keys.
3. Add a locale-tag helper that maps the active app language to `en-US` or `id-ID`.
4. Define the pluralization approach:
   - Prefer singular and plural keys initially if the existing translator cannot select
     plural forms.
   - Consider adding `Intl.PluralRules` only if multiple features need more complex forms.
5. Add development-safe handling for an unknown key while keeping production output readable.

Outcome: invalid or missing translation keys are caught during development instead of reaching
users.

### Phase 2: Translate shared language and semantic statuses

1. Add common actions, loading states, empty states, confirmation language, and generic errors.
2. Replace hardcoded order labels in `src/api/mappers/order.ts` with semantic status codes.
3. Translate order and payment statuses in screens and receipt generation.
4. Localize shared toast and dialog copy.
5. Localize shared accessibility labels and hints.

Outcome: repeated language is translated once and reused consistently throughout the app.

### Phase 3: Translate critical POS flows

Apply translations in this order:

1. POS product browsing and cart.
2. Add-on selection.
3. Table and area selection.
4. Checkout sheet.
5. Payment and payment-success views.
6. Receipt content and printing prompts.

Include all intermediate states:

- Empty and unavailable content.
- Checkout processing.
- Validation failures.
- Payment waiting, success, and failure.
- Retry and dismissal actions.
- Swipe-button labels and accessibility instructions.

Outcome: a cashier can complete an order without encountering mixed English and Indonesian
interface text.

### Phase 4: Translate management and reporting screens

Work through the remaining high-volume screens:

1. Product list and product form.
2. Categories and add-on management.
3. Areas and tables.
4. Printer list and printer form.
5. Receipt settings.
6. Orders and order detail.
7. Dashboard.
8. Earnings.
9. Settings, navigation, authentication, and app-update UI.

Translate by complete workflow rather than replacing isolated labels. Each screen change should
include its form, validation, dialogs, toasts, empty states, loading states, and error states.

Outcome: switching language affects every app-owned part of each completed workflow.

### Phase 5: Make validation locale-aware

The current schemas contain both English and Indonesian messages at module scope. Replace
static translated schemas with schema factories:

```ts
function createCheckoutSchema(t: Translate) {
  return z.object({
    // Localized validation messages use t(...)
  });
}
```

Apply this pattern to:

- Checkout validation.
- Product validation.
- Add-on management validation.
- Printer validation.
- Authentication and other form schemas containing visible messages.

Create or memoize the schema inside the component using the active translation function so
changing language refreshes validation copy. Memoization should only be used if required by the
form integration or measured behavior.

Outcome: validation messages follow the currently selected language, including after a
language change.

### Phase 6: Normalize locale-sensitive formatting

Replace forced UI locale tags in dashboard, earnings, orders, payment success, and receipt
helpers with the active locale tag.

Rules:

- Dates and times use the selected app locale.
- Calendar and date-picker controls use the selected app locale.
- IDR remains the currency regardless of interface language.
- Currency formatting may use the active locale with `currency: "IDR"` when the result remains
  clear and consistent with the product's requirements.
- Stored dates, API payloads, IDs, and machine-readable values must not be localized.

Outcome: English mode no longer shows Indonesian date wording solely because `id-ID` was
hardcoded, while monetary values remain Rupiah.

### Phase 7: Add regression protection

Add an automated localization check that:

1. Confirms English and Indonesian have identical key sets.
2. Fails on invalid translation keys.
3. Detects likely hardcoded JSX text and common user-facing props.
4. Scans toast, dialog, validation, placeholder, accessibility, and receipt strings.
5. Supports a small documented allowlist for identifiers, brand names, symbols, and test
   fixtures.

Run the check in the normal lint or CI workflow. The detector should report actionable file and
line information rather than rewriting source automatically.

Outcome: new untranslated interface text is caught during development.

## Detailed Audit Targets

The following files and patterns require explicit review during implementation:

- `src/screens/products/form/index.tsx`
- `src/screens/settings/printers/form/index.tsx`
- `src/screens/earnings/index.tsx`
- `src/screens/orders/detail/index.tsx`
- `src/screens/settings/receipt/index.tsx`
- `src/screens/pos/components/checkout-content.tsx`
- `src/screens/dashboard/index.tsx`
- `src/screens/products/index.tsx`
- `src/screens/categories/form/index.tsx`
- App-update manager messages.
- Payment-success messages and receipt actions.
- Add-on selection cards and add-on management forms.
- Area and table forms, dialogs, cards, and empty states.
- `src/api/mappers/order.ts` status labels.
- Receipt-data builders containing Store, Order, Date, Type, Table, Payment, Payment Status,
  Note, Subtotal, Total, item, and quantity labels.
- All `toLocaleDateString`, `toLocaleTimeString`, `Intl.DateTimeFormat`, and date-picker locale
  usages containing a literal `id-ID` or `en-US`.

## Verification

For each completed phase:

1. Run TypeScript and lint checks.
2. Run the localization catalog parity check.
3. Search the changed feature for remaining user-visible literals.
4. Test the complete workflow in English.
5. Switch to Indonesian without restarting and repeat the workflow.
6. Confirm existing validation errors update or are cleared appropriately after switching.
7. Test compact portrait, tablet portrait, and landscape layouts where the feature has
   responsive overlays.
8. Verify long Indonesian and English labels do not clip, overlap, or hide actions.
9. Verify screen-reader labels in both languages.
10. Confirm API-provided content and persisted values have not been translated or mutated.

Run the project's full React checks after the implementation changes, not for this
documentation-only plan.

## Definition of Done

Localization is complete when:

- English and Indonesian catalogs contain the same keys.
- No app-owned user-facing string remains hardcoded outside an approved allowlist.
- Every form validation message follows the active language.
- Toasts, dialogs, sheets, receipts, loading states, empty states, and errors are translated.
- Order and payment statuses are translated only at presentation boundaries.
- Dates and interface-sensitive formatting follow the selected locale.
- IDR values remain accurate and recognizable.
- Language switching works without requiring an app restart.
- Automated checks prevent catalog drift and likely hardcoded UI strings.
- TypeScript, lint, tests, and React Doctor pass without introducing suppressions.

## Delivery Strategy

Implement the work in small feature-focused commits. A practical sequence is:

1. Localization foundation and shared keys.
2. POS, checkout, payment, and receipts.
3. Products, categories, and add-ons.
4. Areas, tables, and printers.
5. Orders, dashboard, and earnings.
6. Remaining navigation, settings, updates, and accessibility text.
7. Automated localization guard and final full-app audit.

Avoid one large mechanical replacement commit. Feature-sized changes make wording review,
layout regression testing, and rollback substantially safer.

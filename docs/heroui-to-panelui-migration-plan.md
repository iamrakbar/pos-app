# HeroUI to PanelUI Migration Plan

Replace HeroUI Native, HeroUI Native Pro, and generic custom controls with stock PanelUI components. Retain TrueSheet for existing sheet presentation and orchestration. Preserve business behavior, localization, navigation, and responsive layouts while adopting PanelUI defaults.

Tasks are ordered by priority and dependency. Change `- [ ]` to `- [x]` only after the task and its verification are complete. P0 implementation and evidence are recorded in [the validation log](panelui-p0-validation.md). This is one atomic migration delivered through ordered work stages: intermediate stages may not run while HeroUI consumers remain. Do not release or claim a runnable checkpoint until all source consumers and theme dependencies are converted.

## Audit baseline

- 102 source files reference HeroUI; import counts include Button (59), Typography (73), useThemeColor (66), and useToast (28).
- HeroUI Pro provides tables, widgets, charts, number fields, date/time controls, empty states, FAB, SlideButton, and SplitView.
- TrueSheet appears in 10 source files across POS, orders, products, inventory, and root setup.
- PanelUI 0.115.0 is installed but its provider, theme CSS, and source scanning are not configured.
- Expo 57, React Native 0.86.3, and Reanimated 4.5.1 match the supplied PanelUI compatibility requirements.
- Use installed source/types as the contract; consult the [official catalog](https://panelui.dev/llms.txt) and local PanelUI skill references. Do not silently upgrade.

## P0 decision — retain TrueSheet

TrueSheet remains the sheet presentation and orchestration library, including the POS add-on flow. Preserve its existing virtualized lists, detents, refs, named methods, lifecycle, and nested interactions. Replacing it with PanelUI or Software Mansion sheets is out of scope for this migration.

- [ ] Resolve Android PanelUI overlay and toast stacking above TrueSheet using the user-authorized native overlay host spike; retain stock PanelUI controls and TrueSheet. Verify nonblocking toasts, queue ownership and timers, Select, DatePicker, Dialog, accessibility, keyboard, and Android back before adoption.
- [ ] Baseline and validate long add-on lists and nested selection changes on an Android device; preserve FlatList virtualization, selection rules and response time. Optimize nonvisual state and row rendering only where measurement demonstrates a regression; avoid custom UI controls.
- [x] User acceptance: the production POS add-on flow was checked on the unlocked Android tablet and reported as passed (2026-10-28). This confirms the observed flow; the separate long-list baseline and measured response-time criterion above remain open.

### Overlay acceptance update

The user accepts the native Modal host direction for non-toast overlays, subject to confirming that one overlay renders once and remains usable on Android. Toast remains a separate unresolved issue: do not mark its stacking, timing, or accessibility complete until a single nonblocking viewport is verified. Keep the Modal host as a development spike until its lifecycle and interaction checks pass.

## P0 — Migration rules and infrastructure

- [ ] Capture baseline typecheck, lint, tests, screenshots, and representative workflow results; record unrelated failures and preserve existing uncommitted work.
- [x] Enforce direct `panelui-native` imports: no copied components, forks, compatibility wrappers, new custom controls, or library patches.
- [x] Add the missing direct required peer `@react-native-masked-view/masked-view` through Expo-compatible installation; retain the existing Bun package workflow.
- [x] Replace HeroUI CSS imports/vendor scanning in `src/global.css` with `panelui-native/theme.css` and `@source "../node_modules/panelui-native/src"`.
- [x] Keep the Panel family with device light/dark mode and define the app's cyan primary, readable primary foreground, and focus ring through PanelUI theme tokens.
- [x] Install exactly one PanelUIProvider above QueryClientProvider and TrueSheetProvider in the root layout, with all application screens beneath them. Remove HeroUI provider/toast wrapper and the outer gesture/keyboard providers supplied by PanelUI; preserve Android window/inset flags through supported PanelUIProvider props.
- [ ] Preserve authentication, React Query, Observe, splash readiness, notifications, update handling, and error boundaries.
- [x] Replace useThemeColor with Uniwind useCSSVariable; retain the nonvisual navigation-theme adapter using resolved PanelUI tokens.
- [x] Verify surface→card, muted text→muted-foreground, accent→primary, and danger→destructive translations against installed tokens, including status/surface variants.
- [x] Replace toast calls with PanelUI useToast, preserving severity, actions, duration, and dismissal.
- [ ] Before broad screen conversion, run a minimal integration spike using the existing root and a representative TrueSheet: verify PanelUI controls, keyboard, Select/DatePicker/Dialog, and toast stacking above the native sheet on Android. Treat invisible or untouchable portals as a migration blocker, not something provider reordering alone is assumed to fix. A native overlay host spike is authorized; do not patch either library without a further decision.

## P1 — Shared controls and behavior contracts

### Current progress

- An earlier Android build failed when HeroUI's provider and theme were removed before all consumers. Every active HeroUI import is now migrated; the temporary provider and styles have been removed. A fresh Android production-flow review remains open.
- Shared loading/error displays, list/table skeletons, create FAB, offline and reorder banners, active switch, and QR URL disclosure now use PanelUI primitives. loading displays, QR URL disclosures, payment countdowns, active switches, create FABs, offline and reorder banners, and settings/inventory menu rows are composed directly at their callers and their old helpers were removed. The root app-update UI uses PanelUI. Other screen-specific wrappers and their remaining callers still need consolidation; this does not complete the shared-control task.
- Error states now compose PanelUI Alert and Button directly, including product relationship sheets and form load helpers; the unused ErrorState helper was removed. List, grid, and table loading states now compose PanelUI Skeleton at each caller; their unused wrappers were removed.
- Inventory tables now share the same nonvisual comparison utility, covered for numeric, text, and missing values; server-sort and pagination logic remains in the screens. The inventory operations, supplier, ingredient, and movements tables use PanelUI Table.Frame for loading and data rows with controlled sortable headers, retaining the existing ascending/descending toggle, horizontal scrolling, and server query mapping; an Android development fixture confirmed controlled ascending/descending row order; production table verification remains open.
- Ingredient and product movement views compose PanelUI Table, Chip, and EmptyState directly, sharing only column and formatting utilities; horizontal scrolling and pagination remain in their callers. The previous table did not enable its optional virtualization; large-list verification remains open.
- Dashboard summary metrics use PanelUI GridItem.Group and GridItem's semantic title, media, and value parts inside a Frame panel in a two- or four-column layout; each GridItem has its own outline. Earnings Kpi metrics use separate PanelUI surfaces inside a Frame panel. Dashboard chart/best-seller and earnings sales/recent widgets use Frame and EmptyState, and the old summary widget helpers were removed. Device layout and long-value checks remain open.
- The dashboard orders chart uses PanelUI AreaChart inside Frame for every date filter, with a theme-token count series, grid, localized date/integer axes, localized orders legend, and date/value tooltip while retaining the existing aggregation and selected range. A one-day range repeats its one real data point only in render data so the area has width; a zero-order range shows EmptyState. The normalization logic matches the committed HeroUI implementation's duplicate-day aggregation and missing-day filling, covered by a focused test. Currency-formatted metrics remain unchanged. Android visual verification confirmed the final Frame-wrapped one-day area and earlier visible seven-/thirty-day series; production value comparison remains open.
- PanelUI Select triggers now use the matching Input height at each size. The earnings range selector has a bounded width, the POS sort selector widens only for its anchored overlay, and cart order type is capped on tablet while sharing its row width on phone; stock option typography remains unchanged. Tablet overlay and narrow-screen review remain open.
- Removed the remaining legacy accent utility classes from active screens and mapped them to PanelUI primary or secondary tokens according to their role. The app's cyan primary palette defines paired light/dark foreground and focus-ring tokens without custom accent overrides; custom radius values remain. Theme appearance review remains open.
- Drawer, KDS, receipt preview, POS category/customer filters, and table selection use PanelUI ScrollFade with their existing scroll containers. POS product grid now wraps its populated FlatList directly and uses PanelUI Card, Skeleton, and EmptyState for its loading and empty states. An Android development fixture confirmed a FlatList under ScrollFade scrolls; production scroll and layout verification remain open.
- POS and discount-product search use PanelUI SearchBar with localized clear labels and the existing query handling. Checkout uses PanelUI SlideButton with pending/disabled state, reset timing, and a localized accessibility action. On an Android tablet, a development fixture accepted search text and exposed the clear action, and a slide invoked its completion callback once; a payment-radio fixture exposed option names and selected state and switched selection on Android; production checkout and TalkBack verification remain open.
- Checkout payment-reference, customer-search, and notes fields and the parked-order name field use PanelUI directly; customer search keeps its existing results list and disables the SearchBar panel. Device verification remains open.
- Printer connection and paper-width selections, receipt layout and preview-size selections, and theme/language preferences use PanelUI Select directly; their reset behavior remains in the existing form controllers, and the shared select wrapper was removed. Device verification remains open.
- Adaptive text and textarea form fields, plus category, supplier, ingredient, discount, area, account, merchant-profile, product, supplier-offer, receipt, and add-on fields, now bind React Hook Form directly to PanelUI Input/Textarea; the two visual controller helpers were removed. Existing keyboard handlers remain until the adaptive overlay migration, and on-device focus validation is still open.
- Local calendar-date parsing and API serialization are shared nonvisual utilities, with a round-trip test. Discount form and earnings custom range now use PanelUI DatePicker and local date strings; the obsolete HeroUI picker and option type are removed. Nested picker device verification remains open.
- Localized number-input state and parsing live in a nonvisual hook, with focused coverage for Indonesian grouped and decimal values. Its edit state tracks the committed numeric value so a trailing decimal comma survives a controlled parent update. Category position, printer numeric fields, add-on option prices, ingredient and product stock costs, product prices, supplier offer prices, discount values, merchant tax, POS tender, and table capacity use PanelUI Input directly; all HeroUI numeric wrappers are removed. Production form verification remains open.
- Merchant and table QR flows now use stock PanelUI QRCode and the installed view-capture library for branded 1024px exports. One synthetic Android capture decoded successfully; production URLs, native save/share, web export, iOS, and printed scan quality remain unverified.
- Pickup-time rounding, formatting, and past-time checks now live in a nonvisual utility, with coverage for five-minute rounding and midnight. The Android TrueSheet spike verified a PanelUI 24-hour, five-minute time-picker change from 13:05 to 13:10; its wheel and Done accessibility labels remained English under Indonesian locale. Production pickup integration, bounds, and accessibility remain open.
- PanelUI NumberInput 0.115.0 hardcodes its increase/decrease accessibility labels in English; do not replace localized quantity steppers until their labels and Indonesian decimal input behavior can be preserved.
- Category, discount, area, add-on, ingredient, supplier, supplier-offer, product, and printer deletion confirmations use PanelUI Dialog directly on their regular screens; their actions and pending states are retained. Printer diagnostic and payment-success prompts, plus order cancellation with its required reason field, also use PanelUI Dialog. Device verification remains open.
- Logout confirmation uses PanelUI Dialog directly in the drawer and settings screen; the old logout and generic action-dialog helpers were removed. Nested prompt actions and dialogs use PanelUI controls. Production nested-dialog device verification remains open; toast remains pending upstream support.

- Android Expo export of the accumulated P1 work completed successfully (10,867 modules); this is a bundling check, not production-device acceptance.

- Upstream documentation recheck (2026-10-28): [NumberInput](https://panelui.dev/docs/components/number-input) still documents bare-number typing and provides no separate increment/decrement label props; [TimePicker](https://panelui.dev/docs/components/time-picker) documents locale for time and meridiem text but no wheel/action-label overrides. The published docs/release pages may lag the locally installed 0.115.0, so this does not establish that no newer upstream fix exists.

- React Doctor scanned 82 changed files: 28 warnings, with score unavailable because its API could not be reached. The index-key findings are static loading placeholders; duplicate JSX is expected from the direct-composition constraint. Large/complex screen findings remain review items, not confirmed regressions.

- Current checks: `bun test` passed all 18 tests; `bun run typecheck` passed; `bun run lint` passed with 51 warnings and no errors; `git diff --check` passed. The recorded P0 baseline remains historical. React Doctor's latest attempt could not complete in this sandbox.

### Remaining P1 priorities

1. [x] Preserve localized and empty/intermediate numeric input behavior and localized stepper actions while replacing all HeroUI NumberField controls. Stock PanelUI Input and Button composition uses the existing nonvisual localized-input hook; PanelUI 0.115.0 NumberInput does not satisfy these contracts. Device verification remains under priority 5.
2. [ ] Verify the earnings date-range and POS pickup-time replacements on a device, including nested close/open sequencing, local dates, bounds, and localized picker accessibility. The code uses stock PanelUI DatePicker and TimePicker; PanelUI's time-picker wheel/action labels remain English in the tested Indonesian locale, pending upstream support.
3. [x] Remove the remaining adaptive form visual helper after inlining its TrueSheet and PanelUI Dialog presentations at every caller. Only the nonvisual lifecycle hook remains. Production device verification stays open under priorities 2, 4, and 5; toast support remains an upstream wait.
4. [ ] Verify the migrated selectors with TalkBack. PanelUI 0.115.0 Select exposes a combobox with the selected value or placeholder, but does not expose a trigger accessibility-label prop; check that each field remains identifiable with its visible label and retain the existing behavior where it does not.
5. [ ] Collect user-run production device checks for input focus and keyboard handling, sorting, chart values, QR export, and receipt preview resizing. The user will perform device checks; measured long add-on list response time is deferred to a later performance pass. iOS and web checks remain separately open.

### P1 device acceptance — one pass per flow

Record pass or the first failure for each flow. A failed flow can be fixed and retried without repeating unrelated checks.

- [ ] POS: select a long-list add-on and its nested options, complete checkout, check payment once, and confirm navigation occurs once; also check cancellation.
- [ ] Adaptive forms: open a stock adjustment or quick form on phone portrait and a larger layout, focus the lowest field, submit/cancel, and open a nested Select or delete Dialog. Check keyboard reachability and Android back.
- [ ] Pickers and accessibility: select an earnings local-date range and a future POS pickup time, then inspect the selected values and bounds. With TalkBack, identify the migrated Select triggers, radio option price, and picker actions; record the known English time-wheel/action labels separately.
- [ ] Display and export: verify one sorted table, dashboard/earnings chart totals, a merchant or table QR save/share, and receipt preview resize/print on the production device.

The earlier unlocked-tablet POS add-on pass predates the control replacement; a fresh selection check is required. Long-list response-time measurement remains deferred by user decision. The Android toast viewport remains an upstream-support wait and is outside these functional pass boxes.

### Completed implementation tasks

These checkboxes record completed implementation work. The broader P1 requirements below remain open where they include other callers or device verification.

- [x] Replace earnings custom-range HeroUI Pro Calendar/DatePicker with PanelUI DatePicker, preserving local date conversion, Indonesian locale, today bound, and separate start/end fields. Replace its form actions and labels with PanelUI controls; nested overlay behavior awaits device verification.
- [x] Replace POS pickup HeroUI Pro TimePicker with PanelUI TimePicker, retaining 24-hour values, five-minute steps, local `HH:mm` serialization, responsive presentation, and a minimum selectable future time. Device verification and upstream Indonesian wheel/action labels remain open. No source file now imports HeroUI Native Pro.
- [x] Replace remaining HeroUI Button actions in add-on option rows, new-product add-on groups, quick category creation, and inventory relationship sheet header with PanelUI Button; preserve disabled/submit behavior and add an accessible name to the option remove action.
- [x] Replace ingredient detail sheet actions and merchant QR download/preview actions with PanelUI Button, retaining navigation, disabled/pending behavior, and accessible action names.
- [x] Remove the no-op adaptive keyboard render helper and inline all 13 callers after TrueSheet replaced HeroUI's bottom-sheet focus hooks. PanelUI inputs keep their own blur handlers and the TrueSheet presentation handles native keyboard movement; device focus/resizing verification remains open.
- [x] Replace quick-discount overlay action and unit buttons plus its required label with direct PanelUI controls, preserving pending state and unit selection.
- [x] Replace HeroUI buttons and labels in product relationship TrueSheets with PanelUI Button and Label, retaining sheet refs, recipe edits, option selection, list pagination, and localized action names.
- [x] Replace record-movement type HeroUI Select and Label with PanelUI Select and Label, keeping controlled movement values, validation feedback, and responsive sheet/overlay presentation. TalkBack field identification remains under the selector device check.
- [x] Replace discount-product category filters and clear/apply actions with PanelUI Chip and Button; selected chips expose checked state and the apply action retains its disabled condition.
- [x] Replace notification permission Alert and actions with PanelUI Alert and Button, retaining warning/info state and pending labels; replace POS table area and seat chips plus the no-table action with PanelUI controls.
- [x] Replace HeroUI ListGroup in preferences and payment settings with PanelUI Frame rows, preserving responsive selectors, update navigation, payment reorder/toggle actions, section dividers, and pending states.
- [x] Replace KDS status/lane chips and ticket action button with PanelUI, preserving status mapping, selected lane state, pending action, and localized labels; replace area-table chips and QR/edit buttons with PanelUI while retaining per-table action names.
- [x] Replace area/table form delete triggers, save actions, and nested delete confirmations with PanelUI Button and Dialog, retaining controlled state, pending safeguards, and destructive confirmation. Nested native overlay device verification remains open.
- [x] Replace product form's remaining HeroUI Buttons, Labels, and Descriptions with PanelUI Button, Label, and Typography, retaining category/discount actions, inventory action names, validation feedback, and save pending state.
- [x] Replace printer form's remaining HeroUI Input, Switch, and Button controls with PanelUI; inline the old field label/error visual helpers into stock PanelUI Input/Label and Typography while preserving form validation, hardware toggles, scan/diagnostic pending states, and save actions.
- [x] Replace merchant profile HeroUI Tabs, Label, and Buttons with PanelUI Tabs, Label, and Button. Keep controlled tab navigation, scrollable tab list, mounted form panels, QR action, and save/cancel pending behavior.
- [x] Replace earnings preset-range HeroUI Select with PanelUI Select, retaining controlled preset/custom selection, the formatted selected label, and responsive sheet/overlay presentation. Nested custom-range sequencing remains a device check.
- [x] Replace POS cart order-type selector, cart reset/checkout buttons, search sort selector, category toggle, and filter chips with PanelUI; preserve order-type side effects, selected filter state, and responsive presentation. Add localized cart reset accessibility text. Sort trigger now uses PanelUI's stock labelled Select and needs device layout/TalkBack review.
- [x] Replace POS add-on HeroUI ControlField/Radio rows with stock PanelUI RadioGroup cards and inline checkbox rows with stock PanelUI Checkbox, deleting the visual OptionRow helper. Retain TrueSheet, FlatList, RHF selection state, maximum selection disabling, prices, and notes. PanelUI RadioGroup.Item hardcodes its accessibility label to the visible label, so include the price/no-charge text there; verify TalkBack announcement and long-label layout on device.
- [x] Replace parked-order trigger, list actions, and park/delete/restore confirmations with PanelUI Button and Dialog, retaining controlled dialog state, cart replacement safeguards, and localized action names. Nested dialog stacking remains a device check.
- [x] Replace the shared adaptive form presentation's HeroUI BottomSheet and Dialog with TrueSheet on phone portrait and PanelUI Dialog on larger layouts; remove its Gorhom ref and HeroUI keyboard-aware hook. Typecheck and targeted lint pass. Device verification of focus, resizing, close sequencing, and nested overlays remains open.
- [x] Replace remaining HeroUI list pagination buttons in ingredients, suppliers, movements, and operations; category reorder arrows; and receipt setup/done actions with stock PanelUI Button. Preserve pending/disabled states and accessible reorder names.
- [x] Inline the last numeric visual helper at inventory adjustment/movement, product opening/adjustment, supplier offer, and recipe sheet callers; delete `form-number-field.tsx`. Stock PanelUI Input and Button controls use existing nonvisual localized hooks for intermediate edits, bounds, formatting, and localized stepper names. Typecheck and targeted lint pass; device verification remains open.
- [x] Replace product low-stock alert HeroUI NumberField with direct PanelUI Input and Button composition, preserving integer editing, zero bound, form state, and localized stepper labels; remove its in-file visual stepper.
- [x] Replace add-on management minimum/maximum HeroUI steppers with direct PanelUI Input and Button composition, retaining integer bounds and localized stepper labels; remove the now-unused SelectionRuleStepper visual helper.
- [x] Replace new-product add-on minimum/maximum HeroUI steppers with direct PanelUI Input and Button composition per group, retaining controlled bounds, integer edits, and localized stepper labels; targeted lint and typecheck pass.
- [x] Replace supplier lead-time HeroUI NumberField with direct PanelUI Input and Button composition, preserving integer parsing, zero lower bound, RHF state, and localized stepper labels.
- [x] Replace ingredient reorder-point and initial-quantity HeroUI NumberFields with direct PanelUI Input and Button composition, preserving Indonesian decimal editing through the existing nonvisual hook, zero lower bounds, RHF values, and localized stepper labels. Device checks are assigned to the user.
- [x] Replace table QR share, download, and preview actions with PanelUI Button, retaining pending/unavailable state and localized accessible names; the overlay file no longer imports HeroUI directly.
- [x] Replace area list view/edit actions with PanelUI Button, retaining icons, navigation, and per-area accessible names; remove that screen's HeroUI import.
- [x] Replace payment screen close/check actions and leave-payment confirmation with PanelUI Button and Dialog, retaining pending state and controlled confirmation. Android overlay behavior remains a device check.
- [x] Replace checkout payment-group and cash-preset buttons, customer-type chips, and guest selector with direct PanelUI controls. Preserve form values, pricing previews, customer reset behavior, and TrueSheet; device selector and checkout checks remain open.
- [x] Replace order-detail cancel, receipt export/print, payment link/QR/refresh, navigation actions, and printer prompt with direct PanelUI Button and Dialog. Retain TrueSheet receipt preview and controlled prompt state; nested overlay device verification remains open.
- [x] Replace drawer profile Avatar, Popover, and account/logout actions with stock PanelUI controls. Remove the now-unused HeroUI provider, CSS imports, package dependencies, and Metro/TypeScript aliases; regenerate the Bun lockfile. Drawer presentation and logout sequencing remain device checks.
- [x] Replace the drawer theme selector's hand-styled Pressable choices with stock PanelUI Buttons, retaining controlled light/dark/system state and accessible selected labels. Typecheck and targeted lint pass; device layout/TalkBack review remains open.
- [x] Replace hardcoded control/icon colors in sign-in, payment checking, payment success, error fallback, and KDS actions with PanelUI semantic theme tokens. Remove the KDS button's manual warning background so the stock primary variant owns its visual state. Typecheck and targeted lint pass; theme/device review remains open.
- [x] Recheck pickup-time validity at PanelUI TimePicker selection, clamping a choice that became past while the picker was open to the next valid five-minute slot (or null at day end). Existing checkout schema still rejects past times at submit; typecheck and targeted lint pass. Device picker accessibility remains open.
- [x] Guard payment-status success handling by order ID so repeated successful mutation callbacks invoke completion navigation once per order. Typecheck and targeted lint pass; payment-route device verification remains open.
- [x] Guard checkout submission while validation and payment creation are in flight, retaining the guard after success and releasing it after validation/API failure. This prevents repeated SlideButton completion from creating duplicate orders or navigation; typecheck and targeted lint pass.
- [x] Inline the order payment QR overlay's existing TrueSheet/PanelUI Dialog presentation at its caller, preserving controlled dismissal, countdown closure, and QR content without the shared adaptive visual helper. Typecheck and targeted lint pass; device overlay review remains open.
- [x] Inline merchant and table QR overlay presentations at their callers with stock PanelUI Dialog and retained TrueSheet; preserve branded QR export views, action footers, controlled close state, and table loading. Share only nonvisual sheet lifecycle logic in a hook. Typecheck and targeted lint pass; device export and overlay reviews remain open.
- [x] Inline quick-category form presentation with TrueSheet and PanelUI Dialog while preserving React Hook Form bindings, pending close guard, validation, save footer, and created-category callback. Typecheck and targeted lint pass; nested device checks remain open.
- [x] Inline quick-discount and earnings custom-range presentations with retained TrueSheet and stock PanelUI Dialog. Preserve form validation, currency edits, selected unit, local calendar dates, nested DatePicker presentation, and apply/cancel actions. Typecheck and targeted lint pass; nested device checks remain open.
- [x] Inline ingredient adjustment and movement presentations with TrueSheet/PanelUI Dialog, retaining numeric edits, movement Select, validation, pending close guard, submit footers, and dialog keyboard offset. Restore that keyboard offset to the already-inlined quick-category and quick-discount forms. Typecheck and targeted lint pass; device keyboard checks remain open.
- [x] Inline product opening-balance and adjustment presentations with TrueSheet/PanelUI Dialog, preserving stock form bindings, pending close guard, action footer, and dialog keyboard offset. Typecheck and targeted lint pass; production stock-flow device checks remain open.
- [x] Inline area and table form presentations with TrueSheet/PanelUI Dialog, preserving save/delete actions, nested delete confirmation, controlled state, and dialog keyboard offset. Delete the now-unused shared adaptive form visual helper; zero application source callers remain. Typecheck and targeted lint pass; nested device checks remain open.
- [x] Replace area form navigation/save and product add-on card actions with PanelUI Button, retaining handlers and pending state; both files no longer import HeroUI.
- [x] Replace ingredient, supplier-offer, and add-on form actions with PanelUI Button, preserving existing handlers, pending states, and labels; remove direct HeroUI imports from those three files.
- [x] Replace supplier form save/cancel actions with PanelUI Button, preserving pending labels and disabled states; the form no longer imports HeroUI controls directly.
- [x] Replace category form save/cancel actions with PanelUI Button, preserving pending labels and disabled states; the form no longer imports HeroUI.
- [x] Replace account profile save/cancel buttons with PanelUI, preserving dirty/pending disabled states and the saving label; remove that screen's HeroUI import.
- [x] Replace payment-method enabled switches with PanelUI Switch, retaining save-disabled state and per-method accessible names.
- [x] Replace product form and new-product add-on rule switches with controlled PanelUI Switch, preserving RHF updates and adding localized accessible labels.
- [x] Replace merchant type, tax, and fee switches with controlled PanelUI Switch and localized accessible labels; remove two stale empty HeroUI imports left by earlier Card migration.
- [x] Replace discount unit buttons, label, and status switch with PanelUI controls, preserving controlled values and giving the switch a localized accessible name; the form section no longer imports HeroUI.
- [x] Replace payment-success print and new-order actions with PanelUI Button and the auto-print toggle with PanelUI Switch, preserving print pending state and navigation; the screen no longer imports HeroUI.
- [x] Replace the settings logout action with PanelUI Button and its destructive variant, retaining the confirmation dialog and removing that screen's HeroUI import.
- [x] Replace discount form save/cancel actions with PanelUI Button, preserving the pending label and disabled state; remove the screen's HeroUI import.
- [x] Replace POS cart-row remove and quantity actions with PanelUI Button, preserving their localized accessible names and quantity handlers; use the documented destructive variant for removal.
- [x] Replace the inventory movement load-more action with PanelUI Button, preserving its pending label and disabled state; remove that screen's HeroUI import.
- [x] Replace the dashboard header's open-POS action with PanelUI Button, preserving its icon, navigation route, and localized accessible name.
- [x] Replace the POS table selection action with PanelUI Button and Typography, preserving selected-table name truncation and the localized spoken label.
- [x] Replace the floating POS cart action with PanelUI Button and Typography, retaining cart count, subtotal, navigation, and its localized accessible name.
- [x] Replace the ingredient detail sheet stock-status chip with PanelUI success/warning/destructive variants.
- [x] Replace order list and detail status chips with PanelUI Chip, retaining status text and mapping all existing order/payment/tracking colors through the shared nonvisual utility; the order list no longer imports HeroUI.
- [x] Replace the POS payment status chip with PanelUI Chip and add a nonvisual status color mapping (`accent`→`primary`, `danger`→`destructive`) for the remaining order/payment statuses.
- [x] Replace category and product list active/inactive chips with PanelUI success/default variants; the product list no longer imports HeroUI. Targeted lint and typecheck pass.
- [x] Replace discount list active/inactive status chips with PanelUI Chip variants, removing that screen's HeroUI import.
- [x] Replace notification permission status chip with PanelUI Chip, mapping danger to its destructive variant.
- [x] Move 13 remaining shared `cn` utility imports from HeroUI to PanelUI across navigation, orders, POS, products, KDS, earnings, and settings; typecheck passes.
- [x] Replace the earnings settled status chip with PanelUI Chip using its success variant.
- [x] Replace dashboard period chips with selectable PanelUI Chip controls and move receipt preview's `cn` import to PanelUI, removing those HeroUI imports.
- [x] Replace the sign-in Card, submit Button, credential InputGroups, and password visibility action with PanelUI, preserving responsive card padding, prefix icons, a localized spoken toggle label, and a disabled, busy submit state.
- [x] Replace the drawer menu icon action with PanelUI Button, retaining its spoken label and navigation action.
- [x] Replace HeroUI Cards across 20 form, inventory, payment, POS table, and settings screen files with PanelUI Card; map Body to Content, preserve the old root and slot padding, and map the unselected table surface to `bg-inset`. Typecheck and targeted lint pass; visual review is delegated to the user.
- [x] Replace POS product and discount product selection cards with PanelUI Card, preserving their explicit content padding and existing selection actions; device visual review remains open.
- [x] Map stale HeroUI accent/danger/default color classes, muted text, and panel radius aliases to PanelUI semantic colors and radius tokens across active source; localization and lint pass with existing warnings, and light/dark visual review remains open.
- [x] Replace remaining HeroUI spinners with PanelUI Spinner and remove the unused and recipe loading wrappers.
- [x] Replace the dashboard custom Skia loading animation with PanelUI Spinner and remove the unused animation component.
- [x] Remove the generic action-dialog wrapper while retaining the legacy nested dialog behavior pending the overlay solution.
- [x] Remove the shared dialog-close wrapper; remaining legacy dialogs and adaptive sheets use their built-in close parts with localized accessibility labels pending PanelUI overlay migration.
- [x] Replace remaining HeroUI Surface usages with PanelUI Surface across nine files; device visual review remains open.
- [x] Replace HeroUI Typography with PanelUI Typography across 56 files, preserving muted text and truncation behavior; visual review remains open.
- [x] Replace HeroUI separators with PanelUI Separator across 20 files, retaining horizontal and vertical orientation.
- [x] Replace HeroUI EmptyState with PanelUI EmptyState across the remaining 16 screen callers, preserving localized messages and actions.
- [x] Replace shared error displays with direct PanelUI Alert and Button composition; remove the ErrorState wrapper.
- [x] Replace list, grid, table, cart, and POS search loading skeletons with PanelUI Skeleton at their callers; remove their visual wrappers.
- [x] Replace shared create FAB, loading display, active switch, countdown, offline and reorder banners, QR disclosure, and settings-row wrappers with direct PanelUI composition; remove those wrappers.
- [x] Replace supplier-offer and product-recipe tables with direct PanelUI Table composition, preserving offer row actions and displayed data. The committed HeroUI tables did not enable their opt-in `virtualized` mode; PanelUI marks rows with an action as buttons. Device large-list and screen-reader checks remain open.
- [x] Replace inventory movement table wrapper with direct PanelUI tables and nonvisual shared formatting/column utilities.
- [x] Replace inventory table headers with controlled PanelUI sorting and preserve screen-side sorting and pagination.
- [x] Wrap inventory tables with PanelUI Table.Frame and dashboard/earnings chart and summary widgets with Frame; give each dashboard GridItem and earnings Kpi a distinct PanelUI surface.
- [x] Count earnings range limits by local calendar days rather than elapsed hours; verify daylight-saving and leap-day cases.
- [x] Decouple earnings date-range state and API payloads from HeroUI option types using local date strings and remove the date-picker wrappers; the HeroUI picker presentation remains open.
- [x] Move Indonesian numeric parsing, local-date conversion, pickup-time calculation, chart aggregation, and table comparison into nonvisual utilities/hooks with focused tests.
- [x] Compose the dashboard orders chart directly with PanelUI AreaChart, dashboard metrics with PanelUI GridItem, and earnings metrics with PanelUI Kpi; remove the chart wrapper.
- [x] Constrain earnings, POS sort, and POS order-type Select widths; match Select trigger heights to the corresponding Input sizes while keeping PanelUI option typography.
- [x] Convert remaining legacy accent utility classes to PanelUI primary or secondary roles; retain cyan as the app's primary token with matching foreground and focus-ring colors in both themes, without custom accent overrides.
- [x] Replace printer connection/paper-width and receipt layout/preview-size, ingredient unit, supplier offer, product category/inventory mode/discount, and preference selectors, POS and discount search fields, and checkout slide-to-pay and payment radio options with PanelUI controls.
- [x] Replace the receipt preview SplitView with PanelUI SplitView while retaining snap points and its localized resize label.
- [x] Extract POS add-on selection mapping into a nonvisual utility and cover a 25-group, 200-option case, including mixed selection types and stale option IDs; device performance remains unverified.
- [x] Replace POS add-on notes, typography, surfaces, separators, footer buttons, status chips, and error text with PanelUI while retaining the TrueSheet footer and focus behavior.
- [x] Replace ingredient, supplier, discount, and stock-overlay field-message helpers with direct PanelUI Typography.
- [x] Replace stock-overlay field messages and footer buttons with direct PanelUI composition; remove their shared visual helper.
- [x] Replace discount product selection rows and multiple-selection POS add-on options with controlled PanelUI Checkbox controls, retaining selection limits. Single-selection POS add-ons remain on HeroUI because PanelUI RadioGroup ignores a tap on the selected item, while the existing flow permits deselection. PanelUI ToggleButtonGroup supports deselection but exposes button rather than radio semantics, so it is not an equivalent accessible replacement.
- [x] Replace the supplier-offer selector with direct PanelUI composition and remove its visual field helper.
- [x] Replace product category, inventory-mode, and discount selectors with PanelUI Select, preserving loading, errors, recipe eligibility checks, discount status labels, and mutation behavior; remove the discount selector wrapper.
- [x] Replace merchant and table QR rendering with PanelUI QRCode and retain image capture/export integration.
- [x] Replace regular-screen deletion confirmations and logout, printer diagnostic, payment-success, and order-cancellation prompts with PanelUI Dialog.
- [x] Replace the identified category, supplier, ingredient, discount, area, account, merchant-profile, product, supplier-offer, receipt, add-on (including POS notes), and checkout text fields with PanelUI Input or Textarea.
- [x] Verify PanelUI SearchBar input, SlideButton completion, ScrollFade with FlatList, and controlled table sort in Android development fixtures.

### Replacement matrix

The component category can usually map 1:1; props and compound anatomy must be adapted.

| Existing component/pattern     | PanelUI replacement   | Adaptation                                             |
| ------------------------------ | --------------------- | ------------------------------------------------------ |
| Button                         | Button                | Variants, loading, disabled state, size, icon slots    |
| Card                           | Card                  | Body→Content; use slot padding                         |
| Typography, Surface, Separator | Same-named components | Supported presets, variants, orientation               |
| Chip, Avatar, Accordion        | Same-named components | Status semantics and compound parts                    |
| Checkbox, Switch               | Same-named components | Controlled state and callbacks                         |
| Radio + RadioGroup             | RadioGroup parts      | Values and accessibility                               |
| Tabs                           | Tabs                  | In-screen state; keep Expo Router routes               |
| ListGroup                      | Item / Item.Group     | Frame rows for settings                                |
| ControlField                   | Field / Frame.Row     | Documented labels and controls                         |
| TextField                      | Field + Input         | Labels, errors, descriptions, refs                     |
| TextArea                       | Textarea              | Multiline and keyboard behavior                        |
| InputGroup                     | InputGroup            | Documented adornments                                  |
| SearchField/custom search      | SearchBar             | Query, clear, debounce, filtering                      |
| Label/Description/FieldError   | Label / Field parts   | No duplicate announcements                             |
| Select                         | Select                | Value shape, items, trigger, presentation              |
| Dialog, Popover                | Same-named components | Controlled state and anatomy                           |
| HeroUI BottomSheet             | TrueSheet             | Use existing sheet conventions and PanelUI content     |
| Existing TrueSheet             | Retain TrueSheet      | Preserve provider, refs, names, detents, and lifecycle |
| ScrollShadow                   | ScrollFade            | Preserve native scroll and compatible handlers         |
| Skeleton, Spinner, Alert       | Same-named components | Loading geometry and status                            |
| EmptyState                     | EmptyState            | Localized content and recovery                         |
| FAB/custom create FAB          | Fab                   | Action, placement, spoken name                         |
| SlideButton                    | SlideButton           | Pending state and repeat protection                    |
| NumberField/custom stepper     | NumberInput           | Numeric values, bounds, step, callbacks                |
| Calendar/DatePicker            | Calendar/DatePicker   | Date selections instead of HeroUI options              |
| TimePicker                     | TimePicker            | Convert to `{ hour, minute }`                          |
| Table                          | Table                 | Composition and controlled sorting                     |
| Widget / summary metric        | Frame / Kpi           | Titles, panels, values, comparisons                    |
| AreaChart                      | AreaChart             | Data-key series instead of geometry render props       |
| SplitView                      | SplitView             | Top, Bottom, DragArea, Handle                          |
| Custom countdown               | Countdown             | Stable timestamp and onComplete                        |
| QR renderer/disclosure         | QRCode                | Encoded value, disclosure, sharing/export              |

- [ ] Read each replacement's local reference and installed types before editing its consumers; adapt semantic variants rather than mechanically renaming imports.
- [x] Replace generic action dialogs, fields, close buttons, loading/error displays, settings rows, skeleton wrappers, FABs, countdowns, and QR disclosures with direct PanelUI composition; delete unused visual helper files. Device behavior remains covered by the separate acceptance checks.
- [x] Retain React Hook Form and Zod; bind their Controller render props directly to PanelUI controls and remove the HeroUI-dependent visual controller wrappers. No second form-state system was added.
- [x] Move reusable parsing, validation, formatting, and controller logic into nonvisual hooks/utilities; localized numbers, local dates, pickup time, chart aggregation, table comparison, and add-on selection have focused tests.
- [x] Use stock PanelUI Input and Button composition for quantities/simple steppers and currency/decimal fields with existing localized parsing. PanelUI NumberInput uses parseFloat, cannot safely parse Indonesian grouping/decimal commas, and has no localized stepper-label props in installed 0.115.0.
- [ ] Preserve numeric empty states, intermediate edits, bounds, precision, formatting, and API serialization.
- [x] Remove HeroUI DatePickerOption types and convert UI selections to existing API date strings without timezone shifts; focused local-date round-trip tests pass. Installed PanelUI DatePicker supplies the needed sheet/popover presentations, so separate Dialog + Calendar composition is unnecessary. Device picker checks remain open.
- [ ] Preserve time values, locale, hour cycle, and min/max restrictions through TimePicker conversions.
- [ ] Keep sorting in screen state/pure utilities; preserve server sorting, pagination, selection, row actions, and virtualization for large tables.
- [x] Replace charts with PanelUI series/axes/tooltips/legends while preserving aggregation, ranges, labels, values, and currency formatting. Dashboard orders is the only chart and uses AreaChart for every filter; its one-day render data repeats the actual count for visible width, while zero-order periods show EmptyState. Android screenshots confirmed the one-day Frame-wrapped area and earlier seven-/thirty-day series. The normalized range, labels, values, and `formatRupiah` metrics are unchanged; production value comparison remains open under P0 acceptance.
- [x] Apply PanelUI typography and semantic tokens; keep className chiefly for layout, persistent labels, readable numeric alignment, and accessible icon actions. Sign-in uses persistent PanelUI Field labels and errors; checkout uses Field.Error and Alert; status text uses destructive theme tokens, redundant foreground overrides are removed, numeric tabular alignment is retained, and the text cancel action uses text-button sizing. Typecheck, localization parity, and targeted ESLint pass; device visual and TalkBack review remain open.

## P1 — Overlay orchestration

- [ ] Retain the TrueSheet dependency, TrueSheetProvider, refs, names, present/dismiss/resize methods, detents, and existing lifecycle behavior.
- [x] Keep the global POS add-on sheet root-mounted and driven by existing selection state; the root renders it under TrueSheetProvider for an active session.
- [x] Replace HeroUI BottomSheet presentations with TrueSheet using established application conventions and direct PanelUI controls; zero HeroUI runtime references remain. Device overlay behavior remains a separate acceptance check.
- [ ] Preserve TrueSheet scrolling, headers/footers, sizing, keyboard handling, and nested sheet behavior rather than introducing PanelUI BottomSheet orchestration.
- [ ] Preserve adaptive form presentation: TrueSheet on phone portrait, PanelUI Dialog on larger/landscape layouts. Replace HeroUI useBottomSheetAwareHandlers and Gorhom-specific focus/keyboard plumbing with TrueSheet-supported integration; preserve validation, focus, submit/cancel behavior, and keyboard resizing.
- [ ] Resolve the P0 portal integration spike before migrating nested sheet controls. Use documented built-in presentations where they work; if an essential overlay cannot render above TrueSheet, document the exact failure and stop that flow pending a supported solution rather than creating a custom overlay or silently changing its workflow.
- [ ] Preserve parent form data across nested picker flows and existing dismissal/navigation sequencing; payment completion must navigate exactly once.
- [ ] Verify Android back, backdrop/drag dismissal, cancellation, keyboard reachability, and unsaved state.

## P2 — Screen migration, in execution order

For each group, migrate normal, loading, empty, validation, error, and overlay states. Preserve portrait/landscape and phone/tablet layouts. Existing business screens may compose PanelUI directly; do not extract new visual wrappers.

- [ ] Authentication and application navigation.
- [ ] Settings: account, preferences, notifications, payments, printers, merchant profile, areas, tables, receipt configuration and resizable preview.
- [ ] Categories, discounts, products, add-ons, and selection rules.
- [ ] Inventory: ingredients, suppliers, offers, stock adjustments, movement recording, and relationship sheets.
- [ ] Orders, order details, and KDS.
- [ ] POS: browsing/search, table selection, add-ons, parked orders, cart, checkout, payment, and success.
- [ ] Dashboard and earnings: metrics, charts, legends, tables, and date ranges.

## P3 — Dependency and source cleanup

- [x] Remove heroui-native and heroui-native-pro, then remove the vendored HeroUI Pro directory.
- [x] Remove the HeroUI Pro resolver override from metro.config.js; retain Uniwind configuration.
- [ ] Retain TrueSheet dependency/provider and confirm cleanup does not remove its integrations.
- [x] Remove @gorhom/bottom-sheet after scanning active source/configuration and finding no direct consumer; regenerate the Bun lockfile.
- [x] Remove unused Victory and external QR rendering dependencies after confirming zero source/configuration consumers. Retain Skia and its installation script because `src/utils/receipt-logo.ts` still uses Skia for grayscale receipt-logo export; removing them would break that domain integration.
- [x] Update Bun lockfile through the package workflow and verify a frozen dependency installation with lifecycle scripts disabled; Bun installed the six missing locked packages successfully.
- [ ] Remove obsolete helpers and active HeroUI setup documentation; preserve user-requested skills and historical documents.
- [x] Scan active application source/configuration and README for HeroUI imports, types, providers, styles, aliases, and vendor references; zero HeroUI runtime references remain. The tracked vendored directory is removed and TrueSheet references are retained.

## P4 — Final validation and acceptance

- [ ] Restart Metro with a clear cache after complete source conversion and verify themed controls, overlays, keyboard handling, status/navigation bars, and toast visibility.
- [ ] Run `bun run typecheck`, `bun run lint`, and `bun test`; compare with recorded baseline failures.
- [ ] Add focused regression coverage for Indonesian number parsing, date serialization, sorting, payment completion, and overlay transitions.
- [ ] Run React Doctor and resolve migration-caused diagnostics. Latest reviewed scan: 88 changed files, score 79/100, 35 warnings. Eight index-key findings are stable loading placeholders; duplicate JSX reflects direct PanelUI composition. Complexity findings remain a maintainability review, with no confirmed runtime migration defect.
- [x] Build an Android bundle with cleared Metro cache after HeroUI removal; `expo export --platform android --clear` completed with 9,445 modules and a Hermes bundle. Runtime styling and device behavior remain separate checks.
- [ ] Verify Android light/dark, phone/tablet, portrait/landscape, large text, long localized labels, and TalkBack.
- [ ] Exercise sign-in, product editing, stock adjustments, orders/KDS, and complete POS checkout including cancellation and failures.
- [ ] Verify nested pickers, keyboard reachability, scrolling sheets, Android back, and accessible touch targets.
- [ ] Compare chart totals/table order against baseline fixtures; scan displayed/exported QR codes and verify receipt preview, sharing, and printing.
- [ ] Verify iOS before claiming iOS acceptance; explicitly record unavailable device checks.
- [ ] Confirm all standard controls come directly from PanelUI, with TrueSheet retained as the sheet presentation exception; require no new custom controls, copied components, compatibility wrappers, or library patches.
- [ ] Record final check results, limitations, and dependency changes; mark the migration complete only when acceptance criteria pass.

## Boundaries and defaults

- Preserve API endpoints, schemas, persisted data, authentication, and localization keys; no backend/database migration is required.
- Existing screens and business feature compositions remain. Native layout/list/scroll primitives, images, Expo Router, icons, branding assets, and device integrations are infrastructure rather than replacement controls.
- Preserve domain table illustrations and receipt rendering while removing HeroUI theme dependencies.
- TrueSheet is the explicit exception to PanelUI-only UI: preserve its presentation and orchestration while migrating sheet content controls to PanelUI. PanelUI compound controls may retain their built-in overlays; do not fork them to replace their internal presentation.
- Use PanelUI defaults without optional native/glass rendering or a new theme-family picker.
- Any unsupported essential workflow is a blocker to resolve through documented PanelUI composition; do not silently remove functionality or implement a custom control.

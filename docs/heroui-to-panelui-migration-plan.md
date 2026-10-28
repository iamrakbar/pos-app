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

### Overlay acceptance update

The user accepts the native Modal host direction for non-toast overlays, subject to confirming that one overlay renders once and remains usable on Android. Toast remains a separate unresolved issue: do not mark its stacking, timing, or accessibility complete until a single nonblocking viewport is verified. Keep the Modal host as a development spike until its lifecycle and interaction checks pass.

## P0 — Migration rules and infrastructure

- [ ] Capture baseline typecheck, lint, tests, screenshots, and representative workflow results; record unrelated failures and preserve existing uncommitted work.
- [x] Enforce direct `panelui-native` imports: no copied components, forks, compatibility wrappers, new custom controls, or library patches.
- [x] Add the missing direct required peer `@react-native-masked-view/masked-view` through Expo-compatible installation; retain the existing Bun package workflow.
- [x] Replace HeroUI CSS imports/vendor scanning in `src/global.css` with `panelui-native/theme.css` and `@source "../node_modules/panelui-native/src"`.
- [x] Adopt the default Panel family with device light/dark mode; remove the HeroUI cyan accent override.
- [x] Install exactly one PanelUIProvider above QueryClientProvider and TrueSheetProvider in the root layout, with all application screens beneath them. Remove HeroUI provider/toast wrapper and the outer gesture/keyboard providers supplied by PanelUI; preserve Android window/inset flags through supported PanelUIProvider props.
- [ ] Preserve authentication, React Query, Observe, splash readiness, notifications, update handling, and error boundaries.
- [x] Replace useThemeColor with Uniwind useCSSVariable; retain the nonvisual navigation-theme adapter using resolved PanelUI tokens.
- [x] Verify surface→card, muted text→muted-foreground, accent→primary, and danger→destructive translations against installed tokens, including status/surface variants.
- [x] Replace toast calls with PanelUI useToast, preserving severity, actions, duration, and dismissal.
- [ ] Before broad screen conversion, run a minimal integration spike using the existing root and a representative TrueSheet: verify PanelUI controls, keyboard, Select/DatePicker/Dialog, and toast stacking above the native sheet on Android. Treat invisible or untouchable portals as a migration blocker, not something provider reordering alone is assumed to fix. A native overlay host spike is authorized; do not patch either library without a further decision.

## P1 — Shared controls and behavior contracts

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
- [ ] Replace generic action dialogs, fields, close buttons, loading/error displays, settings rows, skeleton wrappers, FABs, countdowns, and QR disclosures with direct PanelUI composition; delete unused helper files.
- [ ] Retain React Hook Form and Zod; use their Controller render bindings directly with PanelUI controls, removing HeroUI-dependent visual controller wrappers without adding a second form-state system.
- [ ] Move reusable parsing, validation, formatting, and controller logic into nonvisual hooks/utilities.
- [ ] Use NumberInput for quantities/simple steppers. Use stock Input/InputGroup with existing localized parsing for currency/decimal fields: NumberInput uses parseFloat and cannot safely parse Indonesian grouping/decimal commas.
- [ ] Preserve numeric empty states, intermediate edits, bounds, precision, formatting, and API serialization.
- [ ] Remove HeroUI DatePickerOption types; convert UI selections to existing API date strings without timezone shifts. Use Dialog + Calendar where DatePicker lacks dialog presentation.
- [ ] Preserve time values, locale, hour cycle, and min/max restrictions through TimePicker conversions.
- [ ] Keep sorting in screen state/pure utilities; preserve server sorting, pagination, selection, row actions, and virtualization for large tables.
- [ ] Replace charts with PanelUI series/axes/tooltips/legends while preserving aggregation, ranges, labels, values, and currency formatting.
- [ ] Apply PanelUI typography and semantic tokens; keep className chiefly for layout, persistent labels, readable numeric alignment, and accessible icon actions.

## P1 — Overlay orchestration

- [ ] Retain the TrueSheet dependency, TrueSheetProvider, refs, names, present/dismiss/resize methods, detents, and existing lifecycle behavior.
- [ ] Keep the global POS add-on sheet root-mounted and driven by existing selection state.
- [ ] Replace HeroUI BottomSheet presentations with TrueSheet using established application conventions; compose their controls directly from PanelUI.
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

- [ ] Remove heroui-native and heroui-native-pro, then remove the vendored HeroUI Pro directory.
- [ ] Remove the HeroUI Pro resolver override from metro.config.js; retain Uniwind configuration.
- [ ] Retain TrueSheet dependency/provider and confirm cleanup does not remove its integrations.
- [ ] Remove @gorhom/bottom-sheet only after confirming no remaining direct consumer requires it.
- [ ] Remove Victory, Skia, Skia installation scripts, and external QR rendering only after confirming no remaining domain/export integration requires them.
- [ ] Update Bun lockfile through the package workflow and verify a clean dependency installation.
- [ ] Remove obsolete helpers and active HeroUI setup documentation; preserve user-requested skills and historical documents.
- [ ] Scan active application source/configuration for HeroUI imports, types, providers, styles, aliases, and vendor references; require zero HeroUI runtime references. TrueSheet references are expected and retained.

## P4 — Final validation and acceptance

- [ ] Restart Metro with a clear cache after complete source conversion and verify themed controls, overlays, keyboard handling, status/navigation bars, and toast visibility.
- [ ] Run `bun run typecheck`, `bun run lint`, and `bun test`; compare with recorded baseline failures.
- [ ] Add focused regression coverage for Indonesian number parsing, date serialization, sorting, payment completion, and overlay transitions.
- [ ] Run React Doctor and resolve migration-caused diagnostics.
- [ ] Build an Android bundle with cleared Metro cache to verify exports, peers, styling, and removed resolver paths.
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

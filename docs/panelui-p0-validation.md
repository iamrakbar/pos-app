# PanelUI P0 implementation and verification

Status: infrastructure implemented; Android integration acceptance pending. Do not begin broad screen conversion until the native overlay gate passes.

## Baseline (before P0 edits)

- `bun run typecheck`: fails at `tests/product-inventory.test.ts:234`; optional `inventoryEnabled` is passed where a required boolean is expected.
- `bun run lint`: passes, 54 existing warnings, localization catalogs match (1,381 keys each).
- `bun test`: 8 pass, 3 fail in `tests/product-inventory.test.ts`: product creation/save orchestration, existing-product save, and retaining a created product after inventory failure.
- Screenshots and representative device workflows could not be captured: `adb devices` returns an empty list; this host has no Android emulator installation or configured AVD. No visual baseline is claimed.
- Pre-existing changes to package/lock/configuration/skills and unrelated untracked documentation were preserved. Plan checkpoint: `b19dc6b`.

## Implemented infrastructure

- Added Expo SDK 57's mapped `@react-native-masked-view/masked-view` version `0.3.2` using `bunx expo install … --bun`; PanelUI remains 0.115.0.
- CSS imports PanelUI's theme and scans its installed source; HeroUI CSS, vendor scanning, and cyan override are removed.
- One root PanelUIProvider owns gestures, keyboard provider, portal host, and toast viewport. React Query and TrueSheet providers remain below it. Removed HeroUI provider and custom toast wrapper.
- Existing KeyboardProvider had no explicit window flags. PanelUI passes unset flags through to the same controller defaults; no flags are forced under Expo's edge-to-edge window. Existing Android status/navigation bar configuration remains.
- Authentication guards, query retry policy/client reference, Observe wrapping/readiness, splash readiness, notification manager, root POS add-on sheet, banners, updates, and error boundary remain in place.
- System light/dark Panel family remains the default. Existing persisted light/dark user preference is preserved. Status bar now follows the resolved Uniwind theme rather than ignoring explicit app theme selection.
- All 85 application theme-hook calls use Uniwind `useCSSVariable`; navigation retains its nonvisual adapter. All literal requested tokens exist in installed PanelUI CSS. Dynamic metric colors use verified secondary/success/warning foreground tokens.
- All application useToast imports now come directly from PanelUI. Installed 0.115.0 uses `toast.show({ label, description, … })`, not the newer callable/title example in the skill reference. `danger` maps to `destructive`, including conditional payment severity and the nonvisual product-save contract. Existing labels/descriptions and other toast options are retained; no custom toast renderer added.
- ESLint prevents restoring HeroUI theme/toast/provider imports and importing PanelUI implementation subpaths. Existing HeroUI controls stay until P1/P2; no compatibility wrapper, copied control, fork, or library patch introduced.

## Token translation

| HeroUI meaning                         | PanelUI variable                                            |
| -------------------------------------- | ----------------------------------------------------------- |
| background / foreground / border       | same name under `--color-`                                  |
| surface                                | `--color-card`                                              |
| surface-secondary                      | `--color-surface-secondary`                                 |
| muted text                             | `--color-muted-foreground`                                  |
| accent / accent-foreground             | `--color-primary` / `--color-primary-foreground`            |
| accent-soft / accent-soft-foreground   | `--color-secondary` / `--color-secondary-foreground`        |
| danger / danger-soft-foreground        | `--color-destructive`                                       |
| warning-soft-foreground                | `--color-warning-foreground`                                |
| metric success/warning soft foreground | `--color-success-foreground` / `--color-warning-foreground` |

Remaining HeroUI visual classes and component internals are P1/P2 work. This intermediate tree is not a release candidate.

## Android integration gate

Development-only `/panelui-integration` route is registered under the existing root and protected by `__DEV__`. It contains direct PanelUI controls inside a ref-controlled TrueSheet with fractional detents and native scrolling; no second provider or custom overlay host.

Required on-device procedure:

1. Open the development route and present TrueSheet; verify PanelUI styling in light and dark mode.
2. Focus Input; type, scroll, expand, and ensure focused controls remain reachable with the keyboard visible.
3. Open Select in both built-in sheet and overlay presentations; choose Second and confirm the trigger/state updates.
4. Open DatePicker; select a date and confirm its value. Open Dialog; verify its title/content and touchable close button.
5. Fire the persistent toast; verify it appears above the native sheet and its action dismisses it. Repeat while another overlay is open.
6. Check Android back, keyboard dismissal, sheet drag/backdrop dismissal, reopening, and TalkBack focus containment.
7. Record screenshots, device/build identity, and each result before checking the P0 integration task.

Source inspection is insufficient to pass this gate: TrueSheet 3.11.9 adds its coordinator to the native window content root (`TrueSheetView.kt`, `findRootContainerView`/presentation), while PanelUI's PortalHost renders absolute React Native views inside its provider surface. This creates a potential ordering/touch/accessibility conflict. No working stacking behavior is claimed. Do not fix this with copied portals, another PanelUIProvider, or library patches.

## Post-change checks

- `bun run lint`: passes, 0 errors / 54 warnings, unchanged from baseline; localization passes.
- `bun run typecheck`: same single baseline inventory-test type error; no new application errors.
- `bun test`: same 8 pass / 3 baseline failures.
- `bunx react-doctor@latest --verbose --scope changed`: 100/100, 77 files scanned, no issues found.
- `APP_VARIANT=development bunx expo export --platform android --clear --output-dir /tmp/pos-panelui-p0/android-export`: succeeds; Hermes Android bundle and metadata emitted. This is bundling evidence, not a native build or device acceptance.
- Source audit: 30 direct PanelUI imports; zero remaining `useThemeColor`/HeroUI provider references; no invalid danger toast severity; all literal runtime token requests found in installed CSS; exactly one root PanelUIProvider in the required order.
- `git diff --check`: passes.
- Android screenshots, workflow baseline, and the integration gate remain unverified because there is no device/emulator. Those two P0 checkboxes intentionally remain open. No P1/P2 screen conversion was started.

Raw command logs and export artifacts are in `/tmp/pos-panelui-p0/` on this host. Baseline failures are outside this migration's scope.

## Android device result — 2026-10-28

A connected Android tablet running `id.soeat.pos.dev` loaded the development bundle and the acceptance route. TrueSheet opened and displayed the PanelUI input and other controls. Tapping the default Select trigger opened its PanelUI sheet **behind** the native TrueSheet: the option sheet and backdrop are visible only around the edges of the TrueSheet, which covers the central content. Screenshot: `/tmp/pos-panelui-p0/select-result.png`. This fails the required overlay stacking gate. The remaining overlay, keyboard, accessibility, and baseline workflow checks are not yet complete. Keep the integration checkbox open and do not begin broad screen conversion until a supported solution is verified.

The documented Select `presentation="overlay"` was also tested on the same Android device. Its options appeared behind TrueSheet and were displaced to the left of the trigger; screenshot: `/tmp/pos-panelui-p0/overlay.png`. Both tested portal presentations fail the stacking gate.

Dialog also fails: after tapping Open dialog, the accessibility hierarchy contains the dialog title and close control, but the screenshot shows TrueSheet covering the centered dialog (`/tmp/pos-panelui-p0/dialog.png`). This confirms the problem is shared by multiple PanelUI root-portal overlays.

Toast also appears behind TrueSheet: its label and action are visible only outside the sheet bounds (`/tmp/pos-panelui-p0/toast.png`). This fails the toast stacking gate.

Supported API review: PanelUI Select offers `inline`, which avoids the portal but changes presentation and does not address Dialog, DatePicker, or Toast. Its optional native picker/sheet changes the chosen default rendering. TrueSheet documentation suggests a separate native Modal or FullWindowOverlay for overlays above a sheet; using an additional overlay host conflicts with this plan’s explicit no-custom-portal/single-provider constraints and has not been adopted. No documented configuration found yet resolves all required controls while preserving those constraints.

DatePicker popover also opens behind TrueSheet on Android; the calendar appears partly to the left of the sheet and its remaining content is covered (`/tmp/pos-panelui-p0/date-open.png`). PanelUI Input accepted typed text and remained visible when the sheet expanded, but full keyboard reachability and dismissal tests remain open.

Further installed-source audit: PanelUIProvider 0.115.0 mounts its PortalHost and ToastViewport internally within ProviderSurface and exposes no host-placement prop. TrueSheet’s own advanced-patterns guide explicitly identifies Android CoordinatorLayout stacking and recommends a native Modal for overlays. Applying that recommendation to PanelUI’s internally owned host would require a change to the current provider/portal constraint or upstream library support; simply changing provider nesting does not relocate the host.

Baseline recheck: an `id.soeat.pos.preview` app (version 0.0.1, versionCode 3) is installed on the connected device, but its build/source revision is not established. Its screenshots cannot be treated as the pre-migration worktree baseline without provenance; the baseline screenshot and workflow checkbox remains open.

Baseline capture: Android development client loaded source archived from commit `b19dc6b` through Metro port 8091, using current installed dependencies and development environment; sign-in screen screenshot is `/tmp/pos-panelui-p0/baseline-loaded.png`. The client is signed out, so authenticated product, inventory, order, and POS workflows remain unverified. This is a source baseline with current dependencies, not a reproduction of the original pre-migration installation.

Baseline sign-in validation: tapping Masuk with both fields empty displayed “Email wajib diisi” and “Kata sandi wajib diisi” on the Android tablet. No credentials or authenticated workflow were exercised.

Baseline empty-form validation screenshot: `/tmp/pos-panelui-p0/baseline-validation.png`. Test device model `2405CRPFDG`, Android 16, landscape tablet.

Runtime regression discovered when the app opened the authenticated route after switching Metro servers: remaining HeroUI components require HeroUI provider context. The drawer and error boundary produce `useContext: context is undefined` in HeroUI text, and the error boundary itself uses HeroUI Typography. Therefore source-preservation alone did not verify application services or error-boundary behavior; its P0 checkbox was reopened. The Modal spike cannot be assessed through this crashed app state until the acceptance route is isolated or transitional HeroUI dependencies are addressed.

Native Modal spike: with a second stock `PortalHost` in an Android Modal, the Select sheet appeared above TrueSheet (`/tmp/pos-panelui-p0/modal-select.png`); tapping Second updated both triggers and `Selected: second`. This is preliminary: the root host still exists, and duplicate rendering, toast, dialog, date, back, dismissals, and accessibility need testing before adopting this host arrangement.

Modal spike Dialog: dialog renders visibly above TrueSheet (`/tmp/pos-panelui-p0/modal-dialog.png`). Android back hid the native Modal and returned to the sheet. Reopen/state synchronization still requires verification because the spike currently closes the host independently of the Dialog state.

Modal spike state failure: after dismissing Dialog with Android back and opening DatePicker, the old Dialog reappeared behind the calendar (`/tmp/pos-panelui-p0/modal-date-open.png`). The native host closes independently while the PanelUI Dialog stays open in the shared portal store. The calendar is above TrueSheet but displaced from its trigger. This spike is not safe to adopt until modal/overlay lifecycle and anchor coordinates are corrected.

Revised Modal spike: after opening Dialog, pressing Android back, and opening DatePicker, the Android accessibility hierarchy contained the October calendar and no stale Dialog title or close action. This verifies the tested sequence only; uncontrolled Select remounts and multiple simultaneous overlays still need evaluation.

Modal spike toast: a persistent PanelUI toast rendered above TrueSheet (`/tmp/pos-panelui-p0/modal-toast.png`) and tapping Dismiss returned to the sheet. This manually controlled toast does not yet prove automatic-duration dismissal, queue stacking, or nonblocking interaction with the sheet.

Modal spike toast interaction: while the persistent toast was displayed, tapping the underlying TrueSheet Select did not open it; Android accessibility exposed only toast contents. The native Modal turns the transient notification into a blocking interaction. This fails the required toast behavior despite correct visual stacking.

In-sheet stock ToastViewport/PortalHost spike: Select remained usable while a toast existed, but the captured toast was still behind TrueSheet (`/tmp/pos-panelui-p0/inner-toast.png`); the added in-sheet host did not visibly present it above the sheet in this layout. The experiment does not meet the toast gate and may duplicate the global queue.

Sizing the in-sheet host with an absolute fill still did not produce a visible toast above the sheet (`/tmp/pos-panelui-p0/sized-toast.png`). The only visible notification remained the root toast behind TrueSheet.

Changing the in-sheet wrapper from flexGrow to flex:1 did not make its toast visible; the root toast remains behind TrueSheet (`/tmp/pos-panelui-p0/flex-toast.png`). The in-sheet viewport approach remains unverified and fails this device test.

Corrected top-placement test: a stock toast viewport inside TrueSheet renders a visible toast above the sheet (`/tmp/pos-panelui-p0/top-toast-correct.png`). The root viewport simultaneously renders the same toast behind it, confirming duplicate global-queue rendering. Top placement covers part of the input, while default bottom placement was not visible in the tested sheet. Queue ownership, viewport lifetime/timers, placement, and accessibility remain unresolved.

Top toast interaction: Select opened while the sheet-local toast was visible; after Android back closed Select, tapping the local toast action removed both copies from the shared queue. This verifies the tested interaction only, not automatic timer cleanup or duplicate accessibility announcements.

Timed toast test: with a four-second toast, pressing Android back to dismiss TrueSheet left the root toast visible beyond its duration. This is consistent with the sheet-local ToastViewport cleanup pausing the shared global timer; the duplicate viewport approach is unsuitable without resolving timer ownership.

Toast ownership source audit: PanelUIProvider exposes no prop to disable its built-in ToastViewport, and the exported toast API does not expose the internal timer store. Each additional ToastViewport subscribes to the same global queue and calls pauseTimers on unmount. A second viewport therefore cannot safely replace the root viewport using the installed public API alone.

## Sheet decision update

The user decided to continue using TrueSheet. The PanelUI/native host experiment remains a development-only spike; its toast duplication and timer failure are unresolved. The proposed three-way sheet replacement trial is cancelled. Preserve and measure the existing POS add-on FlatList and nested selection behavior.

Duplicate overlay correction: the spike had two PortalHosts subscribed to the same local portal store, so each overlay rendered twice. Removed the in-sheet host and extra ToastViewport; the local store now has only the Modal host. This removes the duplicate host/viewport source but returns to the known limitation that the root toast can render behind TrueSheet. Device verification of the correction remains pending.

Single-host verification: on Android tablet model 2405CRPFDG, Select displayed one title and one Second option in the active window; selecting Second updated the sheet. Dialog then displayed one title, Android back dismissed it, and the selected value remained Second. The two Close dialog accessibility labels correspond to the backdrop and the button, not duplicate Dialog titles. DatePicker positioning, full accessibility, and toast remain open.

Single-host DatePicker test: Android hierarchy reports one calendar title and one day entry, but its popover is displaced toward the upper-left rather than anchored to the trigger (`/tmp/pos-panelui-p0/single-date-open.png`). The picker remains a positioning failure; a supported sheet presentation should be evaluated before acceptance.

Single-host DatePicker bottom-sheet presentation: the Android device displayed one October 2026 calendar above TrueSheet; selecting 28 October closed the picker and updated its trigger to “28 Okt 2026”. Back, keyboard, and accessibility interactions remain to be validated.

DatePicker back test: Android back dismissed the picker while retaining the selected date, and the calendar reopened with one October title and one October 28 day entry.

Keyboard test: on Android landscape tablet, focusing the PanelUI Input expanded TrueSheet, displayed the keyboard, and accepted `paneltest`; the focused input remained visible above the keyboard (`/tmp/pos-panelui-p0/keyboard.png`). This does not verify every lower control or phone orientation.

Keyboard scroll: with the keyboard open in landscape, an upward swipe exposed the DatePicker, Dialog, and toast actions above the keyboard (`/tmp/pos-panelui-p0/keyboard-scroll.png`). This demonstrates reachability in the spike on this tablet, not all production sheets or phone layouts.

Keyboard-to-Dialog sequence: after scrolling with the keyboard visible, tapping Open dialog showed one Dialog; Android back returned to the sheet and the input retained `paneltest`. Actual TalkBack focus behavior remains unverified.

Accessibility hierarchy inspection shows named controls for the sheet trigger, selected date, Dialog action, toast actions, and sheet drag handle. This is not a TalkBack navigation or focus-containment test; that remains open.

TrueSheet reopen test: Android back dismissed the sheet; reopening it and opening Select produced one picker title and one Second option in the active window. This covers one dismissal/reopen cycle only.

Single-host Select-back-Dialog sequence: after Android back dismissed Select, opening Dialog produced one Dialog title with no stale Select title or option in the active window. The spike currently resets uncontrolled Select instances on back; production lifecycle and focus retention remain unverified.

Dialog close action test: tapping Close dialog returned to the sheet; tapping Select afterward displayed one picker title and no Dialog title in the active Android window.

Select backdrop test: tapping outside the Modal-hosted Select dismissed its picker and exposed the underlying sheet controls on the Android tablet.

TrueSheet resize test: tapping the spike’s Expand sheet action moved the grabber to the top detent (Android hierarchy bounds changed to y=60–132) and kept the Close sheet action visible. Overlay behavior after expansion still needs a separate check.

Expanded sheet overlay test: tapping Dialog after TrueSheet reached its top detent produced one Dialog title in the active Android window.

After dismissing the expanded-sheet Dialog with Android back, the previously selected date remained visible as “28 Okt 2026”; the Dialog title was absent from the active hierarchy. The input was outside the visible list region and was not checked in this step.

Input state after sheet dismissal/reopen: the spike uses an uncontrolled Input and its text resets when TrueSheet unmounts its content; the DatePicker value remains because it is held in parent state. Production forms must retain their existing controlled state across sheet lifecycles; this experiment does not prove that behavior.

## Working decisions and execution preference

- Retain TrueSheet for sheet presentation and orchestration, particularly the POS add-on flow and its long-list performance.
- Use stock PanelUI controls directly; avoid new custom UI components and library patches unless the user explicitly changes that constraint.
- The user accepts the native Modal host direction for non-toast overlays after verification. One local portal host avoids duplicated overlays. Toast remains an unresolved separate issue; do not claim its acceptance.
- Execute efficiently: focus on concrete P0 blockers and fast completion, batch related checks after meaningful changes, and avoid repetitive single-interaction tests or progress updates that do not advance the objective.
- P0 remains incomplete: authenticated baseline workflows are unverified, remaining HeroUI screens depend on the removed provider, and the toast solution is unverified. The error boundary now uses PanelUI, but its runtime fallback still needs validation.

Latest batched checks after single-host spike and PanelUI error-boundary change: lint passed with the same 54 warnings; typecheck still reports the baseline inventoryEnabled test type error; Bun tests still report the same 8 passes and 3 inventory-save failures. These checks do not prove runtime acceptance.

Synthetic add-on baseline: an isolated temporary checkout of commit `b19dc6b` ran the actual pre-migration POS add-on sheet on Android tablet 2405CRPFDG, Android 16, using the development client and current installed dependencies. A development-only fixture supplied 40 groups with 12 options each and a separate POS preferences storage key; no cart submission was performed. In the first group, four selected options produced the expected count and Rp 31,000 total, and an unselected fifth option became disabled at the configured maximum of four. Three rapid automated taps resulted in only two additional selections before a subsequent tap registered the fourth; this observation is not a controlled latency measurement and must not be treated as a regression. The fixture demonstrates selection behavior for a synthetic large dataset, but scrolling, quantitative response time, production-build performance, and post-migration comparison remain unverified. The actual list virtualizes groups, while each group's options are mapped together; preserve that distinction when comparing performance.

Synthetic baseline scroll and nested selection: on the same development client, selecting option 1.1, scrolling from group 1 to group 3, selecting option 3.1, and scrolling back preserved the checked state of option 1.1 and showed two selected options in the footer. Both options were free, so the total remained Rp 25,000. This verifies one cross-group selection and scroll sequence only; it does not measure responsiveness or establish migrated behavior.

Upstream recheck (2026-10-28): the npm registry lists the installed PanelUI 0.115.0 as the latest release, so upgrading does not currently expose a newer supported toast-host option. The [PanelUI installation guide](https://panelui.dev/docs/installation) and [toast documentation](https://panelui.dev/docs/components/toast) both confirm that PanelUIProvider mounts its toast viewport. The installed provider's public props do not expose a way to suppress or relocate it. This does not rule out future upstream support, but the installed public API and tested host arrangements do not meet the single nonblocking toast requirement today.

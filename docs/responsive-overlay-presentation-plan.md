# Responsive Overlay Presentation Plan

## Objective

Improve overlay usability on compact portrait phones without degrading the tablet and
landscape experience.

The application should use:

- Bottom sheets for transient choices and compact forms on portrait phones.
- Popovers for transient choices on tablets and landscape layouts.
- Centered dialogs for confirmations and short consequential prompts.
- Expo Router modal or form-sheet screens for multi-step workflows.

This is not a blanket conversion of every dialog to a bottom sheet. Presentation must follow
the interaction type.

## Responsive Rule

An overlay should use its phone presentation only when the viewport is both compact and
portrait:

```ts
const isPhonePortrait = isCompact && isPortrait;
```

Portrait tablets should retain tablet presentations. Orientation alone is not a sufficient
signal because a portrait tablet has enough space for a centered dialog or anchored popover.

Create a shared hook rather than repeating this condition:

```ts
type ChoicePresentation = "bottom-sheet" | "popover";

function useOverlayPresentation() {
  const { isCompact, isPortrait } = useResponsiveLayout();
  const isPhonePortrait = isCompact && isPortrait;

  return {
    isPhonePortrait,
    choicePresentation: isPhonePortrait ? "bottom-sheet" : "popover",
    pickerPresentation: isPhonePortrait ? "bottom-sheet" : "popover",
  } satisfies {
    isPhonePortrait: boolean;
    choicePresentation: ChoicePresentation;
    pickerPresentation: ChoicePresentation;
  };
}
```

The exact return types should follow the installed HeroUI Native and HeroUI Native Pro APIs.

## Current Overlay Inventory

### Choice and picker overlays

| Location      | Overlay                   | Current presentation |
| ------------- | ------------------------- | -------------------- |
| Settings      | Appearance Select         | Popover              |
| Settings      | Language Select           | Popover              |
| POS search    | Product sorting Select    | Popover              |
| POS cart      | Order type Select         | Popover              |
| POS cart      | Pickup TimePicker         | Popover              |
| Checkout      | Customer Select           | Popover              |
| Product form  | Category Select           | Popover              |
| Printer form  | Connection type Select    | Popover              |
| Printer form  | Receipt size Select       | Popover              |
| Receipt setup | Preview paper size Select | Popover              |
| Receipt setup | Receipt layout Select     | Popover              |
| Dashboard     | Date-range preset Select  | Popover              |
| Dashboard     | Custom-range DatePickers  | Popover              |
| App drawer    | Profile Popover           | Popover              |

### Dialog overlays

| Location          | Dialog purpose               | Interaction type        |
| ----------------- | ---------------------------- | ----------------------- |
| Shared navigation | Log out                      | Confirmation            |
| Categories        | Create/edit category         | Form                    |
| Categories        | Delete category              | Confirmation            |
| Dashboard         | Custom date range            | Form                    |
| Order detail      | QRIS payment                 | Rich information/action |
| Order detail      | Printer prompt               | Short prompt            |
| Payment success   | Printer prompt               | Short prompt            |
| Product form      | Delete product               | Confirmation            |
| Add-on form       | Delete add-on group          | Confirmation            |
| Area form         | Delete area                  | Confirmation            |
| Tables            | Create/edit table            | Form                    |
| Tables            | Delete table                 | Confirmation            |
| Printer form      | Printer status/action prompt | Short prompt            |
| Printer form      | Delete printer               | Confirmation            |

### Existing routed modal workflows

| Route           | Current responsive presentation                     |
| --------------- | --------------------------------------------------- |
| POS add-ons     | Form sheet                                          |
| Table selection | Form sheet                                          |
| Checkout        | Form sheet on wide layouts, card on compact layouts |
| Payment         | Form sheet on wide layouts, card on compact layouts |

These are workflow screens and should remain route-based.

## Presentation Decisions

### 1. Convert choice overlays adaptively

Use a bottom sheet on compact portrait phones and retain the popover elsewhere.

| Overlay                     | Phone portrait                          | Tablet or landscape |
| --------------------------- | --------------------------------------- | ------------------- |
| Settings appearance         | Bottom sheet                            | Popover             |
| Settings language           | Bottom sheet                            | Popover             |
| POS product sorting         | Bottom sheet                            | Popover             |
| POS order type              | Bottom sheet with two large choice rows | Popover             |
| POS pickup time             | Bottom sheet                            | Popover             |
| Checkout customer           | Bottom sheet                            | Popover             |
| Product category            | Bottom sheet                            | Popover             |
| Printer connection type     | Bottom sheet                            | Popover             |
| Printer receipt size        | Bottom sheet                            | Popover             |
| Receipt preview paper size  | Bottom sheet                            | Popover             |
| Receipt layout              | Bottom sheet                            | Popover             |
| Dashboard date-range preset | Bottom sheet                            | Popover             |
| Drawer profile menu         | Bottom sheet                            | Popover             |

HeroUI Select, Popover, DatePicker, and TimePicker support bottom-sheet presentation in the
installed packages. Presentation may need to be passed to both the controlling Select/Picker
and its Content component. Confirm this per component before editing.

Bottom-sheet choice lists should:

- Size to their content for short lists.
- Have a sensible maximum height for long lists.
- Respect bottom safe-area insets.
- Keep each option at least the standard touch-target height.
- Scroll only when the available height is exceeded.
- Close immediately after a single selection.
- Preserve the selected option and focus semantics.

### 2. Convert form dialogs adaptively

The following forms should use a bottom sheet on compact portrait phones and a centered dialog
on tablets and landscape:

- Create/edit category.
- Create/edit table.
- Dashboard custom date range, subject to the nested-picker design below.

HeroUI Dialog does not expose a `presentation="bottom-sheet"` switch. Implement an adaptive
wrapper that renders a HeroUI BottomSheet on phone portrait and a HeroUI Dialog elsewhere.

Suggested component contract:

```ts
type AdaptiveFormOverlayProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidthClassName?: string;
};
```

The wrapper should own:

- Overlay and portal structure.
- Consistent header alignment.
- Close affordance.
- Keyboard handling.
- Scroll containment.
- Top and bottom safe-area behavior.
- Compact-phone button stacking.
- Tablet/landscape maximum width.

It should not own form state, validation, mutations, or business logic.

### 3. Keep confirmations as centered dialogs

Do not convert the following to bottom sheets:

- Log out.
- Delete category.
- Delete product.
- Delete add-on group.
- Delete area.
- Delete table.
- Delete printer.

Confirmations are short and consequential. A centered modal interrupts the workflow clearly
and gives destructive actions the correct visual weight.

Standardize these dialogs:

- `max-w-md` on larger layouts.
- Safe-area-aware outer horizontal padding on phones.
- No swipe-to-dismiss.
- Short title and description.
- Ghost or tertiary cancel action.
- Danger variant for destructive confirmation.
- Horizontal actions where space permits.
- Stacked full-width actions only on very narrow phones.

The category component currently reuses one dialog for both editing and deletion. Split these
states:

- Category form uses the adaptive form overlay.
- Category deletion uses the standardized confirmation dialog.

This avoids changing the same open surface from a form sheet into a confirmation dialog.

### 4. Keep short prompts as centered dialogs

Retain centered dialogs for:

- Order-detail printer prompt.
- Payment-success printer prompt.
- Printer configuration status/action prompt.

These prompts communicate an error, permission requirement, or one short next action. A bottom
sheet would add visual weight without improving usability.

Use the same standardized dialog shell as confirmations, while allowing the primary action to
use a non-danger semantic variant.

### 5. Handle QRIS separately

The order-detail QRIS viewer contains rich visual content and requires more usable vertical
space than a confirmation.

Recommended behavior:

- Compact portrait phone: bottom sheet or dedicated modal route.
- Tablet and landscape: centered `max-w-md` dialog.

Choose between sheet and route after measuring the minimum QR code size, payment details, safe
areas, and smallest supported phone height. If the content cannot remain fully usable without
internal nested scrolling, use a modal route.

### 6. Avoid nested bottom sheets for custom dates

The dashboard custom-date workflow currently opens a dialog containing two DatePickers. Turning
the parent and both child pickers into bottom sheets would create nested sheets and competing
gestures.

Preferred phone design:

1. Open one custom-date bottom sheet or modal screen.
2. Present the start and end controls in a stacked layout.
3. Use inline calendars if the component supports them cleanly.
4. Otherwise keep only one modal layer open at a time.

Tablet and landscape can retain the centered dialog with popover DatePickers.

## Existing Route Modal Decisions

Keep these as Expo Router routes:

- POS add-ons.
- Table selection.
- Checkout.
- Payment.

They contain workflow state, richer layouts, or navigation transitions and should not be
reduced to transient component overlays.

Retain the current responsive behavior unless testing identifies a specific problem:

- Wide layout: form sheet.
- Compact layout: card or modal screen.

## Implementation Tasks

### Task 1: Shared responsive presentation hook

- Add `useOverlayPresentation`.
- Base phone presentation on `isCompact && isPortrait`.
- Expose typed choice and picker presentation values.
- Add focused tests if the project has a hook-testing setup.

### Task 2: Adaptive choice overlays

Migrate in this order:

1. Settings appearance and language.
2. Product category and printer form Selects.
3. Receipt setup Selects.
4. POS search sorting and order type.
5. POS TimePicker.
6. Checkout customer.
7. Dashboard range preset.
8. Drawer profile menu.

Validate each component API because Select, Popover, DatePicker, and TimePicker do not
necessarily accept presentation at the same compound-component level.

### Task 3: Shared confirmation and prompt shell

- Extract a standardized centered-dialog shell.
- Support neutral, primary, and destructive actions.
- Normalize header, description, close button, footer alignment, and phone action stacking.
- Migrate all confirmation and short-prompt dialogs.

### Task 4: Adaptive form overlay

- Implement the BottomSheet/Dialog responsive wrapper.
- Add safe-area and keyboard behavior.
- Ensure only the active presentation branch is mounted.
- Migrate the table form.
- Split category form and category deletion state.
- Migrate the category form.

### Task 5: Dashboard custom dates

- Design a single-layer phone interaction.
- Avoid nested bottom sheets.
- Preserve validation, maximum 366-day range, and future-date restrictions.
- Keep the existing tablet/landscape dialog behavior.

### Task 6: QRIS presentation

- Measure minimum content height and QR size.
- Implement adaptive sheet or modal route on phones.
- Keep the centered dialog on larger layouts.
- Test countdown, payment details, and URL disclosure.

### Task 7: Regression and accessibility pass

- Confirm Android hardware-back dismissal.
- Restore focus to the trigger after closing.
- Verify screen-reader title and description announcements.
- Confirm destructive dialogs cannot be dismissed by accidental swipe.
- Verify safe areas and keyboard behavior.
- Confirm rotation while an overlay is open does not leave two presentations mounted.

## Commit Strategy

Use separate local commits and do not push:

1. `add responsive overlay presentation hook`
2. `adapt choice overlays for phone portrait`
3. `standardize confirmation and prompt dialogs`
4. `add adaptive form overlays`
5. `adapt dashboard date range overlay`
6. `adapt QRIS payment overlay`
7. `fix responsive overlay regressions`

Each commit should include only its relevant files and preserve unrelated working-tree changes.

## Acceptance Criteria

### Responsive behavior

- Compact portrait phones use bottom sheets for choice overlays.
- Portrait tablets continue using popovers and centered dialogs.
- Landscape phones and tablets continue using popovers where adequate.
- Orientation changes do not mount both overlay presentations.
- Open overlays close safely or adapt without visual glitches during rotation.

### Bottom sheets

- Content is above the bottom safe area.
- Short option lists do not create oversized sheets.
- Long lists scroll and have a defined maximum height.
- The selected item is visible and announced.
- Android back and overlay press dismiss correctly.
- Fast swipe or scroll gestures do not make picker content disappear.

### Dialogs

- Confirmations remain centered and visually compact.
- Dialogs do not cover the OS status or navigation areas.
- Actions remain visible on the smallest supported phone.
- Destructive actions use the danger treatment.
- Close and cancel behaviors are consistent.

### Forms and keyboard

- Focused fields remain visible above the keyboard.
- Form content scrolls independently when necessary.
- The footer action remains reachable.
- Unsaved form state is not lost during ordinary keyboard or orientation changes.

### Regression matrix

Test at minimum:

- Small iPhone portrait.
- Tall iPhone portrait.
- Compact Android portrait with three-button navigation.
- Compact Android portrait with gesture navigation.
- Landscape phone.
- Portrait tablet.
- Landscape tablet.
- Light and dark themes.
- English and Indonesian.
- Keyboard open and closed.
- Short and long Select option lists.

## Out of Scope

- Replacing route-based POS workflows with component-level bottom sheets.
- Changing business logic or mutation behavior.
- Redesigning every form field.
- Converting confirmations to sheets.
- Adding new dependencies when the installed HeroUI components already support the required
  presentation.

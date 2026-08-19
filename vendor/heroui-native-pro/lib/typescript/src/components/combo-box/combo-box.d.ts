import type { TextInput as TextInputType } from 'react-native';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type * as SelectPrimitivesTypes from '../../primitives/select/select.types';
import type { ComboBoxContentProps, ComboBoxEmptyProps, ComboBoxItemProps, ComboBoxListProps, ComboBoxPortalProps, ComboBoxRootProps, ComboBoxSelectionMode, ComboBoxTriggerProps } from './combo-box.types';
declare function ComboBoxRoot<M extends ComboBoxSelectionMode = 'single'>(props: ComboBoxRootProps<M> & {
    ref?: React.Ref<SelectPrimitivesTypes.RootRef>;
}): import("react/jsx-runtime").JSX.Element;
declare namespace ComboBoxRoot {
    var displayName: string;
}
declare const ComboBoxInputGroup: import("react").ForwardRefExoticComponent<import("heroui-native").InputGroupProps & import("react").RefAttributes<View>>;
declare const ComboBoxInput: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").InputGroupInputProps, "value" | "defaultValue" | "onChangeText"> & {
    onChangeText?: import("heroui-native").InputGroupInputProps["onChangeText"];
} & import("react").RefAttributes<TextInputType>>;
declare const ComboBoxPrefix: import("react").ForwardRefExoticComponent<import("heroui-native").InputGroupPrefixProps & import("react").RefAttributes<View>>;
declare const ComboBoxSuffix: import("react").ForwardRefExoticComponent<import("heroui-native").InputGroupSuffixProps & import("react").RefAttributes<View>>;
/**
 * Wraps the input group so the popover anchors to (and can match) the full
 * input width. Taps on the text input still focus it; taps elsewhere on the
 * group (e.g. the chevron suffix) toggle the popover.
 */
declare const ComboBoxTrigger: import("react").ForwardRefExoticComponent<ComboBoxTriggerProps & import("react").RefAttributes<SelectPrimitivesTypes.TriggerRef>>;
declare const ComboBoxTriggerIndicator: import("react").ForwardRefExoticComponent<import("heroui-native").SelectTriggerIndicatorProps & import("react").RefAttributes<View>>;
/**
 * Rendered inside the input group suffix, before the trigger indicator.
 * Hidden while there is no selection and the input is empty. Pressing it
 * clears the selection (`undefined` in single mode, `[]` in multiple mode)
 * and the input text, then calls `onClear` from the `ComboBox` root. Being
 * its own pressable, it does not toggle the popover.
 */
declare const ComboBoxClearButton: import("react").ForwardRefExoticComponent<import("heroui-native").CloseButtonProps & import("react").RefAttributes<View>>;
declare const ComboBoxValue: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").SelectValueProps, "placeholder"> & {
    placeholder?: string;
} & import("react").RefAttributes<import("react-native").Text>>;
/**
 * `Select.Portal` renders into a host via the portal system, which breaks
 * React context from ancestors. Re-wrap `children` with `ComboBoxProvider`
 * so `ComboBox.Item` / `ComboBox.Empty` can still call `useComboBox()` when
 * portaled.
 */
declare function ComboBoxPortal(props: ComboBoxPortalProps): import("react/jsx-runtime").JSX.Element;
declare namespace ComboBoxPortal {
    var displayName: string;
}
declare const ComboBoxOverlay: import("react").ForwardRefExoticComponent<import("heroui-native").SelectOverlayProps & import("react").RefAttributes<View>>;
/**
 * Popover-only content: `presentation` is fixed to `"popover"`, `width`
 * defaults to `"trigger"` so the popover matches the input group width, and
 * a small default `offset` separates it from the input.
 */
declare const ComboBoxContent: import("react").ForwardRefExoticComponent<ComboBoxContentProps & import("react").RefAttributes<View>>;
declare const ComboBoxContentBackground: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    className?: string;
} & import("react").RefAttributes<View>>;
/**
 * Scrollable container for items. `keyboardShouldPersistTaps="handled"` keeps
 * item presses working in a single tap while the keyboard is open.
 */
declare const ComboBoxList: import("react").ForwardRefExoticComponent<ComboBoxListProps & import("react").RefAttributes<ScrollView>>;
/**
 * `Select.Item` filtered by the current input text. The item registers its
 * filter text (`textValue` falling back to `label`) with the provider so
 * `ComboBox.Empty` knows when nothing matches, and renders `null` while it
 * does not match.
 */
declare const ComboBoxItem: import("react").ForwardRefExoticComponent<ComboBoxItemProps & import("react").RefAttributes<View>>;
declare const ComboBoxItemLabel: import("react").ForwardRefExoticComponent<import("heroui-native").SelectItemLabelProps & import("react").RefAttributes<import("react-native").Text>>;
declare const ComboBoxItemDescription: import("react").ForwardRefExoticComponent<import("heroui-native").SelectItemDescriptionProps & import("react").RefAttributes<import("react-native").Text>>;
declare const ComboBoxItemIndicator: import("react").ForwardRefExoticComponent<import("heroui-native").SelectItemIndicatorProps & import("react").RefAttributes<View>>;
declare const ComboBoxListLabel: import("react").ForwardRefExoticComponent<import("heroui-native").SelectListLabelProps & import("react").RefAttributes<import("react-native").Text>>;
/**
 * Fallback shown when no registered item matches the current input text
 * (also covers an empty item collection). String (or omitted) `children`
 * render inside a styled text element; custom nodes render as-is.
 */
declare const ComboBoxEmpty: import("react").ForwardRefExoticComponent<ComboBoxEmptyProps & import("react").RefAttributes<View>>;
/**
 * Static parts attached to the root. We assign properties explicitly instead
 * of only using `Object.assign`: some Metro / Hermes bundles do not reliably
 * retain every key on `forwardRef` results (see the same note on `DateField`).
 */
type ComboBoxStaticParts = {
    InputGroup: typeof ComboBoxInputGroup;
    Input: typeof ComboBoxInput;
    Prefix: typeof ComboBoxPrefix;
    Suffix: typeof ComboBoxSuffix;
    Trigger: typeof ComboBoxTrigger;
    TriggerIndicator: typeof ComboBoxTriggerIndicator;
    ClearButton: typeof ComboBoxClearButton;
    Value: typeof ComboBoxValue;
    Portal: typeof ComboBoxPortal;
    Overlay: typeof ComboBoxOverlay;
    Content: typeof ComboBoxContent;
    ContentBackground: typeof ComboBoxContentBackground;
    List: typeof ComboBoxList;
    ListLabel: typeof ComboBoxListLabel;
    Item: typeof ComboBoxItem;
    ItemLabel: typeof ComboBoxItemLabel;
    ItemDescription: typeof ComboBoxItemDescription;
    ItemIndicator: typeof ComboBoxItemIndicator;
    Empty: typeof ComboBoxEmpty;
};
declare const ComboBox: typeof ComboBoxRoot & ComboBoxStaticParts;
/**
 * `ComboBox` — a text input combined with a listbox popover, letting users
 * filter a collection of options to items matching a query. Composes the
 * heroui-native `Select` (popover presentation only) and `InputGroup`,
 * mirroring the HeroUI web ComboBox anatomy.
 *
 * @note RTL: fully inherited. The input group (measured affix widths as
 * `paddingStart`/`paddingEnd`, `rtl:text-right` on the `TextInput`), the
 * popover start/end alignment, and the trigger indicator are all handled by
 * the underlying heroui-native `InputGroup` and `Select`. The component's own
 * styles only use logical or symmetric properties, so there is nothing
 * directional to override here.
 *
 * @component ComboBox - Root that wraps `Select` and manages the input text,
 * item filtering, popover opening, and form field context. Accepts all
 * `Select` root props (selection modes, open state) plus `inputValue` /
 * `onInputChange`, `menuTrigger`, and `filter`. The popover presentation is
 * fixed.
 *
 * @component ComboBox.Trigger - Unstyled pressable that wraps the input
 * group so the popover anchors to the full input width.
 *
 * @component ComboBox.InputGroup - Input group wrapper containing the text
 * input and optional prefix/suffix slots. Inherits `isDisabled` from the root.
 *
 * @component ComboBox.Input - Text input wired to the combo box. Typing
 * filters the items; focus/typing opens the popover per `menuTrigger`.
 *
 * @component ComboBox.Prefix - Optional leading slot inside the input group.
 * @optional
 *
 * @component ComboBox.Suffix - Optional trailing slot inside the input
 * group; typically holds the trigger indicator. @optional
 *
 * @component ComboBox.TriggerIndicator - Chevron indicator that rotates with
 * the open state. @optional
 *
 * @component ComboBox.ClearButton - Optional close button inside the input
 * group suffix that clears the selection and input text, then calls
 * `onClear`. Hidden while there is no selection and the input is empty.
 * @optional
 *
 * @component ComboBox.Value - Selected labels or placeholder (primarily for
 * multiple mode). @optional
 *
 * @component ComboBox.Portal - Portals the overlay and content above the app
 * content, re-providing the combo box context.
 *
 * @component ComboBox.Overlay - Backdrop behind the popover; transparent by
 * default and dismisses on press. @optional
 *
 * @component ComboBox.Content - Popover content container (`width` defaults
 * to `"trigger"`).
 *
 * @component ComboBox.ContentBackground - Theme-aware background layer
 * behind the content. @optional
 *
 * @component ComboBox.List - Scrollable list container that keeps item taps
 * working while the keyboard is open.
 *
 * @component ComboBox.ListLabel - Section label for grouped items. @optional
 *
 * @component ComboBox.Item - Selectable option filtered by the input text
 * (`textValue` overrides `label` for matching).
 *
 * @component ComboBox.ItemLabel - Label text for an item. @optional
 *
 * @component ComboBox.ItemDescription - Muted description text for an item.
 * @optional
 *
 * @component ComboBox.ItemIndicator - Check indicator for selected items.
 * @optional
 *
 * @component ComboBox.Empty - Fallback shown when no item matches the input
 * text. @optional
 *
 * Props flow from ComboBox to sub-components via context.
 */
export default ComboBox;
//# sourceMappingURL=combo-box.d.ts.map
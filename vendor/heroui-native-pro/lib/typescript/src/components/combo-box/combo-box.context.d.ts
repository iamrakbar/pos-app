import type { TextInput } from 'react-native';
import type * as SelectPrimitivesTypes from '../../primitives/select/select.types';
import type { ComboBoxFilter, ComboBoxMenuTrigger } from './combo-box.types';
/**
 * Context for `ComboBox` managed input text, item filtering, and popover
 * opening. Selection and open state stay in the wrapped `Select` (read them
 * via `useSelect` from `heroui-native/select` when needed).
 */
export interface ComboBoxContextValue {
    /**
     * Current text shown in `ComboBox.Input`.
     */
    inputValue: string;
    /**
     * Text driving item filtering. Usually equals `inputValue`, except in
     * single mode when the input shows the committed selection label — then it
     * is `""` so reopening the popover shows the full collection.
     */
    filterText: string;
    /**
     * Updates the input text. In single mode, clearing the text also clears
     * the selection.
     */
    onInputChange: (value: string) => void;
    /**
     * Commits the input text on blur while the popover is closed (single mode
     * reverts to the selected label; multiple mode clears the text).
     */
    onInputBlur: () => void;
    /**
     * Opens the popover through `ComboBox.Trigger` (measures the trigger so
     * the popover anchors to the input group). No-op while open or disabled.
     */
    openMenu: () => void;
    /**
     * Interaction that opens the popover (`"focus"`, `"input"`, or `"manual"`).
     */
    menuTrigger: ComboBoxMenuTrigger;
    /**
     * Predicate deciding whether an item matches the current filter text.
     */
    filter: ComboBoxFilter;
    /**
     * Registers an item's filter text so the root can compute the visible
     * count for `ComboBox.Empty`. Called by `ComboBox.Item` on mount.
     */
    registerItem: (value: string, textValue: string) => void;
    /**
     * Removes an item from the registry. Called by `ComboBox.Item` on unmount.
     */
    unregisterItem: (value: string) => void;
    /**
     * Number of registered items matching the current filter text
     * (equals the registry size while the filter text is empty).
     */
    visibleItemCount: number;
    /**
     * `onClear` from the `ComboBox` root — called after
     * `ComboBox.ClearButton` clears the selection and input text.
     */
    onClear: (() => void) | undefined;
    /**
     * `isDisabled` from the `ComboBox` root (for merging into sub-components).
     */
    isDisabledRoot: boolean;
    /**
     * Ref to the text input, attached by `ComboBox.Input` (used to dismiss the
     * keyboard when the popover closes).
     */
    inputRef: React.RefObject<TextInput | null>;
    /**
     * Ref to the trigger, attached by `ComboBox.Trigger` (used by `openMenu`
     * to measure and open the popover imperatively).
     */
    triggerRef: React.RefObject<SelectPrimitivesTypes.TriggerRef | null>;
}
declare const ComboBoxProvider: import("react").Provider<ComboBoxContextValue>, useComboBox: () => ComboBoxContextValue;
/**
 * Props for the internal `ComboBoxStateProvider` (wired by the `ComboBox` root).
 */
interface ComboBoxStateProviderProps {
    inputValue: string | undefined;
    defaultInputValue: string | undefined;
    onInputChange: ((value: string) => void) | undefined;
    menuTrigger: ComboBoxMenuTrigger;
    filter: ComboBoxFilter;
    onClear: (() => void) | undefined;
    isDisabledRoot: boolean;
    children: React.ReactNode;
}
/**
 * Provides input text state, filtering, and open/commit behavior for the
 * `ComboBox` parts. Must render inside the wrapped `Select` root so it can
 * read the selection and open state from the `Select` context.
 *
 * Behavior summary:
 * - Single mode: selecting an item writes its label into the input; clearing
 *   the input clears the selection; closing the popover reverts the input to
 *   the selected label (custom values are not kept).
 * - Multiple mode: the input acts as a search field and is cleared when the
 *   popover closes; selection is displayed via `ComboBox.Value`.
 */
declare function ComboBoxStateProvider(props: ComboBoxStateProviderProps): import("react/jsx-runtime").JSX.Element;
export { ComboBoxProvider, ComboBoxStateProvider, useComboBox };
//# sourceMappingURL=combo-box.context.d.ts.map
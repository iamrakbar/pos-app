import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type * as SelectPrimitivesTypes from '../../primitives/select/select.types';
import type { AutocompleteEmptyProps, AutocompleteItemProps, AutocompleteListProps, AutocompletePortalProps, AutocompleteRootProps, AutocompleteSearchFieldProps, AutocompleteSelectionMode, AutocompleteTriggerProps } from './autocomplete.types';
declare function AutocompleteRoot<M extends AutocompleteSelectionMode = 'single'>(props: AutocompleteRootProps<M> & {
    ref?: React.Ref<SelectPrimitivesTypes.RootRef>;
}): import("react/jsx-runtime").JSX.Element;
declare namespace AutocompleteRoot {
    var displayName: string;
}
/**
 * `Select.Portal` renders into a host via the portal system, which breaks
 * React context from ancestors. Re-wrap `children` with `AutocompleteProvider`
 * so `Autocomplete.SearchField` / `Autocomplete.Item` / `Autocomplete.Empty`
 * can still call `useAutocomplete()` when portaled.
 */
declare function AutocompletePortal(props: AutocompletePortalProps): import("react/jsx-runtime").JSX.Element;
declare namespace AutocompletePortal {
    var displayName: string;
}
/**
 * Autocomplete — a searchable `Select`: selection lives on the trigger while
 * filtering happens through a `SearchField` rendered inside the portaled
 * content. Mirrors the HeroUI web Autocomplete anatomy on top of the
 * heroui-native `Select` and `SearchField` components.
 *
 * @note RTL: fully inherited. Trigger row order, popover start/end alignment,
 * the chevron indicator, and the search input (icon mirroring, `rtl:text-right`
 * on the `TextInput`) are all handled by the underlying heroui-native `Select`
 * and `SearchField`. The component's own styles only use logical
 * (`padding-inline`) or symmetric properties, so there is nothing directional
 * to override here.
 *
 * @component Autocomplete - Root that wraps `Select` and manages the search
 * text, item filtering, and clear behavior. Accepts all `Select` root props
 * (selection modes, open state, presentation) plus `inputValue` /
 * `onInputChange`, `filter`, `clearInputOnClose`, and `onClear`.
 *
 * @component Autocomplete.Trigger - Pressable field surface that toggles the
 * overlay. Applies a danger border when the field is invalid.
 *
 * @component Autocomplete.Value - Selected label(s) or placeholder
 * (defaults to "Select an item").
 *
 * @component Autocomplete.TriggerIndicator - Optional chevron indicator that
 * rotates with the open state. @optional
 *
 * @component Autocomplete.ClearButton - Optional close button inside the
 * trigger row that clears the selection and calls `onClear`. Hidden while
 * nothing is selected. @optional
 *
 * @component Autocomplete.Portal - Portals the overlay and content above the
 * app content, re-providing the autocomplete context.
 *
 * @component Autocomplete.Overlay - Backdrop behind the content. @optional
 *
 * @component Autocomplete.Content - Content container with popover (default),
 * bottom-sheet, or dialog presentation.
 *
 * @component Autocomplete.ContentBackground - Theme-aware background layer
 * behind the content. @optional
 *
 * @component Autocomplete.SearchField - Search input wired to the
 * autocomplete search text, rendered at the top of the content.
 *
 * @component Autocomplete.List - Scrollable list container that keeps item
 * taps working while the keyboard is open.
 *
 * @component Autocomplete.Item - Selectable option filtered by the search
 * text (`textValue` overrides `label` for matching).
 *
 * @component Autocomplete.ItemLabel - Label text for an item. @optional
 *
 * @component Autocomplete.ItemDescription - Muted description text for an
 * item. @optional
 *
 * @component Autocomplete.ItemIndicator - Check indicator for selected
 * items. @optional
 *
 * @component Autocomplete.ListLabel - Section label for grouped items.
 * @optional
 *
 * @component Autocomplete.Empty - Fallback shown when no item matches the
 * search text. @optional
 *
 * @component Autocomplete.Close - Close button for the overlay (useful in
 * bottom-sheet and dialog presentations). @optional
 *
 * Props flow from Autocomplete to sub-components via context.
 */
declare const Autocomplete: typeof AutocompleteRoot & {
    Trigger: import("react").ForwardRefExoticComponent<AutocompleteTriggerProps & import("react").RefAttributes<SelectPrimitivesTypes.TriggerRef>>;
    Value: import("react").ForwardRefExoticComponent<Omit<import("heroui-native").SelectValueProps, "placeholder"> & {
        placeholder?: string;
    } & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Chevron indicator that rotates with the open state. */
    TriggerIndicator: import("react").ForwardRefExoticComponent<import("heroui-native").SelectTriggerIndicatorProps & import("react").RefAttributes<View>>;
    /** @optional Clears the selection; hidden while nothing is selected. */
    ClearButton: import("react").ForwardRefExoticComponent<import("heroui-native").CloseButtonProps & import("react").RefAttributes<View>>;
    Portal: typeof AutocompletePortal;
    /** @optional Backdrop behind the portaled content. */
    Overlay: import("react").ForwardRefExoticComponent<import("heroui-native").SelectOverlayProps & import("react").RefAttributes<View>>;
    Content: import("react").ForwardRefExoticComponent<import("heroui-native").SelectContentProps & import("react").RefAttributes<View>>;
    /** @optional Theme-aware background layer behind the content. */
    ContentBackground: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
        className?: string;
    } & import("react").RefAttributes<View>>;
    SearchField: import("react").ForwardRefExoticComponent<AutocompleteSearchFieldProps & import("react").RefAttributes<View>>;
    List: import("react").ForwardRefExoticComponent<AutocompleteListProps & import("react").RefAttributes<ScrollView>>;
    Item: import("react").ForwardRefExoticComponent<AutocompleteItemProps & import("react").RefAttributes<View>>;
    /** @optional Label text for an item. */
    ItemLabel: import("react").ForwardRefExoticComponent<import("heroui-native").SelectItemLabelProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Muted description text for an item. */
    ItemDescription: import("react").ForwardRefExoticComponent<import("heroui-native").SelectItemDescriptionProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Check indicator for selected items. */
    ItemIndicator: import("react").ForwardRefExoticComponent<import("heroui-native").SelectItemIndicatorProps & import("react").RefAttributes<View>>;
    /** @optional Section label for grouped items. */
    ListLabel: import("react").ForwardRefExoticComponent<import("heroui-native").SelectListLabelProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Fallback shown when no item matches the search text. */
    Empty: import("react").ForwardRefExoticComponent<AutocompleteEmptyProps & import("react").RefAttributes<View>>;
    /** @optional Close button for the overlay. */
    Close: import("react").ForwardRefExoticComponent<import("heroui-native").CloseButtonProps & import("react").RefAttributes<View>>;
};
export default Autocomplete;
//# sourceMappingURL=autocomplete.d.ts.map
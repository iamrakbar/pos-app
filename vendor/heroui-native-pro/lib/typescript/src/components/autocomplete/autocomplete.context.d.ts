import type { AutocompleteFilter } from './autocomplete.types';
/**
 * Context for `Autocomplete` managed search text and item filtering.
 * Selection and open state stay in the wrapped `Select` (read them via
 * `useSelect` from `heroui-native/select` when needed).
 */
export interface AutocompleteContextValue {
    /**
     * Current search text driving item filtering.
     */
    inputValue: string;
    /**
     * Updates the search text.
     */
    onInputChange: (value: string) => void;
    /**
     * Predicate deciding whether an item matches the current search text.
     */
    filter: AutocompleteFilter;
    /**
     * Registers an item's filter text so the root can compute the visible
     * count for `Autocomplete.Empty`. Called by `Autocomplete.Item` on mount.
     */
    registerItem: (value: string, textValue: string) => void;
    /**
     * Removes an item from the registry. Called by `Autocomplete.Item` on unmount.
     */
    unregisterItem: (value: string) => void;
    /**
     * Number of registered items matching the current search text
     * (equals the registry size while the search text is empty).
     */
    visibleItemCount: number;
    /**
     * `onClear` from the `Autocomplete` root — called after
     * `Autocomplete.ClearButton` clears the selection.
     */
    onClear: (() => void) | undefined;
    /**
     * `isDisabled` from the `Autocomplete` root (for merging into sub-components).
     */
    isDisabledRoot: boolean;
}
declare const AutocompleteProvider: import("react").Provider<AutocompleteContextValue>, useAutocomplete: () => AutocompleteContextValue;
export { AutocompleteProvider, useAutocomplete };
//# sourceMappingURL=autocomplete.context.d.ts.map
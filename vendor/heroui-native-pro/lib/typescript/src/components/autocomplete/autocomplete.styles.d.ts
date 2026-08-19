/**
 * Empty fallback shown when no item matches the search text. Renders two
 * elements within one part: a centered container and a muted text.
 */
declare const empty: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            text?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            text?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    text: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            text?: import("tailwind-merge").ClassNameValue;
            container?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    text: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    text: string;
}, undefined, unknown, unknown, undefined>>;
export type EmptySlots = keyof ReturnType<typeof empty>;
export declare const autocompleteClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "autocomplete__root", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "autocomplete__root", unknown, unknown, undefined>>;
    trigger: import("tailwind-variants").TVReturnType<{
        isInvalid: {
            true: string;
            false: string;
        };
    }, undefined, "autocomplete__trigger", {
        isInvalid: {
            true: string;
            false: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        isInvalid: {
            true: string;
            false: string;
        };
    }, undefined, "autocomplete__trigger", unknown, unknown, undefined>>;
    overlay: import("tailwind-variants").TVReturnType<{
        presentation: {
            popover: string;
            'bottom-sheet': string;
            dialog: string;
        };
    }, undefined, "autocomplete__overlay", {
        presentation: {
            popover: string;
            'bottom-sheet': string;
            dialog: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        presentation: {
            popover: string;
            'bottom-sheet': string;
            dialog: string;
        };
    }, undefined, "autocomplete__overlay", unknown, unknown, undefined>>;
    clearButton: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "autocomplete__clear-button", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "autocomplete__clear-button", unknown, unknown, undefined>>;
    searchField: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "autocomplete__search-field", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "autocomplete__search-field", unknown, unknown, undefined>>;
    list: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "autocomplete__list", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "autocomplete__list", unknown, unknown, undefined>>;
    item: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "autocomplete__item", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "autocomplete__item", unknown, unknown, undefined>>;
    empty: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                text?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                text?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        text: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                text?: import("tailwind-merge").ClassNameValue;
                container?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        text: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        text: string;
    }, undefined, unknown, unknown, undefined>>;
}>;
export {};
//# sourceMappingURL=autocomplete.styles.d.ts.map
/**
 * Empty fallback shown when no item matches the input text. Renders two
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
export declare const comboBoxClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "combo-box__root", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "combo-box__root", unknown, unknown, undefined>>;
    overlay: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "combo-box__overlay", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "combo-box__overlay", unknown, unknown, undefined>>;
    value: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "combo-box__value", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "combo-box__value", unknown, unknown, undefined>>;
    clearButton: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "combo-box__clear-button", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "combo-box__clear-button", unknown, unknown, undefined>>;
    list: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "combo-box__list", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "combo-box__list", unknown, unknown, undefined>>;
    item: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "combo-box__item", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "combo-box__item", unknown, unknown, undefined>>;
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
//# sourceMappingURL=combo-box.styles.d.ts.map
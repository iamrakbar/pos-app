/**
 * Country picker trigger — flag emoji and dial code laid out in a row.
 */
declare const trigger: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            flag?: import("tailwind-merge").ClassNameValue;
            dialCode?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            flag?: import("tailwind-merge").ClassNameValue;
            dialCode?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    flag: string;
    dialCode: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            flag?: import("tailwind-merge").ClassNameValue;
            dialCode?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    flag: string;
    dialCode: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    base: string;
    flag: string;
    dialCode: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Country list container plus its empty fallback — a centered container and a
 * muted text rendered when the search query matches no countries.
 */
declare const countryList: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            empty?: import("tailwind-merge").ClassNameValue;
            emptyText?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            empty?: import("tailwind-merge").ClassNameValue;
            emptyText?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    empty: string;
    emptyText: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            base?: import("tailwind-merge").ClassNameValue;
            empty?: import("tailwind-merge").ClassNameValue;
            emptyText?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    base: string;
    empty: string;
    emptyText: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    base: string;
    empty: string;
    emptyText: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * A single country row — flag, dial code, and country name.
 */
declare const countryItem: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            name?: import("tailwind-merge").ClassNameValue;
            flag?: import("tailwind-merge").ClassNameValue;
            dialCode?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            name?: import("tailwind-merge").ClassNameValue;
            flag?: import("tailwind-merge").ClassNameValue;
            dialCode?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    flag: string;
    dialCode: string;
    name: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            name?: import("tailwind-merge").ClassNameValue;
            flag?: import("tailwind-merge").ClassNameValue;
            dialCode?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    flag: string;
    dialCode: string;
    name: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    flag: string;
    dialCode: string;
    name: string;
}, undefined, unknown, unknown, undefined>>;
export type PhoneNumberFieldTriggerSlots = keyof ReturnType<typeof trigger>;
export type PhoneNumberFieldCountryListSlots = keyof ReturnType<typeof countryList>;
export type PhoneNumberFieldCountryItemSlots = keyof ReturnType<typeof countryItem>;
export declare const phoneNumberFieldClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "phone-number-field__root", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "phone-number-field__root", unknown, unknown, undefined>>;
    prefix: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "phone-number-field__prefix", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "phone-number-field__prefix", unknown, unknown, undefined>>;
    trigger: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                base?: import("tailwind-merge").ClassNameValue;
                flag?: import("tailwind-merge").ClassNameValue;
                dialCode?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                base?: import("tailwind-merge").ClassNameValue;
                flag?: import("tailwind-merge").ClassNameValue;
                dialCode?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        base: string;
        flag: string;
        dialCode: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                base?: import("tailwind-merge").ClassNameValue;
                flag?: import("tailwind-merge").ClassNameValue;
                dialCode?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        base: string;
        flag: string;
        dialCode: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        base: string;
        flag: string;
        dialCode: string;
    }, undefined, unknown, unknown, undefined>>;
    overlay: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "phone-number-field__overlay", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "phone-number-field__overlay", unknown, unknown, undefined>>;
    contentWrapper: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "phone-number-field__content-wrapper", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "phone-number-field__content-wrapper", unknown, unknown, undefined>>;
    contentHandle: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "phone-number-field__content-handle", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "phone-number-field__content-handle", unknown, unknown, undefined>>;
    searchInput: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "phone-number-field__search-input", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "phone-number-field__search-input", unknown, unknown, undefined>>;
    countryList: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                base?: import("tailwind-merge").ClassNameValue;
                empty?: import("tailwind-merge").ClassNameValue;
                emptyText?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                base?: import("tailwind-merge").ClassNameValue;
                empty?: import("tailwind-merge").ClassNameValue;
                emptyText?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        base: string;
        empty: string;
        emptyText: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                base?: import("tailwind-merge").ClassNameValue;
                empty?: import("tailwind-merge").ClassNameValue;
                emptyText?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        base: string;
        empty: string;
        emptyText: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        base: string;
        empty: string;
        emptyText: string;
    }, undefined, unknown, unknown, undefined>>;
    countryItem: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                name?: import("tailwind-merge").ClassNameValue;
                flag?: import("tailwind-merge").ClassNameValue;
                dialCode?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                name?: import("tailwind-merge").ClassNameValue;
                flag?: import("tailwind-merge").ClassNameValue;
                dialCode?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        flag: string;
        dialCode: string;
        name: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                name?: import("tailwind-merge").ClassNameValue;
                flag?: import("tailwind-merge").ClassNameValue;
                dialCode?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        flag: string;
        dialCode: string;
        name: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        flag: string;
        dialCode: string;
        name: string;
    }, undefined, unknown, unknown, undefined>>;
}>;
export {};
//# sourceMappingURL=phone-number-field.styles.d.ts.map
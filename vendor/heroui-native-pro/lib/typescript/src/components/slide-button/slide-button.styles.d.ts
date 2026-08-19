/**
 * Root style definition (with slots for container and inner wrapper).
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * - `opacity` - Animated for disabled state transitions (applied to container)
 */
declare const root: import("tailwind-variants").TVReturnType<{
    isDisabled: {
        true: {
            container: string;
        };
        false: {};
    };
}, {
    container: string;
    contentContainer: string;
}, undefined, {
    isDisabled: {
        true: {
            container: string;
        };
        false: {};
    };
}, {
    container: string;
    contentContainer: string;
}, import("tailwind-variants").TVReturnType<{
    isDisabled: {
        true: {
            container: string;
        };
        false: {};
    };
}, {
    container: string;
    contentContainer: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * UnderlayContent style definition.
 * Inline-end-anchored clip wrapper that hides content behind the thumb.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * - `width` - Animated to clip content at the thumb's leading edge (applied to container and content container)
 */
declare const underlayContent: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            contentContainer?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            contentContainer?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    contentContainer: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            container?: import("tailwind-merge").ClassNameValue;
            contentContainer?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    container: string;
    contentContainer: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    container: string;
    contentContainer: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * OverlayContent style definition.
 * Uses an overflow-hidden clip wrapper anchored to the inline-start edge to
 * reveal content in the slide direction (left-to-right in LTR, mirrored in
 * RTL).
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * - `width` - Animated to clip content at the thumb's trailing edge (applied to container and content container)
 */
declare const overlayContent: import("tailwind-variants").TVReturnType<{
    variant: {
        default: {
            contentContainer: string;
        };
        accent: {
            contentContainer: string;
        };
        success: {
            contentContainer: string;
        };
        danger: {
            contentContainer: string;
        };
    };
}, {
    container: string;
    contentContainer: string;
}, undefined, {
    variant: {
        default: {
            contentContainer: string;
        };
        accent: {
            contentContainer: string;
        };
        success: {
            contentContainer: string;
        };
        danger: {
            contentContainer: string;
        };
    };
}, {
    container: string;
    contentContainer: string;
}, import("tailwind-variants").TVReturnType<{
    variant: {
        default: {
            contentContainer: string;
        };
        accent: {
            contentContainer: string;
        };
        success: {
            contentContainer: string;
        };
        danger: {
            contentContainer: string;
        };
    };
}, {
    container: string;
    contentContainer: string;
}, undefined, unknown, unknown, undefined>>;
export declare const slideButtonClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: {
                container: string;
            };
            false: {};
        };
    }, {
        container: string;
        contentContainer: string;
    }, undefined, {
        isDisabled: {
            true: {
                container: string;
            };
            false: {};
        };
    }, {
        container: string;
        contentContainer: string;
    }, import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: {
                container: string;
            };
            false: {};
        };
    }, {
        container: string;
        contentContainer: string;
    }, undefined, unknown, unknown, undefined>>;
    underlayContent: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                contentContainer?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                contentContainer?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        contentContainer: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                container?: import("tailwind-merge").ClassNameValue;
                contentContainer?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        container: string;
        contentContainer: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        container: string;
        contentContainer: string;
    }, undefined, unknown, unknown, undefined>>;
    overlayContent: import("tailwind-variants").TVReturnType<{
        variant: {
            default: {
                contentContainer: string;
            };
            accent: {
                contentContainer: string;
            };
            success: {
                contentContainer: string;
            };
            danger: {
                contentContainer: string;
            };
        };
    }, {
        container: string;
        contentContainer: string;
    }, undefined, {
        variant: {
            default: {
                contentContainer: string;
            };
            accent: {
                contentContainer: string;
            };
            success: {
                contentContainer: string;
            };
            danger: {
                contentContainer: string;
            };
        };
    }, {
        container: string;
        contentContainer: string;
    }, import("tailwind-variants").TVReturnType<{
        variant: {
            default: {
                contentContainer: string;
            };
            accent: {
                contentContainer: string;
            };
            success: {
                contentContainer: string;
            };
            danger: {
                contentContainer: string;
            };
        };
    }, {
        container: string;
        contentContainer: string;
    }, undefined, unknown, unknown, undefined>>;
    thumb: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "slide-button__thumb", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "slide-button__thumb", unknown, unknown, undefined>>;
    thumbBackground: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "slide-button__thumb-background", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "slide-button__thumb-background", unknown, unknown, undefined>>;
    containerBackground: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "slide-button__container-background", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "slide-button__container-background", unknown, unknown, undefined>>;
    label: import("tailwind-variants").TVReturnType<{
        variant: {
            default: string;
            accent: string;
            success: string;
            danger: string;
        };
    }, undefined, "slide-button__label", {
        variant: {
            default: string;
            accent: string;
            success: string;
            danger: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        variant: {
            default: string;
            accent: string;
            success: string;
            danger: string;
        };
    }, undefined, "slide-button__label", unknown, unknown, undefined>>;
}>;
export declare const slideButtonStyleSheet: {
    root: {
        borderCurve: "continuous";
    };
};
/** Slot type for the root style definition. */
export type SlideButtonRootSlots = keyof ReturnType<typeof root>;
/** Slot type for the underlay content style definition. */
export type SlideButtonUnderlayContentSlots = keyof ReturnType<typeof underlayContent>;
/** Slot type for the overlay content style definition. */
export type SlideButtonOverlayContentSlots = keyof ReturnType<typeof overlayContent>;
export {};
//# sourceMappingURL=slide-button.styles.d.ts.map
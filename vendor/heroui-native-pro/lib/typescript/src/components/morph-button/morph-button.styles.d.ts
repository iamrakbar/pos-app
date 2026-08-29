/**
 * Root style definition (with slots for the footprint container and the
 * morphing surface).
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `surface` slot animates the following:
 * - `width` / `height` - Springed between the measured collapsed and
 *   expanded content sizes
 * - `top` / `start` - Computed anchor offsets pinning the surface per
 *   `direction`
 *
 * To customize the morph spring, use the `animation` prop on `MorphButton`.
 */
declare const root: import("tailwind-variants").TVReturnType<{
    variant: {
        primary: {
            surface: string;
        };
        secondary: {
            surface: string;
        };
    };
    isDisabled: {
        true: {
            container: string;
        };
        false: {};
    };
}, {
    container: string;
    surface: string;
}, undefined, {
    variant: {
        primary: {
            surface: string;
        };
        secondary: {
            surface: string;
        };
    };
    isDisabled: {
        true: {
            container: string;
        };
        false: {};
    };
}, {
    container: string;
    surface: string;
}, import("tailwind-variants").TVReturnType<{
    variant: {
        primary: {
            surface: string;
        };
        secondary: {
            surface: string;
        };
    };
    isDisabled: {
        true: {
            container: string;
        };
        false: {};
    };
}, {
    container: string;
    surface: string;
}, undefined, unknown, unknown, undefined>>;
export declare const morphButtonClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{
        variant: {
            primary: {
                surface: string;
            };
            secondary: {
                surface: string;
            };
        };
        isDisabled: {
            true: {
                container: string;
            };
            false: {};
        };
    }, {
        container: string;
        surface: string;
    }, undefined, {
        variant: {
            primary: {
                surface: string;
            };
            secondary: {
                surface: string;
            };
        };
        isDisabled: {
            true: {
                container: string;
            };
            false: {};
        };
    }, {
        container: string;
        surface: string;
    }, import("tailwind-variants").TVReturnType<{
        variant: {
            primary: {
                surface: string;
            };
            secondary: {
                surface: string;
            };
        };
        isDisabled: {
            true: {
                container: string;
            };
            false: {};
        };
    }, {
        container: string;
        surface: string;
    }, undefined, unknown, unknown, undefined>>;
    expandedHost: import("tailwind-variants").TVReturnType<{
        direction: {
            top: string;
            'top-end': string;
            end: string;
            'bottom-end': string;
            bottom: string;
            'bottom-start': string;
            start: string;
            'top-start': string;
        };
    }, undefined, "morph-button__expanded-host", {
        direction: {
            top: string;
            'top-end': string;
            end: string;
            'bottom-end': string;
            bottom: string;
            'bottom-start': string;
            start: string;
            'top-start': string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        direction: {
            top: string;
            'top-end': string;
            end: string;
            'bottom-end': string;
            bottom: string;
            'bottom-start': string;
            start: string;
            'top-start': string;
        };
    }, undefined, "morph-button__expanded-host", unknown, unknown, undefined>>;
    collapsedContent: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "morph-button__collapsed-content", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "morph-button__collapsed-content", unknown, unknown, undefined>>;
    expandedContent: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "morph-button__expanded-content", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "morph-button__expanded-content", unknown, unknown, undefined>>;
}>;
export type MorphButtonRootSlots = keyof ReturnType<typeof root>;
export declare const morphButtonStyleSheet: {
    surface: {
        borderCurve: "continuous";
    };
};
export {};
//# sourceMappingURL=morph-button.styles.d.ts.map
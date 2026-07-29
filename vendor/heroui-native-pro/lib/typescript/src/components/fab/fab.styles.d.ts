/**
 * Trigger slots: the pressable button surface (`container`) and the inner
 * wrapper (`contentContainer`) that rotates with the shared progress.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `contentContainer` slot animates the following:
 * - `transform` (rotate) - Animated for the open/close icon rotation
 *
 * To customize, use the `animation` prop on `FAB.Trigger`:
 * ```tsx
 * <FAB.Trigger animation={{ rotate: { value: [0, 135, 0] } }} />
 * ```
 *
 * To disable animated styles, set `isAnimatedStyleActive={false}`.
 */
declare const trigger: import("tailwind-variants").TVReturnType<{
    isDisabled: {
        true: {
            container: string;
        };
    };
}, {
    container: string;
    contentContainer: string;
}, undefined, {
    isDisabled: {
        true: {
            container: string;
        };
    };
}, {
    container: string;
    contentContainer: string;
}, import("tailwind-variants").TVReturnType<{
    isDisabled: {
        true: {
            container: string;
        };
    };
}, {
    container: string;
    contentContainer: string;
}, undefined, unknown, unknown, undefined>>;
export declare const fabClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "fab__root", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "fab__root", unknown, unknown, undefined>>;
    trigger: import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: {
                container: string;
            };
        };
    }, {
        container: string;
        contentContainer: string;
    }, undefined, {
        isDisabled: {
            true: {
                container: string;
            };
        };
    }, {
        container: string;
        contentContainer: string;
    }, import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: {
                container: string;
            };
        };
    }, {
        container: string;
        contentContainer: string;
    }, undefined, unknown, unknown, undefined>>;
    portal: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "fab__portal", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "fab__portal", unknown, unknown, undefined>>;
    overlay: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "fab__overlay", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "fab__overlay", unknown, unknown, undefined>>;
    content: import("tailwind-variants").TVReturnType<{
        align: {
            start: string;
            center: string;
            end: string;
        };
    }, undefined, "fab__content", {
        align: {
            start: string;
            center: string;
            end: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        align: {
            start: string;
            center: string;
            end: string;
        };
    }, undefined, "fab__content", unknown, unknown, undefined>>;
    item: import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: string;
        };
    }, undefined, "fab__item", {
        isDisabled: {
            true: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: string;
        };
    }, undefined, "fab__item", unknown, unknown, undefined>>;
    itemLabel: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "fab__item-label", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "fab__item-label", unknown, unknown, undefined>>;
}>;
export type TriggerSlots = keyof ReturnType<typeof trigger>;
export declare const fabStyleSheet: {
    item: {
        borderCurve: "continuous";
    };
};
export {};
//# sourceMappingURL=fab.styles.d.ts.map
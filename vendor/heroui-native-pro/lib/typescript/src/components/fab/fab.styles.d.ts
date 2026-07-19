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
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "self-start", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "self-start", unknown, unknown, undefined>>;
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
    portal: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "absolute inset-0", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "absolute inset-0", unknown, unknown, undefined>>;
    overlay: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "flex-1 bg-backdrop", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "flex-1 bg-backdrop", unknown, unknown, undefined>>;
    content: import("tailwind-variants").TVReturnType<{
        align: {
            start: string;
            center: string;
            end: string;
        };
    }, undefined, "gap-3", {
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
    }, undefined, "gap-3", unknown, unknown, undefined>>;
    item: import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: string;
        };
    }, undefined, "flex-row items-center gap-2.5 rounded-2xl shadow-overlay bg-overlay px-4 py-2.5", {
        isDisabled: {
            true: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        isDisabled: {
            true: string;
        };
    }, undefined, "flex-row items-center gap-2.5 rounded-2xl shadow-overlay bg-overlay px-4 py-2.5", unknown, unknown, undefined>>;
    itemLabel: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "text-sm font-medium text-foreground", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "text-sm font-medium text-foreground", unknown, unknown, undefined>>;
}>;
export type TriggerSlots = keyof ReturnType<typeof trigger>;
export declare const fabStyleSheet: {
    item: {
        borderCurve: "continuous";
    };
};
export {};
//# sourceMappingURL=fab.styles.d.ts.map
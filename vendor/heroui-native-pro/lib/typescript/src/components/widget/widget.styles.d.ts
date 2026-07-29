/**
 * `LegendItem` is the only compound part that renders multiple elements
 * itself (wrapper > dot + label), so it owns a slotted `tv()` instance and
 * its props expose `classNames` / `styles` typed against these slots.
 */
declare const legendItem: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            dot?: import("tailwind-merge").ClassNameValue;
            wrapper?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            dot?: import("tailwind-merge").ClassNameValue;
            wrapper?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    wrapper: string;
    dot: string;
    label: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            label?: import("tailwind-merge").ClassNameValue;
            dot?: import("tailwind-merge").ClassNameValue;
            wrapper?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    wrapper: string;
    dot: string;
    label: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    wrapper: string;
    dot: string;
    label: string;
}, undefined, unknown, unknown, undefined>>;
export declare const widgetClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__root", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__root", unknown, unknown, undefined>>;
    header: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__header", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__header", unknown, unknown, undefined>>;
    title: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__title", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__title", unknown, unknown, undefined>>;
    description: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__description", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__description", unknown, unknown, undefined>>;
    content: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__content", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__content", unknown, unknown, undefined>>;
    footer: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__footer", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__footer", unknown, unknown, undefined>>;
    legend: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "widget__legend", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "widget__legend", unknown, unknown, undefined>>;
    legendItem: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                dot?: import("tailwind-merge").ClassNameValue;
                wrapper?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                dot?: import("tailwind-merge").ClassNameValue;
                wrapper?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        wrapper: string;
        dot: string;
        label: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                label?: import("tailwind-merge").ClassNameValue;
                dot?: import("tailwind-merge").ClassNameValue;
                wrapper?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        wrapper: string;
        dot: string;
        label: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        wrapper: string;
        dot: string;
        label: string;
    }, undefined, unknown, unknown, undefined>>;
}>;
/** Slot keys for the {@link Widget.LegendItem} part. */
export type LegendItemSlots = keyof ReturnType<typeof legendItem>;
/**
 * Native-only style sheet for properties Tailwind cannot express. The
 * `borderCurve` entries apply iOS continuous (squircle) corner curves to
 * the outer shell and the elevated content card.
 */
export declare const widgetStyleSheet: {
    root: {
        borderCurve: "continuous";
    };
    content: {
        borderCurve: "continuous";
    };
};
export default widgetClassNames;
//# sourceMappingURL=widget.styles.d.ts.map
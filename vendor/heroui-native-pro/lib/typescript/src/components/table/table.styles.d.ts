declare const scrollContainer: import("tailwind-variants").TVReturnType<{
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
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `indicator` slot animates the following:
 * - `opacity` - Animated for indicator visibility (visible only on the
 *   column driving the active sort)
 * - `transform` (rotate) - Animated for the ascending/descending flip
 *
 * To customize, use the `animation` prop on `Table.Column`. To disable
 * animated styles, set `isAnimatedStyleActive={false}`.
 *
 * @note The `data-[...]:` prefixed utilities on the secondary container stay
 * here: data selectors are Tailwind variants and cannot be applied to custom
 * CSS classes. Plain base styles live in `styles/components/table.css`.
 *
 * @note The secondary header band rounds its outer corners on the first/last
 * column. The corners are direction-aware (rows flip in RTL), written as
 * arbitrary `border-{top,bottom}-{start,end}-radius` properties (React
 * Native's older logical corner set) because the alternatives break on
 * Android: physical `rounded-l/r-*` with `rtl:` overrides double-flip there,
 * and the W3C `border-start-start-radius` family hits an Android
 * `BorderRadiusStyle.resolve` bug that drops two corners.
 */
declare const column: import("tailwind-variants").TVReturnType<{
    variant: {
        primary: {};
        secondary: {
            container: import("tailwind-variants").CnReturn;
        };
    };
    isSorted: {
        true: {
            label: string;
        };
        false: {};
    };
}, {
    container: string;
    label: string;
    indicator: string;
    separator: string;
}, undefined, {
    variant: {
        primary: {};
        secondary: {
            container: import("tailwind-variants").CnReturn;
        };
    };
    isSorted: {
        true: {
            label: string;
        };
        false: {};
    };
}, {
    container: string;
    label: string;
    indicator: string;
    separator: string;
}, import("tailwind-variants").TVReturnType<{
    variant: {
        primary: {};
        secondary: {
            container: import("tailwind-variants").CnReturn;
        };
    };
    isSorted: {
        true: {
            label: string;
        };
        false: {};
    };
}, {
    container: string;
    label: string;
    indicator: string;
    separator: string;
}, undefined, unknown, unknown, undefined>>;
declare const body: import("tailwind-variants").TVReturnType<{
    variant: {
        primary: {
            container: string;
        };
        secondary: {};
    };
}, {
    container: string;
    empty: string;
}, undefined, {
    variant: {
        primary: {
            container: string;
        };
        secondary: {};
    };
}, {
    container: string;
    empty: string;
}, import("tailwind-variants").TVReturnType<{
    variant: {
        primary: {
            container: string;
        };
        secondary: {};
    };
}, {
    container: string;
    empty: string;
}, undefined, unknown, unknown, undefined>>;
declare const cell: import("tailwind-variants").TVReturnType<{
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
export declare const tableClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{
        variant: {
            primary: string;
            secondary: string;
        };
    }, undefined, "table__root", {
        variant: {
            primary: string;
            secondary: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        variant: {
            primary: string;
            secondary: string;
        };
    }, undefined, "table__root", unknown, unknown, undefined>>;
    background: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "table__background", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "table__background", unknown, unknown, undefined>>;
    scrollContainer: import("tailwind-variants").TVReturnType<{
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
    content: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "table__content", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "table__content", unknown, unknown, undefined>>;
    header: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "table__header", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "table__header", unknown, unknown, undefined>>;
    column: import("tailwind-variants").TVReturnType<{
        variant: {
            primary: {};
            secondary: {
                container: import("tailwind-variants").CnReturn;
            };
        };
        isSorted: {
            true: {
                label: string;
            };
            false: {};
        };
    }, {
        container: string;
        label: string;
        indicator: string;
        separator: string;
    }, undefined, {
        variant: {
            primary: {};
            secondary: {
                container: import("tailwind-variants").CnReturn;
            };
        };
        isSorted: {
            true: {
                label: string;
            };
            false: {};
        };
    }, {
        container: string;
        label: string;
        indicator: string;
        separator: string;
    }, import("tailwind-variants").TVReturnType<{
        variant: {
            primary: {};
            secondary: {
                container: import("tailwind-variants").CnReturn;
            };
        };
        isSorted: {
            true: {
                label: string;
            };
            false: {};
        };
    }, {
        container: string;
        label: string;
        indicator: string;
        separator: string;
    }, undefined, unknown, unknown, undefined>>;
    body: import("tailwind-variants").TVReturnType<{
        variant: {
            primary: {
                container: string;
            };
            secondary: {};
        };
    }, {
        container: string;
        empty: string;
    }, undefined, {
        variant: {
            primary: {
                container: string;
            };
            secondary: {};
        };
    }, {
        container: string;
        empty: string;
    }, import("tailwind-variants").TVReturnType<{
        variant: {
            primary: {
                container: string;
            };
            secondary: {};
        };
    }, {
        container: string;
        empty: string;
    }, undefined, unknown, unknown, undefined>>;
    row: import("tailwind-variants").TVReturnType<{
        variant: {
            primary: string;
            secondary: string;
        };
        isSelected: {
            true: string;
            false: string;
        };
        isPressed: {
            true: string;
            false: string;
        };
        isDisabled: {
            true: string;
            false: string;
        };
        isLast: {
            true: string;
            false: string;
        };
    }, undefined, "table__row", {
        variant: {
            primary: string;
            secondary: string;
        };
        isSelected: {
            true: string;
            false: string;
        };
        isPressed: {
            true: string;
            false: string;
        };
        isDisabled: {
            true: string;
            false: string;
        };
        isLast: {
            true: string;
            false: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        variant: {
            primary: string;
            secondary: string;
        };
        isSelected: {
            true: string;
            false: string;
        };
        isPressed: {
            true: string;
            false: string;
        };
        isDisabled: {
            true: string;
            false: string;
        };
        isLast: {
            true: string;
            false: string;
        };
    }, undefined, "table__row", unknown, unknown, undefined>>;
    cell: import("tailwind-variants").TVReturnType<{
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
    selectionCell: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "table__selection-cell", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "table__selection-cell", unknown, unknown, undefined>>;
    selectionCheckbox: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "table__selection-checkbox", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "table__selection-checkbox", unknown, unknown, undefined>>;
    footer: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "table__footer", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "table__footer", unknown, unknown, undefined>>;
}>;
/** Slot keys for the {@link Table.ScrollContainer} part. */
export type ScrollContainerSlots = keyof ReturnType<typeof scrollContainer>;
/** Slot keys for the {@link Table.Column} part. */
export type ColumnSlots = keyof ReturnType<typeof column>;
/** Slot keys for the {@link Table.Body} part. */
export type BodySlots = keyof ReturnType<typeof body>;
/** Slot keys for the {@link Table.Cell} part. */
export type CellSlots = keyof ReturnType<typeof cell>;
/**
 * Native-only style sheet for properties Tailwind cannot express. The
 * `borderCurve` entries apply iOS continuous (squircle) corner curves to
 * the outer shell and the elevated body card.
 */
export declare const tableStyleSheet: {
    root: {
        borderCurve: "continuous";
    };
    body: {
        borderCurve: "continuous";
    };
    /**
     * Applied by `Table.Content` for the single frame before the scroll
     * viewport measurement arrives, so the unpinned flex layout (cell content
     * at content-driven positions) is never painted.
     */
    contentAwaitingViewport: {
        opacity: number;
    };
};
export default tableClassNames;
//# sourceMappingURL=table.styles.d.ts.map
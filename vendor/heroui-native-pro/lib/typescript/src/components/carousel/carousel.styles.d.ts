/**
 * Slide area: `viewport` is the measured content-box wrapper hosting the
 * snap FlatList; `content` is the slide row inside the FlatList (gap is
 * applied inline at runtime).
 */
declare const content: import("tailwind-variants").TVReturnType<{
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            viewport?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {
    [x: string]: {
        [x: string]: import("tailwind-merge").ClassNameValue | {
            viewport?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    viewport: string;
    content: string;
}, undefined, {
    [key: string]: {
        [key: string]: import("tailwind-merge").ClassNameValue | {
            viewport?: import("tailwind-merge").ClassNameValue;
            content?: import("tailwind-merge").ClassNameValue;
        };
    };
} | {}, {
    viewport: string;
    content: string;
}, import("tailwind-variants").TVReturnType<unknown, {
    viewport: string;
    content: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Navigation buttons: `container` is the positioning shell (absolute for the
 * `in-place` / `modal` types, inline for `miniatures`; its height is set
 * inline to the measured viewport height for vertical centering), `button`
 * is the pressable itself.
 *
 * @note The `disabled:` pseudo-class utilities stay here: pseudo-class
 * selectors are Tailwind variants and cannot be applied to custom CSS
 * classes. Plain base styles live in `styles/components/carousel.css`.
 */
declare const nav: import("tailwind-variants").TVReturnType<{
    slot: {
        previous: {};
        next: {};
    };
    type: {
        'in-place': {};
        modal: {};
        miniatures: {
            container: string;
        };
    };
}, {
    container: string;
    button: string;
}, undefined, {
    slot: {
        previous: {};
        next: {};
    };
    type: {
        'in-place': {};
        modal: {};
        miniatures: {
            container: string;
        };
    };
}, {
    container: string;
    button: string;
}, import("tailwind-variants").TVReturnType<{
    slot: {
        previous: {};
        next: {};
    };
    type: {
        'in-place': {};
        modal: {};
        miniatures: {
            container: string;
        };
    };
}, {
    container: string;
    button: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Dot indicators: `container` is the row, `dot` one default dot.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `dot` slot animates the following:
 * - `width` - Interpolated from root `progress` for the selected pill stretch
 * - `backgroundColor` - Interpolated from root `progress` for the selected color
 *
 * To customize, use the `animation` prop on `Carousel.Dots`:
 * ```tsx
 * <Carousel.Dots
 *   animation={{
 *     width: { value: [8, 28] },
 *   }}
 * />
 * ```
 *
 * To disable animated styles (the `--is-selected` modifier class takes over),
 * set `isAnimatedStyleActive={false}`.
 */
declare const dots: import("tailwind-variants").TVReturnType<{
    isSelected: {
        true: {
            dot: string;
        };
        false: {};
    };
}, {
    container: string;
    dot: string;
}, undefined, {
    isSelected: {
        true: {
            dot: string;
        };
        false: {};
    };
}, {
    container: string;
    dot: string;
}, import("tailwind-variants").TVReturnType<{
    isSelected: {
        true: {
            dot: string;
        };
        false: {};
    };
}, {
    container: string;
    dot: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * Thumbnail strip: `container` is the horizontal ScrollView, `content` its
 * content row.
 */
declare const thumbnails: import("tailwind-variants").TVReturnType<{
    type: {
        'in-place': {};
        modal: {};
        miniatures: {
            container: string;
        };
    };
}, {
    container: string;
    content: string;
}, undefined, {
    type: {
        'in-place': {};
        modal: {};
        miniatures: {
            container: string;
        };
    };
}, {
    container: string;
    content: string;
}, import("tailwind-variants").TVReturnType<{
    type: {
        'in-place': {};
        modal: {};
        miniatures: {
            container: string;
        };
    };
}, {
    container: string;
    content: string;
}, undefined, unknown, unknown, undefined>>;
/**
 * One thumbnail: `container` is the pressable, `image` the default image,
 * `ring` the selection ring overlay.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `container` slot animates the following:
 * - `transform` (scale) - Animated for press feedback
 *
 * The `ring` slot animates the following:
 * - `opacity` - Animated for the selection transition
 *
 * To customize, use the `animation` prop on `Carousel.Thumbnail`. To disable
 * animated styles (the `--is-selected` modifier class takes over), set
 * `isAnimatedStyleActive={false}`.
 */
declare const thumbnail: import("tailwind-variants").TVReturnType<{
    isSelected: {
        true: {
            ring: string;
        };
        false: {};
    };
}, {
    container: string;
    image: string;
    ring: string;
}, undefined, {
    isSelected: {
        true: {
            ring: string;
        };
        false: {};
    };
}, {
    container: string;
    image: string;
    ring: string;
}, import("tailwind-variants").TVReturnType<{
    isSelected: {
        true: {
            ring: string;
        };
        false: {};
    };
}, {
    container: string;
    image: string;
    ring: string;
}, undefined, unknown, unknown, undefined>>;
export declare const carouselClassNames: import("../../helpers/internal/types").CombinedStyles<{
    root: import("tailwind-variants").TVReturnType<{
        type: {
            'in-place': string;
            modal: string;
            miniatures: string;
        };
    }, undefined, "carousel", {
        type: {
            'in-place': string;
            modal: string;
            miniatures: string;
        };
    }, undefined, import("tailwind-variants").TVReturnType<{
        type: {
            'in-place': string;
            modal: string;
            miniatures: string;
        };
    }, undefined, "carousel", unknown, unknown, undefined>>;
    content: import("tailwind-variants").TVReturnType<{
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                viewport?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {
        [x: string]: {
            [x: string]: import("tailwind-merge").ClassNameValue | {
                viewport?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        viewport: string;
        content: string;
    }, undefined, {
        [key: string]: {
            [key: string]: import("tailwind-merge").ClassNameValue | {
                viewport?: import("tailwind-merge").ClassNameValue;
                content?: import("tailwind-merge").ClassNameValue;
            };
        };
    } | {}, {
        viewport: string;
        content: string;
    }, import("tailwind-variants").TVReturnType<unknown, {
        viewport: string;
        content: string;
    }, undefined, unknown, unknown, undefined>>;
    item: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "carousel__item", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "carousel__item", unknown, unknown, undefined>>;
    nav: import("tailwind-variants").TVReturnType<{
        slot: {
            previous: {};
            next: {};
        };
        type: {
            'in-place': {};
            modal: {};
            miniatures: {
                container: string;
            };
        };
    }, {
        container: string;
        button: string;
    }, undefined, {
        slot: {
            previous: {};
            next: {};
        };
        type: {
            'in-place': {};
            modal: {};
            miniatures: {
                container: string;
            };
        };
    }, {
        container: string;
        button: string;
    }, import("tailwind-variants").TVReturnType<{
        slot: {
            previous: {};
            next: {};
        };
        type: {
            'in-place': {};
            modal: {};
            miniatures: {
                container: string;
            };
        };
    }, {
        container: string;
        button: string;
    }, undefined, unknown, unknown, undefined>>;
    navButtonBackground: import("tailwind-variants").TVReturnType<{} | {} | {}, undefined, "carousel__nav-button-background", {} | {}, undefined, import("tailwind-variants").TVReturnType<unknown, undefined, "carousel__nav-button-background", unknown, unknown, undefined>>;
    dots: import("tailwind-variants").TVReturnType<{
        isSelected: {
            true: {
                dot: string;
            };
            false: {};
        };
    }, {
        container: string;
        dot: string;
    }, undefined, {
        isSelected: {
            true: {
                dot: string;
            };
            false: {};
        };
    }, {
        container: string;
        dot: string;
    }, import("tailwind-variants").TVReturnType<{
        isSelected: {
            true: {
                dot: string;
            };
            false: {};
        };
    }, {
        container: string;
        dot: string;
    }, undefined, unknown, unknown, undefined>>;
    thumbnails: import("tailwind-variants").TVReturnType<{
        type: {
            'in-place': {};
            modal: {};
            miniatures: {
                container: string;
            };
        };
    }, {
        container: string;
        content: string;
    }, undefined, {
        type: {
            'in-place': {};
            modal: {};
            miniatures: {
                container: string;
            };
        };
    }, {
        container: string;
        content: string;
    }, import("tailwind-variants").TVReturnType<{
        type: {
            'in-place': {};
            modal: {};
            miniatures: {
                container: string;
            };
        };
    }, {
        container: string;
        content: string;
    }, undefined, unknown, unknown, undefined>>;
    thumbnail: import("tailwind-variants").TVReturnType<{
        isSelected: {
            true: {
                ring: string;
            };
            false: {};
        };
    }, {
        container: string;
        image: string;
        ring: string;
    }, undefined, {
        isSelected: {
            true: {
                ring: string;
            };
            false: {};
        };
    }, {
        container: string;
        image: string;
        ring: string;
    }, import("tailwind-variants").TVReturnType<{
        isSelected: {
            true: {
                ring: string;
            };
            false: {};
        };
    }, {
        container: string;
        image: string;
        ring: string;
    }, undefined, unknown, unknown, undefined>>;
}>;
export declare const carouselStyleSheet: {
    /**
     * Pins the slide strip's FlatList node to a physical left-to-right flow.
     * The snap engine (`snapToOffsets`, `scrollToOffset`) works in physical
     * offsets, so the RTL mirroring happens in the snap-offset math and in
     * the slide render order instead of in layout. On Android a horizontal
     * list whose node resolves to `rtl` mirrors its scroll offsets, so the
     * node and its content row must agree on the direction.
     */
    pagerList: {
        direction: "ltr";
    };
    /** Pins the slide row to the same physical flow as its FlatList node. */
    pagerContent: {
        direction: "ltr";
    };
    /**
     * Pins the thumbnail strip to a physical left-to-right flow for the same
     * reason: the auto-scroll-to-selected `scrollToIndex` works from the
     * list's physical cell layouts. RTL mirroring happens in the thumbnail
     * render order (and the mirrored data index) instead.
     */
    thumbnailsList: {
        direction: "ltr";
    };
    /** Pins the thumbnail row to the same physical flow as its ScrollView node. */
    thumbnailsContent: {
        direction: "ltr";
    };
    /** Restores the app layout direction inside an LTR-pinned strip. */
    restoreDirectionLTR: {
        direction: "ltr";
    };
    restoreDirectionRTL: {
        direction: "rtl";
    };
};
/** Slot type for the content style definition. */
export type CarouselContentSlots = keyof ReturnType<typeof content>;
/** Slot type for the navigation button style definition. */
export type CarouselNavSlots = keyof ReturnType<typeof nav>;
/** Slot type for the dots style definition. */
export type CarouselDotsSlots = keyof ReturnType<typeof dots>;
/** Slot type for the thumbnails strip style definition. */
export type CarouselThumbnailsSlots = keyof ReturnType<typeof thumbnails>;
/** Slot type for the thumbnail style definition. */
export type CarouselThumbnailSlots = keyof ReturnType<typeof thumbnail>;
export default carouselClassNames;
//# sourceMappingURL=carousel.styles.d.ts.map
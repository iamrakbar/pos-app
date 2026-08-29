import { type RefAttributes } from 'react';
import { View } from 'react-native';
import type { CarouselContentProps, CarouselContextValue, CarouselDotsProps, CarouselItemProps, CarouselNavButtonBackgroundProps, CarouselNavButtonProps, CarouselRootProps, CarouselThumbnailProps, CarouselThumbnailsProps, CarouselThumbnailsRef } from './carousel.types';
declare const useCarousel: () => CarouselContextValue;
/**
 * Carousel compound component — a horizontal snap pager with navigation
 * buttons, dot indicators, and a thumbnail strip.
 *
 * @component Carousel - Root container. Owns the snap engine (selected
 * index, snap offsets computed from the measured viewport, autoplay) and
 * provides it to all parts via context (also exposed through
 * `useCarousel()`). Selection state lives in the public context only;
 * the slide strip consumes a selection-free engine context, so selection
 * commits (nav presses, the mid-swipe halfway update) never re-render
 * slide content.
 *
 * @component Carousel.Content - Measured slide viewport hosting the
 * horizontal snap FlatList with the `Carousel.Item` children.
 *
 * @component Carousel.Item - One slide. Its width is computed by the engine
 * from `itemsPerView` and `gap`.
 *
 * @component Carousel.Previous / Carousel.Next - @optional Navigation
 * buttons. Overlaid on the slide area (`in-place`), outside it (`modal`), or
 * inline (`miniatures`); disabled at the ends.
 *
 * @component Carousel.NavButtonBackground - @optional Absolute-fill
 * background container behind a nav button's surface. With no children, the
 * active library theme decides the default content (e.g. a glass blur
 * layer); pass children to host custom content with the same positioning
 * and clipping.
 *
 * @component Carousel.Dots - @optional Indication-only dots (not
 * pressable), one per snap point; the selected pill interpolates against
 * root `progress` as the strip is dragged. Customizable via `renderDot`.
 * Hidden with a single snap point.
 *
 * @component Carousel.Thumbnails - @optional Horizontal FlatList strip of
 * `Carousel.Thumbnail` parts that auto-scrolls the selection toward its
 * center (`scrollToIndex` with `viewPosition: 0.5`).
 *
 * @component Carousel.Thumbnail - @optional Pressable thumbnail navigating
 * to a slide (`index` required; renders `source` or custom children) with a
 * selection ring.
 *
 * State flows from Carousel to sub-components via context.
 *
 * @note RTL: the slide strip and the thumbnail strip are physically-paged
 * lists, so both stay pinned left-to-right (`snapToOffsets` and the
 * thumbnail `scrollToIndex` cell layouts are physical) while the mirroring
 * happens in the render order (slides and thumbnails reverse, and the
 * thumbnail data index mirrors accordingly) and in the snap-offset mapping. Slides and thumbnails restore the app direction on
 * their own roots. The nav chevrons swap glyphs off `useIsRTL()`; dots and
 * containers mirror through Yoga row ordering and logical insets. Root
 * `progress` is a logical snap index — interpolating a physical
 * `translateX` from it still needs to be mirrored off `useIsRTL()`.
 *
 * @note The carousel paints no surface card of its own (slides own their
 * backgrounds), so the root deliberately ships no glass `Background` part.
 * The nav buttons do paint `--color-default`, so they mount
 * `Carousel.NavButtonBackground` behind their surface (replaceable via the
 * `background` prop on `Carousel.Previous` / `Carousel.Next`).
 */
declare const Carousel: import("react").ForwardRefExoticComponent<CarouselRootProps & RefAttributes<View>> & {
    /** Measured slide viewport hosting the horizontal snap FlatList. */
    Content: import("react").ForwardRefExoticComponent<CarouselContentProps & RefAttributes<View>>;
    /** One slide (width owned by the engine). */
    Item: import("react").ForwardRefExoticComponent<CarouselItemProps & RefAttributes<View>>;
    /** @optional Previous-slide navigation button. */
    Previous: import("react").ForwardRefExoticComponent<CarouselNavButtonProps & RefAttributes<View>>;
    /** @optional Next-slide navigation button. */
    Next: import("react").ForwardRefExoticComponent<CarouselNavButtonProps & RefAttributes<View>>;
    /** @optional Theme-aware background container behind a nav button surface. */
    NavButtonBackground: import("react").ForwardRefExoticComponent<CarouselNavButtonBackgroundProps & RefAttributes<View>>;
    /** @optional Indication-only dots, one per snap point. */
    Dots: import("react").ForwardRefExoticComponent<CarouselDotsProps & RefAttributes<View>>;
    /** @optional Horizontal thumbnail strip. */
    Thumbnails: import("react").ForwardRefExoticComponent<CarouselThumbnailsProps & RefAttributes<CarouselThumbnailsRef>>;
    /** @optional Pressable thumbnail navigating to a slide. */
    Thumbnail: import("react").ForwardRefExoticComponent<CarouselThumbnailProps & RefAttributes<View>>;
};
export default Carousel;
export { useCarousel };
//# sourceMappingURL=carousel.d.ts.map
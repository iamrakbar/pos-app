import type { CarouselAlign } from './carousel.types';
/**
 * Computes the width of one slide from the measured viewport width.
 *
 * With `itemsPerView` slides visible, `ceil(itemsPerView) - 1` gaps are
 * visible alongside them (a fractional slide peeks past the last full gap),
 * so the slide width is the remaining space — after the side padding on
 * both ends — divided by `itemsPerView`.
 *
 * @param options.viewportWidth - Measured width of the slide viewport.
 * @param options.itemsPerView - Number of slides visible per view (fractional values peek).
 * @param options.gap - Gap between adjacent slides in pixels.
 * @param options.sidePadding - Breathing room at both ends of the strip in pixels.
 * @returns The slide width in pixels, or `0` when the viewport is unmeasured.
 */
export declare function getCarouselItemWidth(options: {
    viewportWidth: number;
    itemsPerView: number;
    gap: number;
    sidePadding: number;
}): number;
/**
 * Computes the physical snap offsets of the slide strip, indexed by snap
 * index.
 *
 * Offsets are aligned per `align`, clamped to the scrollable range, and
 * de-duplicated (mirroring Embla's `containScroll: "trimSnaps"`), so the
 * snap count can be smaller than the item count when several slides fit the
 * viewport. In RTL the slide render order is reversed, so each offset is
 * mirrored across the scrollable range (`maxOffset - offset`) to keep snap
 * index `i` pointing at the i-th logical slide.
 *
 * With `sidePadding`, the content row carries that padding at both ends and
 * the aligned positions account for it: edge slides rest with the padding
 * as breathing room (the clamp lands them exactly on it) while intermediate
 * slides keep their `align` position within the full viewport.
 *
 * @param options.viewportWidth - Measured width of the slide viewport.
 * @param options.itemWidth - Computed slide width (see {@link getCarouselItemWidth}).
 * @param options.itemCount - Number of slides.
 * @param options.gap - Gap between adjacent slides in pixels.
 * @param options.sidePadding - Breathing room at both ends of the strip in pixels.
 * @param options.align - Alignment of the selected slide within the viewport.
 * @param options.isRTL - Whether the layout direction is right-to-left.
 * @returns Physical snap offsets indexed by snap index (empty until measured).
 */
export declare function getCarouselSnapOffsets(options: {
    viewportWidth: number;
    itemWidth: number;
    itemCount: number;
    gap: number;
    sidePadding: number;
    align: CarouselAlign;
    isRTL: boolean;
}): number[];
/**
 * Finds the snap index whose offset is nearest to the given physical scroll
 * offset.
 *
 * @param offsetX - Physical scroll offset of the strip.
 * @param snapOffsets - Physical snap offsets indexed by snap index.
 * @returns The nearest snap index, or `0` when there are no offsets.
 */
export declare function findNearestSnapIndex(offsetX: number, snapOffsets: readonly number[]): number;
/**
 * Clamps a snap index into the valid `[0, count - 1]` range.
 *
 * @param index - Requested snap index.
 * @param count - Number of snap points.
 * @returns The clamped index, or `0` when there are no snap points.
 */
export declare function clampSnapIndex(index: number, count: number): number;
/**
 * Maps a physical scroll offset onto the continuous snap-index scale.
 *
 * The result is a float in `[0, snapCount - 1]`. Between two snap points it
 * is linearly interpolated from the bracketing offsets, so consumers can
 * interpolate indicator position while the strip is dragged instead of
 * waiting for the snap to settle. Works for both ascending (LTR) and
 * descending (RTL) offset lists.
 *
 * Marked as a worklet so it can run on the UI thread from a derived
 * progress value.
 *
 * @param offsetX - Physical scroll offset of the strip.
 * @param snapOffsets - Physical snap offsets indexed by snap index.
 * @returns Continuous progress aligned with snap indices.
 */
export declare function getCarouselProgress(offsetX: number, snapOffsets: readonly number[]): number;
//# sourceMappingURL=carousel.utils.d.ts.map
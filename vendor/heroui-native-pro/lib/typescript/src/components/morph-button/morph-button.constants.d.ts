import type { MorphButtonDirection } from './morph-button.types';
/**
 * Display name constants for the MorphButton compound component parts.
 */
export declare const DISPLAY_NAME: {
    readonly ROOT: "HeroUINative.MorphButton.Root";
    readonly COLLAPSED_CONTENT: "HeroUINative.MorphButton.CollapsedContent";
    readonly EXPANDED_CONTENT: "HeroUINative.MorphButton.ExpandedContent";
};
/** Default spring configuration for the surface width/height morph. */
export declare const DEFAULT_MORPH_SPRING_CONFIG: {
    readonly damping: 25;
    readonly stiffness: 300;
    readonly mass: 0.8;
    readonly overshootClamping: false;
    readonly restDisplacementThreshold: 0.01;
    readonly restSpeedThreshold: 0.01;
};
/** Default duration for the content cross-fade and scale timing animations. */
export declare const DEFAULT_CONTENT_TIMING_DURATION = 200;
/** Default collapsed-content opacity values `[closed, open]`. */
export declare const DEFAULT_COLLAPSED_OPACITY: [number, number];
/** Default collapsed-content scale values `[closed, open]`. */
export declare const DEFAULT_COLLAPSED_SCALE: [number, number];
/** Default expanded-content opacity values `[closed, open]`. */
export declare const DEFAULT_EXPANDED_OPACITY: [number, number];
/** Default expanded-content scale values `[closed, open]`. */
export declare const DEFAULT_EXPANDED_SCALE: [number, number];
/**
 * Anchor factors per direction, used by the surface/host animated styles.
 * Offsets are computed as `(reference - animated) * factor`:
 * - `vertical`: share of vertical growth going toward the top
 *   (`1` = grows up, `0` = grows down, `0.5` = vertically centered).
 * - `horizontal`: share of horizontal growth going toward the inline start
 *   (`1` = grows toward start, `0` = grows toward end, `0.5` = centered).
 * Horizontal offsets are written to the logical `start` inset, so the
 * physical growth side mirrors automatically in RTL.
 */
export declare const DIRECTION_ANCHOR_MAP: Record<MorphButtonDirection, {
    vertical: number;
    horizontal: number;
}>;
//# sourceMappingURL=morph-button.constants.d.ts.map
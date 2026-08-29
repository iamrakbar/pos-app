/**
 * Display name constants for the Carousel compound component parts.
 */
export declare const DISPLAY_NAME: {
    readonly ROOT: "HeroUINative.Carousel.Root";
    readonly CONTENT: "HeroUINative.Carousel.Content";
    readonly ITEM: "HeroUINative.Carousel.Item";
    readonly PREVIOUS: "HeroUINative.Carousel.Previous";
    readonly NEXT: "HeroUINative.Carousel.Next";
    readonly NAV_BUTTON_BACKGROUND: "HeroUINative.Carousel.NavButtonBackground";
    readonly DOTS: "HeroUINative.Carousel.Dots";
    readonly THUMBNAILS: "HeroUINative.Carousel.Thumbnails";
    readonly THUMBNAIL: "HeroUINative.Carousel.Thumbnail";
};
/** Default number of slides visible per view. */
export declare const DEFAULT_ITEMS_PER_VIEW = 1;
/**
 * Default gap between adjacent slides in pixels.
 * Matches the web carousel's `--carousel-gap` (`--spacing` × 4).
 */
export declare const DEFAULT_GAP = 16;
/** Default breathing room at both ends of the slide strip in pixels. */
export declare const DEFAULT_SIDE_PADDING = 0;
/** Default interval between autoplay advances in milliseconds. */
export declare const DEFAULT_AUTO_PLAY_INTERVAL = 4000;
/** Default chevron icon size of `Carousel.Previous` / `Carousel.Next`. */
export declare const NAV_ICON_SIZE = 18;
/** Default dot width for `[unselected, selected]` in pixels. */
export declare const DOT_WIDTH_RANGE: [number, number];
/** Timing duration for the thumbnail press/selection animation in milliseconds. */
export declare const THUMBNAIL_TIMING_DURATION = 150;
/** Default thumbnail scale for `[idle, pressed]`. */
export declare const THUMBNAIL_SCALE_RANGE: [number, number];
/** Default selection-ring opacity for `[unselected, selected]`. */
export declare const THUMBNAIL_RING_OPACITY_RANGE: [number, number];
/**
 * Maximum duration (in ms) of a cancelled press that still counts as a tap
 * (see the rescued-tap logic in `Carousel.Thumbnail` and the nav buttons).
 */
export declare const TAP_RESCUE_MAX_DURATION_MS = 500;
/**
 * Spring driving programmatic trips (nav buttons, thumbnails, autoplay,
 * `scrollTo`). The trip is animated by the library on the UI thread
 * (per-frame non-animated scrolls) instead of the native animated
 * `scrollTo`, because a spring retargets mid-flight with its velocity
 * preserved — rapid presses chain into one continuous motion instead of
 * restarting an easing curve on every press. `overshootClamping` keeps the
 * pager from bouncing past a slide.
 */
export declare const TRIP_SPRING_CONFIG: {
    readonly stiffness: 220;
    readonly damping: 30;
    readonly mass: 1;
    readonly overshootClamping: true;
    readonly restDisplacementThreshold: 0.5;
    readonly restSpeedThreshold: 5;
};
/**
 * A thumbnail press cancelled within this window (in ms) after the strip
 * began a drag is checked against the drag-movement threshold.
 */
export declare const THUMBNAIL_DRAG_CANCEL_WINDOW_MS = 600;
/**
 * Minimum strip travel (in px) since drag begin for the gesture to count as
 * a real user drag. Catching the strip's own scroll also fires a drag-begin
 * event, but the offset then stays put under the resting finger.
 */
export declare const THUMBNAIL_DRAG_MOVE_THRESHOLD = 8;
/**
 * Tolerance in pixels when de-duplicating clamped snap offsets — offsets
 * closer than this collapse into one snap point (mirrors Embla's
 * `containScroll: "trimSnaps"`).
 */
export declare const SNAP_OFFSET_TOLERANCE = 0.5;
/**
 * Horizontal |velocity| below which `onEndDrag` is treated as the settle
 * event. A no-momentum release never fires `onMomentumEnd`, so without
 * this fallback autoplay stays paused (`isInteracting`) and the
 * between-snap realign trip never runs.
 */
export declare const NO_MOMENTUM_VELOCITY_THRESHOLD = 0.05;
//# sourceMappingURL=carousel.constants.d.ts.map
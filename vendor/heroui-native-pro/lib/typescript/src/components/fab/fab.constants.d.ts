import type { WithSpringConfig } from 'react-native-reanimated';
/**
 * Display name constants for the FAB compound component parts.
 *
 * Used both for `displayName` assignments and for React DevTools traces.
 */
export declare const DISPLAY_NAME: {
    readonly ROOT: "HeroUINative.FAB.Root";
    readonly TRIGGER: "HeroUINative.FAB.Trigger";
    readonly PORTAL: "HeroUINative.FAB.Portal";
    readonly OVERLAY: "HeroUINative.FAB.Overlay";
    readonly CONTENT: "HeroUINative.FAB.Content";
    readonly ITEM: "HeroUINative.FAB.Item";
    readonly ITEM_LABEL: "HeroUINative.FAB.ItemLabel";
};
/** Progress value while the FAB is closed / idle. */
export declare const PROGRESS_IDLE = 0;
/** Progress value once the open animation completes. */
export declare const PROGRESS_OPEN = 1;
/** Progress value the close animation runs towards (then resets to idle). */
export declare const PROGRESS_CLOSE = 2;
/**
 * Default spring configuration driving the shared open/close progress.
 * Heavy mass with high stiffness and damping gives a fast, settled motion
 * without overshoot artifacts in the [0, 1, 2] progress interpolations.
 */
export declare const DEFAULT_PROGRESS_SPRING_CONFIG: WithSpringConfig;
/**
 * Default rotation (degrees) of the trigger content for the
 * [idle, open, close] progress states. Turns a plus icon into a
 * diagonal close affordance while open.
 */
export declare const DEFAULT_TRIGGER_ROTATION: [number, number, number];
/**
 * Default overlay opacity for the [idle, open, close] progress states.
 */
export declare const DEFAULT_OVERLAY_OPACITY: [number, number, number];
/**
 * Default distance (px) an item travels from the trigger direction while
 * appearing.
 */
export declare const DEFAULT_ITEM_TRANSLATE_DISTANCE = 16;
/**
 * Default item scale for the [hidden, visible] states.
 */
export declare const DEFAULT_ITEM_SCALE: [number, number];
/**
 * Default fraction of the progress range one item's appearing animation
 * occupies in staggered mode. The remaining range is distributed as
 * per-item delays, so with N items each item starts
 * `(1 - WINDOW) / (N - 1)` after the previous. Customizable via the root
 * `animation.stagger.itemWindow` config.
 */
export declare const DEFAULT_STAGGER_ITEM_WINDOW = 0.5;
/**
 * Lower clamp for `animation.stagger.itemWindow`. Prevents zero/negative
 * windows that would make items pop in with no animation.
 */
export declare const MIN_STAGGER_ITEM_WINDOW = 0.05;
/**
 * Progress midpoint between open and close phases. Used by the
 * animation-disabled branches to decide whether a snapped progress value
 * represents the open state.
 */
export declare const PROGRESS_OPEN_LOWER_BOUND = 0.5;
/**
 * Upper bound of the "open" band on the progress scale (values above this
 * belong to the close phase tail). Used by animation-disabled branches.
 */
export declare const PROGRESS_OPEN_UPPER_BOUND = 1.5;
/**
 * Default gap between the trigger and the content, in pixels.
 */
export declare const DEFAULT_CONTENT_OFFSET = 12;
/**
 * Default screen edge insets respected when positioning the content.
 */
export declare const DEFAULT_INSETS: {
    readonly top: 12;
    readonly bottom: 12;
    readonly left: 12;
    readonly right: 12;
};
//# sourceMappingURL=fab.constants.d.ts.map
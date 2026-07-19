import type { WithSpringConfig } from 'react-native-reanimated';
/**
 * Display name constants for the FlipCard compound component parts.
 *
 * Used both for `displayName` assignments and for React DevTools traces.
 */
export declare const DISPLAY_NAME: {
    readonly ROOT: "HeroUINative.FlipCard.Root";
    readonly FRONT: "HeroUINative.FlipCard.Front";
    readonly BACK: "HeroUINative.FlipCard.Back";
};
/**
 * Default spring configuration driving the flip progress. Tuned for a
 * weighty card feel with a gentle settle (no harsh overshoot).
 */
export declare const DEFAULT_FLIP_SPRING_CONFIG: WithSpringConfig;
/**
 * Perspective distance (in logical pixels) applied as the first transform
 * so the rotation reads as a 3D flip instead of a flat squash.
 */
export declare const FLIP_PERSPECTIVE = 1000;
/** Front face rotation range in degrees, mapped from progress [0, 1]. */
export declare const FRONT_ROTATION_RANGE: [number, number];
/** Back face rotation range in degrees, mapped from progress [0, 1]. */
export declare const BACK_ROTATION_RANGE: [number, number];
/**
 * Progress input range for the mid-flip scale dip. The card shrinks
 * slightly at the halfway point to sell the 3D rotation.
 */
export declare const FLIP_SCALE_INPUT_RANGE: [number, number, number];
/** Scale output range paired with {@link FLIP_SCALE_INPUT_RANGE}. */
export declare const FLIP_SCALE_OUTPUT_RANGE: [number, number, number];
/**
 * Progress threshold at which a face is considered "past" the flip.
 * Used for the snap (animation-disabled) branch of the face animation.
 */
export declare const FLIP_MIDPOINT = 0.5;
//# sourceMappingURL=flip-card.constants.d.ts.map
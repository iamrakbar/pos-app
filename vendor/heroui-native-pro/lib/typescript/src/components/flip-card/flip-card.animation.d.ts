import type { SharedValue } from 'react-native-reanimated';
import type { FlipCardAnimationContextValue, FlipCardDirection, FlipCardFaceAnimation, FlipCardRootAnimation, FlipCardRotation, FlipCardSide } from './flip-card.types';
declare const FlipCardAnimationProvider: import("react").Provider<FlipCardAnimationContextValue>, useFlipCardAnimation: () => FlipCardAnimationContextValue;
export { FlipCardAnimationProvider, useFlipCardAnimation };
/**
 * Animation hook for the {@link FlipCard} root component.
 *
 * Owns the shared flip `progress` value (0 = front visible, 1 = back
 * visible) and drives it with a spring whenever `isFlipped` changes.
 * When the root animation is disabled (locally or via cascade), progress
 * snaps to its target instantly.
 *
 * Also combines the global, parent, and own animation-disabled states so
 * the root can cascade `isAllAnimationsDisabled` to descendants via
 * `AnimationSettingsProvider`. Priority: Global > Parent > Own.
 */
export declare function useFlipCardRootAnimation(options: {
    /** Root animation prop (flip spring config and disable-all cascade). */
    animation: FlipCardRootAnimation | undefined;
    /** Whether the card currently shows its back face. */
    isFlipped: boolean;
}): {
    progress: SharedValue<number>;
    isAllAnimationsDisabled: boolean;
};
/**
 * Animation hook for a {@link FlipCard} face (`FlipCard.Front` /
 * `FlipCard.Back`).
 *
 * Builds the 3D flip transform from the shared root `progress`:
 * - Rotation: front maps progress [0, 1] to [0deg, 180deg]; back maps to
 *   [180deg, 360deg]. The axis follows `direction` (`rotateY` for
 *   horizontal, `rotateX` for vertical), and both ranges are negated when
 *   `rotation` is `"reverse"` so the card spins the opposite way.
 * - Scale: dips to 0.95 at the flip midpoint to sell the rotation.
 * - `perspective` is applied first so the rotation reads as 3D.
 * - `backfaceVisibility: "hidden"` hides the face once it turns away.
 *
 * When the face animation is disabled, rotation snaps between the range
 * endpoints at the flip midpoint and the scale dip is dropped.
 */
export declare function useFlipCardFaceAnimation(options: {
    /** Face animation prop (disable flag). */
    animation: FlipCardFaceAnimation | undefined;
    /** Which face this hook drives. */
    side: FlipCardSide;
    /** Axis around which the card flips. */
    direction: FlipCardDirection;
    /** Spin direction of the flip around the chosen axis. */
    rotation: FlipCardRotation;
    /** Shared flip progress from the root (0 = front, 1 = back). */
    progress: SharedValue<number>;
}): {
    rFaceStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        transform: ({
            perspective: number;
            rotateX?: undefined;
            scale?: undefined;
        } | {
            rotateX: string;
            perspective?: undefined;
            scale?: undefined;
        } | {
            scale: number;
            perspective?: undefined;
            rotateX?: undefined;
        })[];
        backfaceVisibility: "hidden";
    } | {
        transform: ({
            perspective: number;
            rotateY?: undefined;
            scale?: undefined;
        } | {
            rotateY: string;
            perspective?: undefined;
            scale?: undefined;
        } | {
            scale: number;
            perspective?: undefined;
            rotateY?: undefined;
        })[];
        backfaceVisibility: "hidden";
    }>;
};
//# sourceMappingURL=flip-card.animation.d.ts.map
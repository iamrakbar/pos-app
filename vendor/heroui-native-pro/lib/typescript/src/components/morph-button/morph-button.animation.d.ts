import { type SharedValue } from 'react-native-reanimated';
import type { MorphButtonContentAnimation, MorphButtonDirection, MorphButtonRootAnimation } from './morph-button.types';
/**
 * Animation hook for the MorphButton root component.
 * Owns the measured content sizes (collapsed/expanded), springs the surface
 * width/height toward the open-state target, and produces the surface and
 * expanded-host anchor styles.
 *
 * No-flicker guarantees:
 * - Both content parts stay mounted, so the expanded size is measured while
 *   still closed and the spring always starts at a known destination.
 * - Until the collapsed content reports its first layout AND the morph
 *   target has a measured size (so `surfaceWidth`/`surfaceHeight` are
 *   non-zero), the surface falls back to an absolute fill of the root
 *   footprint. Waiting on the surface size — not just collapsed — covers
 *   `defaultOpen`, where collapsed `onLayout` can fire while the expanded
 *   target is still 0.
 * - When a target size becomes available while the previous one was
 *   unmeasured (e.g. `defaultOpen` before the first layout pass), the
 *   surface snaps instead of animating from a zero size.
 * - `isOpenValue` is written during render (not in `useEffect`) so the
 *   surface spring and the content cross-fade start on the same frame as
 *   the React `isOpen` update. A post-paint sync would let expanded
 *   content fade in while still clipped to the collapsed surface.
 */
export declare function useMorphButtonRootAnimation(options: {
    /** Root animation configuration (morph spring config, disable-all) */
    animation: MorphButtonRootAnimation | undefined;
    /** Current open state */
    isOpen: boolean;
    /** Logical growth direction resolving the pinned corner/edge */
    direction: MorphButtonDirection;
    /** Window width used as the expanded content's stable measuring constraint */
    windowWidth: number;
    /** Window height used as the expanded content's stable measuring constraint */
    windowHeight: number;
}): {
    isAllAnimationsDisabled: boolean;
    isOpenValue: SharedValue<boolean>;
    collapsedWidth: SharedValue<number>;
    collapsedHeight: SharedValue<number>;
    expandedWidth: SharedValue<number>;
    expandedHeight: SharedValue<number>;
    surfaceWidth: SharedValue<number>;
    surfaceHeight: SharedValue<number>;
    rSurfaceStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        top: number;
        start: number;
        width: "100%";
        height: "100%";
    } | {
        top: number;
        start: number;
        width: number;
        height: number;
    }>;
    rExpandedHostStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        top: number;
        start: number;
        width: number;
        height: number;
    }>;
};
/**
 * Animation hook for `MorphButton.CollapsedContent`.
 * Fades/scales the collapsed row out while open.
 */
export declare function useMorphButtonCollapsedContentAnimation(options: {
    animation: MorphButtonContentAnimation | undefined;
    isOpenValue: SharedValue<boolean>;
}): {
    rContentStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: number;
        transform: {
            scale: number;
        }[];
    }>;
};
/**
 * Animation hook for `MorphButton.ExpandedContent`.
 * Fades/scales the panel content in while open.
 */
export declare function useMorphButtonExpandedContentAnimation(options: {
    animation: MorphButtonContentAnimation | undefined;
    isOpenValue: SharedValue<boolean>;
}): {
    rContentStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: number;
        transform: {
            scale: number;
        }[];
    }>;
};
//# sourceMappingURL=morph-button.animation.d.ts.map
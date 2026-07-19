import type { SharedValue } from 'react-native-reanimated';
import { FABAnimationProvider, useFABAnimation } from './fab.context';
import type { FABItemAnimation, FABItemsAppearance, FABOverlayAnimation, FABPlacement, FABRootAnimation, FABTriggerAnimation } from './fab.types';
export { FABAnimationProvider, useFABAnimation };
/**
 * Animation hook for the {@link FAB} root component.
 *
 * Owns the shared open/close `progress` value with the semantics
 * `0 = idle/closed`, `1 = open`, `2 = close target`:
 * - On open, progress resets to 0 and animates to 1.
 * - On close, progress animates from 1 to 2, then snaps back to 0 and flips
 *   `isVisible` to `false` so the portaled content unmounts only after the
 *   exit animation completes.
 *
 * All animated parts (overlay, items, trigger rotation, and custom
 * consumers such as blur backdrops) interpolate this single value, which
 * keeps backdrop and item animations orchestrated.
 *
 * Also combines the global, parent, and own animation-disabled states so
 * the root can cascade `isAllAnimationsDisabled` to descendants via
 * `AnimationSettingsProvider`.
 */
export declare function useFABRootAnimation(options: {
    /** Root animation prop (progress driver, stagger, disable-all cascade). */
    animation: FABRootAnimation | undefined;
    /** Whether the FAB is currently open. */
    isOpen: boolean;
}): {
    progress: SharedValue<number>;
    isVisible: boolean;
    staggerItemWindow: number;
    isAllAnimationsDisabled: boolean;
};
/**
 * Animation hook for the {@link FAB.Trigger} compound part.
 *
 * Rotates the trigger content with the shared progress
 * (`[idle, open, close]` degrees, `[0, 45, 0]` by default) so a plus icon
 * reads as a close affordance while the FAB is open. When disabled, the
 * rotation snaps between the idle and open angles.
 */
export declare function useFABTriggerAnimation(options: {
    /** Trigger animation prop (rotation values or disable flag). */
    animation: FABTriggerAnimation | undefined;
    /** Shared open/close progress from the root. */
    progress: SharedValue<number>;
}): {
    rContentContainerStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        transform: {
            rotate: string;
        }[];
    }>;
};
/**
 * Animation hook for the {@link FAB.Overlay} compound part.
 *
 * Fades the overlay with the shared progress (`[idle, open, close]`
 * opacities, `[0, 1, 0]` by default). When disabled, the opacity snaps
 * between the idle and open values.
 */
export declare function useFABOverlayAnimation(options: {
    /** Overlay animation prop (opacity values or disable flag). */
    animation: FABOverlayAnimation | undefined;
    /** Shared open/close progress from the root. */
    progress: SharedValue<number>;
}): {
    rOverlayStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: number;
    }>;
};
/**
 * Animation hook for a {@link FAB.Item} compound part.
 *
 * Builds the appearing motion from the shared progress: opacity fades in,
 * the item translates from the trigger direction (down for `"top"`
 * placement, up for `"bottom"`, sideways for `"left"` / `"right"`), and
 * scales from 0.9 to 1. In `"staggered"` mode the item only animates within
 * its own window of the progress range (see {@link getItemAnimationRanges}).
 * When disabled, the item snaps between hidden and visible.
 */
export declare function useFABItemAnimation(options: {
    /** Item animation prop (translate/scale values or disable flag). */
    animation: FABItemAnimation | undefined;
    /** Zero-based index of the item within the content. */
    index: number;
    /** Total number of items rendered by the content. */
    total: number;
    /** Appearing mode from the root. */
    itemsAppearance: FABItemsAppearance;
    /** Per-item stagger window from the root (fraction of the progress range). */
    staggerItemWindow: number;
    /** Resolved content placement from the root. */
    placement: FABPlacement;
    /** Shared open/close progress from the root. */
    progress: SharedValue<number>;
}): {
    rItemStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: number;
        transform: ({
            translateY: number;
            translateX?: undefined;
        } | {
            translateX: number;
            translateY?: undefined;
        } | {
            scale: number;
        })[];
    }>;
};
//# sourceMappingURL=fab.animation.d.ts.map
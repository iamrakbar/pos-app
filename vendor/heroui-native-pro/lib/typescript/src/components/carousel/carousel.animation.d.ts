import { type SharedValue } from 'react-native-reanimated';
import type { CarouselDotAnimation, CarouselRootAnimation, CarouselThumbnailAnimation } from './carousel.types';
/**
 * Animation hook for the {@link Carousel} root component.
 *
 * The carousel root owns no animated styles of its own; the hook only
 * combines the global, parent, and own animation-disabled states so the root
 * can cascade `isAllAnimationsDisabled` to descendants (the dots, thumbnails,
 * and custom slide content) via `AnimationSettingsProvider`.
 * Priority: Global > Parent > Own.
 */
export declare function useCarouselRootAnimation(options: {
    /** Root animation prop (disable-all cascade only). */
    animation: CarouselRootAnimation | undefined;
}): {
    isAllAnimationsDisabled: boolean;
};
/**
 * Animation hook for a default dot rendered by {@link Carousel.Dots}.
 *
 * Interpolates `width` and `backgroundColor` against the root `progress`
 * shared value so the selected pill slides between neighbors as the strip
 * is dragged (`[index - 1, index, index + 1]` → unselected / selected /
 * unselected). Colors are resolved at runtime with `useThemeColor` so they
 * re-resolve when the theme changes. When animations are disabled (locally
 * or via cascade), both properties snap to the discrete selected state.
 *
 * @note RTL: the dot is a symmetric shape interpolating in place — Yoga
 * row order mirrors the strip; nothing to mirror in the animated style.
 */
export declare function useCarouselDotAnimation(options: {
    /** Dot animation prop (width / backgroundColor). */
    animation: CarouselDotAnimation | undefined;
    /** Snap index of this dot. */
    index: number;
    /** Whether this dot's snap point is currently selected. */
    isSelected: boolean;
    /** Continuous snap-index progress from the carousel root. */
    progress: SharedValue<number>;
}): {
    rDotStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        width: number;
        backgroundColor: string;
    }>;
};
/**
 * Animation hook for a {@link Carousel.Thumbnail}.
 *
 * Scales the thumbnail down while pressed and fades the selection ring in on
 * the selected thumbnail. When animations are disabled (locally or via
 * cascade), both properties snap to their targets.
 *
 * @note RTL: scale and opacity are direction-neutral — nothing to mirror.
 */
export declare function useCarouselThumbnailAnimation(options: {
    /** Thumbnail animation prop (scale / ringOpacity). */
    animation: CarouselThumbnailAnimation | undefined;
    /** Whether this thumbnail's snap point is currently selected. */
    isSelected: boolean;
    /** Whether the thumbnail is currently pressed. */
    isPressed: boolean;
}): {
    rContainerStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        transform: {
            scale: number;
        }[];
    }>;
    rRingStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: number;
    }>;
};
//# sourceMappingURL=carousel.animation.d.ts.map
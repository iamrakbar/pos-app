import type { TimelineRootAnimation } from './timeline.types';
/**
 * Animation hook for the {@link Timeline} root component.
 *
 * Timeline is a static, presentation-focused component and does not animate its
 * own styles. This hook still owns the `disable-all` cascade so consumers can
 * pass `animation="disable-all"` on the root and have it propagate to any
 * animated descendants rendered inside the timeline via `AnimationSettingsProvider`.
 */
export declare function useTimelineRootAnimation(options: {
    /** Root animation prop (disable-all cascade). */
    animation: TimelineRootAnimation | undefined;
}): {
    isAllAnimationsDisabled: boolean;
};
//# sourceMappingURL=timeline.animation.d.ts.map
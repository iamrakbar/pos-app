import type { SharedValue } from 'react-native-reanimated';
import type { AgendaEventAnimation } from './agenda.types';
/**
 * Press / drag scale feedback for a timed event chip.
 *
 * The Agenda root does not own a dedicated root animation hook: the root forwards its
 * `animation` prop to the underlying `SplitView` root, which performs the `"disable-all"`
 * cascade through `AnimationSettingsProvider`. Sub-parts read the cascaded flag here.
 */
export declare function useAgendaEventAnimation(options: {
    animation: AgendaEventAnimation | undefined;
    isActive: boolean;
}): {
    rEventStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        transform: {
            scale: number;
        }[];
    }>;
};
/**
 * One drop-guide line: fades in while a drag is active and tracks the snapped drop
 * position.
 *
 * The position is intentionally NOT timed here: gesture start writes it directly so
 * the line appears at the grab position instead of gliding in from wherever the
 * previous drag left it. The 5-minute step smoothing is applied at the write sites
 * (`withTiming` on the shared value) only while a drag is in progress.
 */
export declare function useAgendaDragGuideAnimation(options: {
    isActive: SharedValue<boolean>;
    positionY: SharedValue<number>;
}): {
    rGuideStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: 0 | 1;
        transform: {
            translateY: number;
        }[];
    }>;
};
/**
 * Press feedback for the event resize grabber: scales down slightly while the
 * resize gesture is active.
 */
export declare function useAgendaEventResizeGrabberAnimation(options: {
    isResizing: SharedValue<boolean>;
}): {
    rGrabberStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        transform: {
            scale: number;
        }[];
    }>;
};
/**
 * Collapse translation for the calendar grid body: while the SplitView top section
 * shrinks toward its collapsed snap point, the week row containing the selected date
 * slides up into view and the other rows are clipped.
 *
 * The translation tracks the live drag position (it is layout, not decoration), so it
 * stays active even when animations are disabled.
 */
export declare function useAgendaCalendarCollapseAnimation(options: {
    topSectionHeight: SharedValue<number>;
    collapsedHeight: number;
    expandedHeight: number;
    weekIndex: number;
    weekRowHeight: number;
}): {
    rGridBodyStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        transform: {
            translateY: number;
        }[];
    }>;
};
//# sourceMappingURL=agenda.animation.d.ts.map
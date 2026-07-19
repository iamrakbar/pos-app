import * as TimelinePrimitives from '../../primitives/timeline';
import type { TimelineConnectorProps, TimelineContentProps, TimelineDescriptionProps, TimelineItemProps, TimelineLeadingProps, TimelineMarkerProps, TimelineProps, TimelineRailProps, TimelineTitleProps } from './timeline.types';
declare const useTimeline: typeof TimelinePrimitives.useRootContext;
declare const useTimelineItem: typeof TimelinePrimitives.useItemContext;
/**
 * Static, presentation-focused Timeline compound component.
 *
 * @component Timeline - Root container. Owns size/density/alignment context and
 * renders items as a vertical, rail-on-left chronology.
 * @component Timeline.Item - A single event row. Owns its `status` tone.
 * @component Timeline.Leading - Optional left column (e.g. timestamps).
 * @component Timeline.Rail - Relative wrapper. Renders `Marker` and `Connector`
 * by default when children are omitted.
 * @component Timeline.Marker - The dot/circle; tone derives from item status.
 * @component Timeline.Connector - Static line bridging adjacent markers.
 * @component Timeline.Content - Right column body for title/description.
 * @component Timeline.Title - Item title text.
 * @component Timeline.Description - Item description text.
 *
 * Variant and layout state flow from Timeline to sub-components via context.
 */
declare const Timeline: import("react").ForwardRefExoticComponent<TimelineProps & import("react").RefAttributes<import("react-native").View>> & {
    /** A single event row. Owns its `status` tone. */
    Item: import("react").ForwardRefExoticComponent<TimelineItemProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional Left column slot (e.g. timestamps). */
    Leading: import("react").ForwardRefExoticComponent<TimelineLeadingProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional Relative wrapper; renders `Marker` + `Connector` by default. */
    Rail: import("react").ForwardRefExoticComponent<TimelineRailProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional The marker dot/circle. */
    Marker: import("react").ForwardRefExoticComponent<TimelineMarkerProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional Static connector line between markers. */
    Connector: import("react").ForwardRefExoticComponent<TimelineConnectorProps & import("react").RefAttributes<import("react-native").View>>;
    /** Right column body for title/description. */
    Content: import("react").ForwardRefExoticComponent<TimelineContentProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional Item title text. */
    Title: import("react").ForwardRefExoticComponent<TimelineTitleProps & import("react").RefAttributes<import("react-native").Text>>;
    /** @optional Item description text. */
    Description: import("react").ForwardRefExoticComponent<TimelineDescriptionProps & import("react").RefAttributes<import("react-native").Text>>;
};
export default Timeline;
export { useTimeline, useTimelineItem };
//# sourceMappingURL=timeline.d.ts.map
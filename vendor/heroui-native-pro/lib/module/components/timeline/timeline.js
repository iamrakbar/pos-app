"use strict";

import { AnimationSettingsProvider } from 'heroui-native/contexts';
import { Children, cloneElement, forwardRef, Fragment, isValidElement, useMemo } from 'react';
import * as TimelinePrimitives from "../../primitives/timeline/index.js";
import { useTimelineRootAnimation } from "./timeline.animation.js";
import { DISPLAY_NAME } from "./timeline.constants.js";
import { timelineClassNames } from "./timeline.styles.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const useTimeline = TimelinePrimitives.useRootContext;
const useTimelineItem = TimelinePrimitives.useItemContext;

// --------------------------------------------------

const TimelineRoot = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    animation,
    children,
    className,
    density = 'comfortable',
    itemAlign = 'start',
    size = 'md',
    ...restProps
  } = props;
  const {
    isAllAnimationsDisabled
  } = useTimelineRootAnimation({
    animation
  });
  const enhancedChildren = useMemo(() => {
    const childArray = Children.toArray(children);
    const itemElements = childArray.filter(child => /*#__PURE__*/isValidElement(child) && child.type === TimelineItem);
    const totalItems = itemElements.length;
    let itemCounter = 0;
    return childArray.map(child => {
      if (/*#__PURE__*/isValidElement(child) && child.type === TimelineItem) {
        const idx = itemCounter;
        itemCounter += 1;
        return /*#__PURE__*/cloneElement(child, {
          _index: idx,
          _isLast: idx === totalItems - 1,
          key: child.key ?? `timeline-item-${idx}`
        });
      }
      return child;
    });
  }, [children]);
  const rootClassName = timelineClassNames.root({
    className
  });
  const animationSettingsContextValue = useMemo(() => ({
    isAllAnimationsDisabled
  }), [isAllAnimationsDisabled]);
  return /*#__PURE__*/_jsx(TimelinePrimitives.Root, {
    ref: ref,
    className: rootClassName,
    density: density,
    itemAlign: itemAlign,
    size: size,
    skipInjectItemIndices: true,
    ...restProps,
    children: /*#__PURE__*/_jsx(AnimationSettingsProvider, {
      value: animationSettingsContextValue,
      children: enhancedChildren
    })
  });
});

// --------------------------------------------------

const TimelineItem = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    align,
    children,
    className,
    status = 'default',
    ...restProps
  } = props;
  const {
    density,
    itemAlign
  } = useTimeline();
  const isLast = restProps._isLast ?? false;
  const resolvedAlign = align ?? itemAlign;
  const itemClassName = timelineClassNames.item({
    align: resolvedAlign,
    density,
    isLast,
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Item, {
    ref: ref,
    align: align,
    className: itemClassName,
    status: status,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const TimelineLeading = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const leadingClassName = timelineClassNames.leading({
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Leading, {
    ref: ref,
    className: leadingClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const TimelineMarker = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const {
    size
  } = useTimeline();
  const {
    status
  } = useTimelineItem();
  const markerClassName = timelineClassNames.marker({
    size,
    status,
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Marker, {
    ref: ref,
    className: markerClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const TimelineConnector = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    className,
    ...restProps
  } = props;
  const connectorClassName = timelineClassNames.connector({
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Connector, {
    ref: ref,
    className: connectorClassName,
    ...restProps
  });
});

// --------------------------------------------------

const TimelineRail = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const railClassName = timelineClassNames.rail({
    className
  });
  const hasExplicitChildren = Children.count(children) > 0;
  const railChildren = hasExplicitChildren ? children : /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsx(TimelineMarker, {}), /*#__PURE__*/_jsx(TimelineConnector, {})]
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Rail, {
    ref: ref,
    className: railClassName,
    ...restProps,
    children: railChildren
  });
});

// --------------------------------------------------

const TimelineContent = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const contentClassName = timelineClassNames.content({
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Content, {
    ref: ref,
    className: contentClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const TimelineTitle = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const {
    size
  } = useTimeline();
  const titleClassName = timelineClassNames.title({
    size,
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Title, {
    ref: ref,
    className: titleClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const TimelineDescription = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const {
    size
  } = useTimeline();
  const descriptionClassName = timelineClassNames.description({
    size,
    className
  });
  return /*#__PURE__*/_jsx(TimelinePrimitives.Description, {
    ref: ref,
    className: descriptionClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

TimelineRoot.displayName = DISPLAY_NAME.ROOT;
TimelineItem.displayName = DISPLAY_NAME.ITEM;
TimelineLeading.displayName = DISPLAY_NAME.LEADING;
TimelineRail.displayName = DISPLAY_NAME.RAIL;
TimelineMarker.displayName = DISPLAY_NAME.MARKER;
TimelineConnector.displayName = DISPLAY_NAME.CONNECTOR;
TimelineContent.displayName = DISPLAY_NAME.CONTENT;
TimelineTitle.displayName = DISPLAY_NAME.TITLE;
TimelineDescription.displayName = DISPLAY_NAME.DESCRIPTION;

// --------------------------------------------------

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
const Timeline = Object.assign(TimelineRoot, {
  /** A single event row. Owns its `status` tone. */
  Item: TimelineItem,
  /** @optional Left column slot (e.g. timestamps). */
  Leading: TimelineLeading,
  /** @optional Relative wrapper; renders `Marker` + `Connector` by default. */
  Rail: TimelineRail,
  /** @optional The marker dot/circle. */
  Marker: TimelineMarker,
  /** @optional Static connector line between markers. */
  Connector: TimelineConnector,
  /** Right column body for title/description. */
  Content: TimelineContent,
  /** @optional Item title text. */
  Title: TimelineTitle,
  /** @optional Item description text. */
  Description: TimelineDescription
});
export default Timeline;
export { useTimeline, useTimelineItem };
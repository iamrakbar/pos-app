"use strict";

import { AnimationSettingsProvider, useAnimationSettings } from 'heroui-native/contexts';
import { Children, forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FullWindowOverlay, HeroText } from "../../helpers/internal/components/index.js";
import { useControllableState } from "../../helpers/internal/hooks/index.js";
import { childrenToString, isStringifiableChildren } from "../../helpers/internal/utils/index.js";
import * as FABPrimitives from "../../primitives/fab/index.js";
import { useFABItemAnimation, useFABOverlayAnimation, useFABRootAnimation, useFABTriggerAnimation } from "./fab.animation.js";
import { DEFAULT_CONTENT_OFFSET, DEFAULT_INSETS, DISPLAY_NAME } from "./fab.constants.js";
import { FABAnimationProvider, FABItemIndexProvider, FABProvider, useFABAnimation, useFABContext, useFABItemIndex } from "./fab.context.js";
import { fabClassNames, fabStyleSheet } from "./fab.styles.js";
import { jsx as _jsx } from "react/jsx-runtime";
const useFAB = FABPrimitives.useRootContext;

// --------------------------------------------------

const FABRoot = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    itemsAppearance = 'staggered',
    isOpen: isOpenProp,
    isDefaultOpen,
    className,
    onOpenChange: onOpenChangeProp,
    animation,
    ...restProps
  } = props;
  const [isOpen = false, onOpenChange] = useControllableState({
    prop: isOpenProp,
    defaultProp: isDefaultOpen,
    onChange: onOpenChangeProp
  });
  const rootClassName = fabClassNames.root({
    className
  });
  const {
    progress,
    isVisible,
    staggerItemWindow,
    isAllAnimationsDisabled
  } = useFABRootAnimation({
    animation,
    isOpen
  });
  const animationSettingsContextValue = useMemo(() => ({
    isAllAnimationsDisabled
  }), [isAllAnimationsDisabled]);
  const animationContextValue = useMemo(() => ({
    progress
  }), [progress]);
  const contextValue = useMemo(() => ({
    itemsAppearance,
    staggerItemWindow,
    isVisible
  }), [itemsAppearance, staggerItemWindow, isVisible]);
  return /*#__PURE__*/_jsx(AnimationSettingsProvider, {
    value: animationSettingsContextValue,
    children: /*#__PURE__*/_jsx(FABAnimationProvider, {
      value: animationContextValue,
      children: /*#__PURE__*/_jsx(FABProvider, {
        value: contextValue,
        children: /*#__PURE__*/_jsx(FABPrimitives.Root, {
          ref: ref,
          className: rootClassName,
          isOpen: isOpen,
          isDefaultOpen: isDefaultOpen,
          onOpenChange: onOpenChange,
          ...restProps,
          children: children
        })
      })
    })
  });
});

// --------------------------------------------------

const FABTrigger = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    isDisabled = false,
    className,
    classNames,
    styles,
    style,
    animation,
    isAnimatedStyleActive = true,
    ...restProps
  } = props;
  const {
    isDisabled: isDisabledRoot
  } = useFAB();
  const {
    progress
  } = useFABAnimation();
  const isDisabledValue = isDisabled || (isDisabledRoot ?? false);
  const {
    container,
    contentContainer
  } = fabClassNames.trigger({
    isDisabled: isDisabledValue
  });
  const containerClassName = container({
    className: [className, classNames?.container]
  });
  const contentContainerClassName = contentContainer({
    className: classNames?.contentContainer
  });
  const {
    rContentContainerStyle
  } = useFABTriggerAnimation({
    animation,
    progress
  });
  const containerStyle = typeof style === 'function' ? state => [styles?.container, style(state)] : [styles?.container, style].filter(Boolean);
  const contentContainerStyle = isAnimatedStyleActive ? [rContentContainerStyle, styles?.contentContainer] : styles?.contentContainer;
  return /*#__PURE__*/_jsx(FABPrimitives.Trigger, {
    ref: ref,
    isDisabled: isDisabled,
    className: containerClassName,
    style: containerStyle,
    ...restProps,
    children: /*#__PURE__*/_jsx(Animated.View, {
      className: contentContainerClassName,
      style: contentContainerStyle,
      pointerEvents: "none",
      children: children
    })
  });
});

// --------------------------------------------------

/**
 * `FAB.Portal` renders into a host via the portal system, which breaks React
 * context from the root. This wrapper re-provides the animation settings,
 * animation, and FAB contexts so portaled descendants (overlay, content,
 * items, and custom backdrops) can still consume them.
 *
 * The portal stays mounted while `isVisible` is `true`, which keeps the
 * content around until the close animation completes.
 */
const FABPortal = props => {
  const {
    children,
    className,
    forceMount,
    disableFullWindowOverlay = false,
    unstable_accessibilityContainerViewIsModal,
    ...restProps
  } = props;
  const animationSettingsContext = useAnimationSettings();
  const animationContext = useFABAnimation();
  const fabContext = useFABContext();
  const portalClassName = fabClassNames.portal({
    className
  });
  if (!forceMount && !fabContext.isVisible) {
    return null;
  }
  return /*#__PURE__*/_jsx(FABPrimitives.Portal, {
    forceMount: true,
    ...restProps,
    children: /*#__PURE__*/_jsx(AnimationSettingsProvider, {
      value: animationSettingsContext,
      children: /*#__PURE__*/_jsx(FABAnimationProvider, {
        value: animationContext,
        children: /*#__PURE__*/_jsx(FABProvider, {
          value: fabContext,
          children: /*#__PURE__*/_jsx(FullWindowOverlay, {
            disableFullWindowOverlay: disableFullWindowOverlay,
            unstable_accessibilityContainerViewIsModal: unstable_accessibilityContainerViewIsModal,
            children: /*#__PURE__*/_jsx(View, {
              className: portalClassName,
              pointerEvents: "box-none",
              children: children
            })
          })
        })
      })
    })
  });
};

// --------------------------------------------------

const FABOverlay = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    className,
    style,
    animation,
    isAnimatedStyleActive = true,
    ...restProps
  } = props;
  const {
    isOpen
  } = useFAB();
  const {
    progress
  } = useFABAnimation();
  const overlayClassName = fabClassNames.overlay({
    className
  });
  const {
    rOverlayStyle
  } = useFABOverlayAnimation({
    animation,
    progress
  });

  // The animated opacity lives on the wrapper so the primitive keeps a
  // plain (non-animated) ref type.
  const containerStyle = isAnimatedStyleActive ? [StyleSheet.absoluteFill, rOverlayStyle] : StyleSheet.absoluteFill;
  return /*#__PURE__*/_jsx(Animated.View, {
    style: containerStyle,
    pointerEvents: "box-none",
    children: /*#__PURE__*/_jsx(FABPrimitives.Overlay, {
      ref: ref,
      className: overlayClassName,
      style: style,
      forceMount: true,
      pointerEvents: isOpen ? 'auto' : 'none',
      ...restProps
    })
  });
});

// --------------------------------------------------

const FABContent = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    offset = DEFAULT_CONTENT_OFFSET,
    insets = DEFAULT_INSETS,
    ...restProps
  } = props;
  const {
    isOpen,
    placement,
    align
  } = useFAB();

  // Cross-axis alignment of the item column. For vertical placements the
  // resolved align applies directly; for horizontal placements the items
  // hug the trigger side instead (the resolved align positions the whole
  // column vertically via the positioning engine).
  const itemsAlign = placement === 'left' ? 'end' : placement === 'right' ? 'start' : align;
  const contentClassName = fabClassNames.content({
    align: itemsAlign,
    className
  });
  const items = Children.toArray(children);
  const total = items.length;
  return /*#__PURE__*/_jsx(FABPrimitives.Content, {
    ref: ref,
    forceMount: true,
    className: contentClassName,
    offset: offset,
    insets: insets,
    pointerEvents: isOpen ? 'box-none' : 'none',
    ...restProps,
    children: items.map((child, index) => /*#__PURE__*/_jsx(FABItemIndexProvider, {
      value: {
        index,
        total
      },
      children: child
    }, index))
  });
});

// --------------------------------------------------

const FABItem = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    disabled,
    className,
    style,
    animation,
    isAnimatedStyleActive = true,
    ...restProps
  } = props;
  const {
    placement
  } = useFAB();
  const {
    itemsAppearance,
    staggerItemWindow
  } = useFABContext();
  const {
    progress
  } = useFABAnimation();
  const {
    index,
    total
  } = useFABItemIndex();
  const itemClassName = fabClassNames.item({
    isDisabled: !!disabled,
    className
  });
  const {
    rItemStyle
  } = useFABItemAnimation({
    animation,
    index,
    total,
    itemsAppearance,
    staggerItemWindow,
    placement,
    progress
  });
  const resolvedChildren = isStringifiableChildren(children) ? /*#__PURE__*/_jsx(FABItemLabel, {
    children: childrenToString(children)
  }) : children;
  const itemStyle = typeof style === 'function' ? state => [fabStyleSheet.item, style(state)] : [fabStyleSheet.item, style];

  // The animated appearing motion lives on a wrapper so the primitive
  // keeps a plain (non-animated) ref type.
  return /*#__PURE__*/_jsx(Animated.View, {
    style: isAnimatedStyleActive ? rItemStyle : undefined,
    children: /*#__PURE__*/_jsx(FABPrimitives.Item, {
      ref: ref,
      className: itemClassName,
      style: itemStyle,
      disabled: disabled,
      ...restProps,
      children: resolvedChildren
    })
  });
});

// --------------------------------------------------

const FABItemLabel = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const itemLabelClassName = fabClassNames.itemLabel({
    className
  });
  return /*#__PURE__*/_jsx(HeroText, {
    ref: ref,
    className: itemLabelClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

FABRoot.displayName = DISPLAY_NAME.ROOT;
FABTrigger.displayName = DISPLAY_NAME.TRIGGER;
FABPortal.displayName = DISPLAY_NAME.PORTAL;
FABOverlay.displayName = DISPLAY_NAME.OVERLAY;
FABContent.displayName = DISPLAY_NAME.CONTENT;
FABItem.displayName = DISPLAY_NAME.ITEM;
FABItemLabel.displayName = DISPLAY_NAME.ITEM_LABEL;

/**
 * Compound FAB (floating action button) component with sub-components.
 *
 * @component FAB - Root container that owns the open state (controlled via
 * `isOpen` + `onOpenChange` or uncontrolled via `isDefaultOpen`), resolves
 * the content placement/alignment — automatically from the trigger position
 * on screen by default (`placement="auto"`, `align="auto"`) — and drives the
 * shared open/close progress (0 = idle, 1 = open, 2 = close) that
 * orchestrates the overlay, items, and trigger rotation.
 *
 * @component FAB.Trigger - The floating button itself. Toggles the open
 * state on press, measures its own position for auto placement, and rotates
 * its content with the shared progress.
 *
 * @component FAB.Portal - Renders the overlay and content in a portal layer
 * above other content. Stays mounted while the close animation plays and
 * re-provides the FAB contexts to portaled descendants.
 *
 * @component FAB.Overlay - Optional backdrop behind the content. Fades with
 * the shared progress and closes the FAB when pressed. Replace it with a
 * custom component (e.g. a blur backdrop built on `useFABAnimation`) for
 * custom backdrops.
 *
 * @component FAB.Content - Positioned column of items. Placement/alignment
 * follow the root resolution; provides each child its index so items can
 * stagger.
 *
 * @component FAB.Item - Single action row. Appears with the shared progress
 * (staggered by default, nearest to the trigger first) and closes the FAB on
 * press. String children are wrapped in `FAB.ItemLabel` automatically.
 *
 * @component FAB.ItemLabel - Optional text label inside an item.
 *
 * Props flow from FAB to sub-components via context (resolved placement and
 * alignment, items appearance, and the shared open/close progress).
 *
 */
const FAB = Object.assign(FABRoot, {
  /** The floating button. Toggles the open state and measures itself for auto placement. */
  Trigger: FABTrigger,
  /** Portals the overlay and content above other content; keeps them mounted during the close animation. */
  Portal: FABPortal,
  /** @optional Backdrop behind the content, faded by the shared progress. */
  Overlay: FABOverlay,
  /** Positioned column of items with automatic placement and stagger indices. */
  Content: FABContent,
  /** @optional Single action row; staggered by default and closes the FAB on press. */
  Item: FABItem,
  /** @optional Text label inside an item; applied automatically for string children. */
  ItemLabel: FABItemLabel
});
export default FAB;
export { useFAB, useFABAnimation };
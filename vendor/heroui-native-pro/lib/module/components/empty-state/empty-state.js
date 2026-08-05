"use strict";

import { ThemeBackground, useHasDefaultThemeBackground } from 'heroui-native';
import { AnimationSettingsProvider } from 'heroui-native/contexts';
import { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import { HeroText } from "../../helpers/internal/components/index.js";
import { useEmptyStateRootAnimation } from "./empty-state.animation.js";
import { DISPLAY_NAME } from "./empty-state.constants.js";
import { emptyStateClassNames } from "./empty-state.styles.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// --------------------------------------------------

const EmptyStateRoot = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    animation,
    ...restProps
  } = props;
  const rootClassName = emptyStateClassNames.root({
    className
  });
  const {
    isAllAnimationsDisabled
  } = useEmptyStateRootAnimation({
    animation
  });
  const animationSettingsContextValue = useMemo(() => ({
    isAllAnimationsDisabled
  }), [isAllAnimationsDisabled]);
  return /*#__PURE__*/_jsx(AnimationSettingsProvider, {
    value: animationSettingsContextValue,
    children: /*#__PURE__*/_jsx(View, {
      ref: ref,
      className: rootClassName,
      ...restProps,
      children: children
    })
  });
});

// --------------------------------------------------

const EmptyStateHeader = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const headerClassName = emptyStateClassNames.header({
    className
  });
  return /*#__PURE__*/_jsx(View, {
    ref: ref,
    className: headerClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

/**
 * Generic absolute-fill background container rendered behind the icon media
 * circle. With no `children`, the active library theme decides the default
 * content: `glass` renders a `GlassView` blur layer; other themes render
 * nothing. Pass `children` to host arbitrary content (gradients, images)
 * with the container's positioning and clipping applied.
 */
const EmptyStateMediaBackground = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    className,
    ...restProps
  } = props;
  const mediaBackgroundClassName = emptyStateClassNames.mediaBackground({
    className
  });
  return /*#__PURE__*/_jsx(ThemeBackground, {
    ref: ref,
    className: mediaBackgroundClassName,
    fallbackColor: "default",
    ...restProps
  });
});

// --------------------------------------------------

const EmptyStateMedia = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    variant = 'default',
    className,
    background,
    ...restProps
  } = props;
  const hasDefaultThemeBackground = useHasDefaultThemeBackground();
  const mediaClassName = emptyStateClassNames.media({
    variant,
    className
  });

  /**
   * Background layer rendered behind the media surface.
   * - `undefined`: theme-aware default for the `icon` variant, which is
   *   the only variant painting `--color-default`
   * - custom node: replaces the default layer
   * - `null`: removes the layer
   */
  const backgroundElement = background !== undefined ? background : hasDefaultThemeBackground && variant === 'icon' ? /*#__PURE__*/_jsx(EmptyStateMediaBackground, {}) : null;
  return /*#__PURE__*/_jsxs(View, {
    ref: ref,
    className: mediaClassName,
    ...restProps,
    children: [backgroundElement, children]
  });
});

// --------------------------------------------------

const EmptyStateTitle = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const titleClassName = emptyStateClassNames.title({
    className
  });
  return /*#__PURE__*/_jsx(HeroText, {
    ref: ref,
    className: titleClassName,
    accessibilityRole: "header",
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const EmptyStateDescription = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const descriptionClassName = emptyStateClassNames.description({
    className
  });
  return /*#__PURE__*/_jsx(HeroText, {
    ref: ref,
    className: descriptionClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

const EmptyStateContent = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    ...restProps
  } = props;
  const contentClassName = emptyStateClassNames.content({
    className
  });
  return /*#__PURE__*/_jsx(View, {
    ref: ref,
    className: contentClassName,
    ...restProps,
    children: children
  });
});

// --------------------------------------------------

EmptyStateRoot.displayName = DISPLAY_NAME.ROOT;
EmptyStateHeader.displayName = DISPLAY_NAME.HEADER;
EmptyStateMedia.displayName = DISPLAY_NAME.MEDIA;
EmptyStateMediaBackground.displayName = DISPLAY_NAME.MEDIA_BACKGROUND;
EmptyStateTitle.displayName = DISPLAY_NAME.TITLE;
EmptyStateDescription.displayName = DISPLAY_NAME.DESCRIPTION;
EmptyStateContent.displayName = DISPLAY_NAME.CONTENT;

// --------------------------------------------------

/**
 * Compound `EmptyState` component with optional media and actions.
 *
 * @component EmptyState - Root container for empty-state messaging and actions.
 * @component EmptyState.Header - Groups media, title, and description.
 * @component EmptyState.Media - Optional icon/avatar container.
 * @component EmptyState.MediaBackground - Theme-aware background layer
 * behind the icon media circle.
 * @component EmptyState.Title - Primary heading text.
 * @component EmptyState.Description - Secondary supporting copy.
 * @component EmptyState.Content - Optional action area.
 *
 */
const EmptyState = Object.assign(EmptyStateRoot, {
  /** @optional Header grouping block. */
  Header: EmptyStateHeader,
  /** @optional Media container for icon or avatar content. */
  Media: EmptyStateMedia,
  /** @optional Theme-aware background layer behind the icon media circle. */
  MediaBackground: EmptyStateMediaBackground,
  /** @optional Primary heading text. */
  Title: EmptyStateTitle,
  /** @optional Secondary description text. */
  Description: EmptyStateDescription,
  /** @optional Action area below the header. */
  Content: EmptyStateContent
});
export default EmptyState;
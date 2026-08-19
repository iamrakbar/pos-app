"use strict";

import { useIsRTL, useThemeColor } from 'heroui-native/hooks';
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DEFAULT_ICON_COLOR = '#000000';

/**
 * Default chevron icon for the SlideButton thumb. Points toward the slide
 * direction — right in LTR, left in RTL (mirrored via `scaleX`).
 * Uses white by default for contrast against the variant background.
 */
export const ChevronRightIcon = ({
  size = 20,
  color
}) => {
  const themeColorPlaceholder = useThemeColor('field-placeholder');
  const isRTL = useIsRTL();
  const fillColor = color ?? themeColorPlaceholder ?? DEFAULT_ICON_COLOR;
  return /*#__PURE__*/_jsxs(Svg, {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    style: {
      transform: [{
        scaleX: isRTL ? -1 : 1
      }]
    },
    children: [/*#__PURE__*/_jsx(Rect, {
      width: 16,
      height: 16,
      fill: "none"
    }), /*#__PURE__*/_jsx(Path, {
      fill: fillColor,
      fillRule: "evenodd",
      d: "M5.47 13.03a.75.75 0 0 1 0-1.06L9.44 8L5.47 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0",
      clipRule: "evenodd"
    })]
  });
};
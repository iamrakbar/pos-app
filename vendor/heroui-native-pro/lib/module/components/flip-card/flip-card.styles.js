"use strict";

import { StyleSheet } from 'react-native';
import { tv } from 'tailwind-variants';
import { combineStyles } from "../../helpers/internal/utils/index.js";
const root = tv({
  base: 'relative w-full aspect-[1.6]'
});

/**
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * - `transform` (perspective, rotateY/rotateX, scale) - Animated for the 3D flip
 * - `backfaceVisibility` - Set to `hidden` so the face disappears mid-flip
 *
 * To customize the flip spring, use the `animation` prop on `FlipCard`:
 * ```tsx
 * <FlipCard
 *   animation={{
 *     progress: { springConfig: { stiffness: 90, damping: 14 } },
 *   }}
 * />
 * ```
 *
 * To disable animated styles, set `isAnimatedStyleActive={false}` on the face.
 */
const front = tv({
  base: 'size-full p-3 overflow-hidden rounded-3xl bg-surface'
});

/**
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * - `transform` (perspective, rotateY/rotateX, scale) - Animated for the 3D flip
 * - `backfaceVisibility` - Set to `hidden` so the face disappears mid-flip
 *
 * To customize the flip spring, use the `animation` prop on `FlipCard`.
 * To disable animated styles, set `isAnimatedStyleActive={false}` on the face.
 */
const back = tv({
  base: 'absolute inset-0 p-3 overflow-hidden rounded-3xl bg-surface'
});
export const flipCardClassNames = combineStyles({
  root,
  front,
  back
});

/**
 * Native-only style sheet for properties Tailwind cannot express. The
 * `face` entry applies the iOS continuous (squircle) corner curve to both
 * card faces.
 */
export const flipCardStyleSheet = StyleSheet.create({
  face: {
    borderCurve: 'continuous'
  }
});
export default flipCardClassNames;
"use strict";

import { StyleSheet } from 'react-native';
import { tv } from 'tailwind-variants';
import { combineStyles } from "../../helpers/internal/utils/index.js";

/**
 * Root wrapper around the trigger. Position the FAB by passing positioning
 * classes (e.g. `absolute bottom-6 right-6`) via `className` on `FAB`.
 */
const root = tv({
  base: 'self-start'
});

/**
 * Trigger slots: the pressable button surface (`container`) and the inner
 * wrapper (`contentContainer`) that rotates with the shared progress.
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The `contentContainer` slot animates the following:
 * - `transform` (rotate) - Animated for the open/close icon rotation
 *
 * To customize, use the `animation` prop on `FAB.Trigger`:
 * ```tsx
 * <FAB.Trigger animation={{ rotate: { value: [0, 135, 0] } }} />
 * ```
 *
 * To disable animated styles, set `isAnimatedStyleActive={false}`.
 */
const trigger = tv({
  slots: {
    container: 'size-12 items-center justify-center rounded-3xl bg-accent',
    contentContainer: 'items-center justify-center'
  },
  variants: {
    isDisabled: {
      true: {
        container: 'opacity-disabled pointer-events-none'
      }
    }
  },
  defaultVariants: {
    isDisabled: false
  }
});

/**
 * Portal container filling the screen above other content. Uses
 * `pointerEvents="box-none"` in the component so touches pass through to
 * the app where no FAB content is rendered.
 */
const portal = tv({
  base: 'absolute inset-0'
});

/**
 * Overlay backdrop behind the FAB content.
 *
 * @note ANIMATED PROPERTIES (applied to an internal wrapper around the overlay):
 * - `opacity` - Animated for the overlay show/hide transitions (idle: 0, open: 1, close: 0)
 *
 * Values set via className/style compose with the wrapper animation
 * instead of overriding it (e.g. a className `opacity` multiplies with the
 * animated one).
 *
 * To customize, use the `animation` prop on `FAB.Overlay`:
 * ```tsx
 * <FAB.Overlay animation={{ opacity: { value: [0, 0.6, 0] } }} />
 * ```
 *
 * To disable animated styles, set `isAnimatedStyleActive={false}`.
 */
const overlay = tv({
  base: 'flex-1 bg-backdrop'
});

/**
 * Positioned column of FAB items. Cross-axis alignment follows the resolved
 * `align` so items hug the trigger edge.
 */
const content = tv({
  base: 'gap-3',
  variants: {
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end'
    }
  },
  defaultVariants: {
    align: 'end'
  }
});

/**
 * Single FAB action row.
 *
 * @note ANIMATED PROPERTIES (applied to an internal wrapper around the row):
 * - `opacity` - Animated for the item show/hide transitions
 * - `transform` (translateX/translateY, scale) - Animated for the item appearing motion
 *
 * Values set via className/style compose with the wrapper animation
 * instead of overriding it (e.g. a className `opacity` multiplies with the
 * animated one).
 *
 * To customize, use the `animation` prop on `FAB.Item`:
 * ```tsx
 * <FAB.Item animation={{ translate: { value: 24 }, scale: { value: [0.8, 1] } }} />
 * ```
 *
 * To remove the animated wrapper styles, set `isAnimatedStyleActive={false}`.
 */
const item = tv({
  base: 'flex-row items-center gap-2.5 rounded-2xl shadow-overlay bg-overlay px-4 py-2.5',
  variants: {
    isDisabled: {
      true: 'opacity-disabled pointer-events-none'
    }
  },
  defaultVariants: {
    isDisabled: false
  }
});

/**
 * Text label inside a FAB item.
 */
const itemLabel = tv({
  base: 'text-sm font-medium text-foreground'
});
export const fabClassNames = combineStyles({
  root,
  trigger,
  portal,
  overlay,
  content,
  item,
  itemLabel
});
export const fabStyleSheet = StyleSheet.create({
  item: {
    borderCurve: 'continuous'
  }
});
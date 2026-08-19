"use strict";

import { cn } from 'heroui-native/utils';
import { StyleSheet } from 'react-native';
import { tv } from 'tailwind-variants';
import { combineStyles } from "../../helpers/internal/utils/index.js";

/**
 * Root container for the range calendar (primitive `RangeCalendarRoot` wrapper).
 */
const root = tv({
  base: 'range-calendar__root'
});

/**
 * Header row: navigation + title region.
 */
const header = tv({
  base: 'range-calendar__header'
});

/**
 * Month / year title text.
 */
const heading = tv({
  base: 'range-calendar__heading'
});

/**
 * Previous / next control.
 */
const navButton = tv({
  base: cn('range-calendar__nav-button', 'data-[pressed-not-disabled=true]:bg-default-hover/50', 'data-[disabled=true]:opacity-disabled')
});

/**
 * Month grid wrapper.
 */
const grid = tv({
  base: 'data-[readonly=true]:opacity-100'
});

/**
 * Weekday header cell.
 */
const headerCell = tv({
  base: 'range-calendar__header-cell'
});

/**
 * Weekday label text inside `headerCell`.
 */
const headerCellLabel = tv({
  base: 'range-calendar__header-cell-label'
});

/**
 * Day cell (pressable): range highlight strip (`bg-accent-soft`) and row rounding; endpoints use `cellBody`.
 *
 * @note The highlight caps must be direction-aware: rows flip in RTL, so the
 * range start caps the leading edge (physical right in RTL) and the range end
 * the trailing edge. They are written as arbitrary `border-{top,bottom}-{start,end}-radius`
 * properties (React Native's older logical corner set) because the two
 * alternatives break on Android:
 * - Physical `rounded-l/r-*` with `rtl:` overrides double-flip there (Android
 *   auto-swaps physical left/right radii in RTL, iOS does not).
 * - W3C logical `rounded-s/e-*` (`border-start-start-radius` family) hit a
 *   React Native Android bug: `BorderRadiusStyle.resolve` maps `startEnd` /
 *   `endStart` to the wrong corners, so two of the four caps vanish.
 * The `border{Top,Bottom}{Start,End}Radius` props resolve correctly per view
 * layout direction on both platforms.
 */
const cell = tv({
  base: cn('range-calendar__cell', 'data-[range-start=true]:bg-accent-soft', 'data-[range-start=true]:[border-top-start-radius:var(--radius-4xl)]', 'data-[range-start=true]:[border-bottom-start-radius:var(--radius-4xl)]', 'data-[range-end=true]:bg-accent-soft', 'data-[range-end=true]:[border-top-end-radius:var(--radius-4xl)]', 'data-[range-end=true]:[border-bottom-end-radius:var(--radius-4xl)]', 'data-[range-middle=true]:bg-accent-soft data-[range-middle=true]:rounded-none', 'data-[range-middle-row-start=true]:[border-top-start-radius:var(--radius-xl)]', 'data-[range-middle-row-start=true]:[border-bottom-start-radius:var(--radius-xl)]', 'data-[range-middle-row-end=true]:[border-top-end-radius:var(--radius-xl)]', 'data-[range-middle-row-end=true]:[border-bottom-end-radius:var(--radius-xl)]', 'data-[unavailable=true]:opacity-disabled', 'data-[disabled=true]:opacity-disabled', 'data-[readonly=true]:pointer-events-none')
});

/**
 * Inner body: selected range endpoints (accent circle + shadow).
 *
 * @note ANIMATED PROPERTIES (cannot be set via className):
 * The following properties are animated and cannot be overridden using Tailwind classes:
 * - `transform` (scale) - Animated for press feedback when the day cell is pressed
 *
 * To customize these properties, use the `animation` prop on `RangeCalendar.CellBody`:
 * ```tsx
 * <RangeCalendar.CellBody
 *   animation={{
 *     scale: {
 *       value: [1, 0.9],
 *       timingConfig: { duration: 120 },
 *     },
 *   }}
 * />
 * ```
 *
 * To completely disable animated styles and apply your own via className or style prop,
 * set `isAnimatedStyleActive={false}` on `RangeCalendar.CellBody`.
 */
const cellBody = tv({
  base: cn('range-calendar__cell-body', 'data-[today-not-in-range=true]:bg-accent-soft', 'data-[pressed=true]:bg-default-hover/50', 'data-[range-start=true]:bg-accent data-[range-start=true]:shadow-sm', 'data-[range-end=true]:bg-accent data-[range-end=true]:shadow-sm')
});

/**
 * Day label. Uses `data-range-start` / `data-range-end` for range-endpoint foreground color.
 */
const cellLabel = tv({
  base: cn('range-calendar__cell-label', 'data-[today-not-in-range=true]:text-accent-soft-foreground', 'data-[outside-month=true]:text-muted', 'data-[range-start=true]:text-accent-foreground data-[range-start=true]:font-medium', 'data-[range-end=true]:text-accent-foreground data-[range-end=true]:font-medium')
});

/**
 * Event / dot marker under a day.
 */
const cellIndicator = tv({
  base: cn('range-calendar__cell-indicator', 'data-[selected=true]:bg-accent-foreground')
});
export const rangeCalendarClassNames = combineStyles({
  root,
  header,
  heading,
  navButton,
  grid,
  headerCell,
  cell,
  cellBody,
  cellLabel,
  cellIndicator,
  headerCellLabel
});
export default rangeCalendarClassNames;
export const rangeCalendarStyleSheet = StyleSheet.create({
  borderCurve: {
    borderCurve: 'continuous'
  }
});
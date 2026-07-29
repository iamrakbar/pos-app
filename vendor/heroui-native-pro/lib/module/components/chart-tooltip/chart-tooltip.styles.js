"use strict";

import { tv } from 'tailwind-variants';
import { combineStyles } from "../../helpers/internal/utils/index.js";

/**
 * Card root and floating host — `absolute left-0 top-0` positions the tooltip in chart
 * space; `transform` and `opacity` are owned by the component's animated style.
 */
const root = tv({
  base: 'chart-tooltip__root'
});
const header = tv({
  base: 'chart-tooltip__header'
});
const item = tv({
  base: 'chart-tooltip__item'
});
const indicator = tv({
  base: 'chart-tooltip__indicator',
  defaultVariants: {
    variant: 'dot'
  },
  variants: {
    variant: {
      dot: 'chart-tooltip__indicator--variant-dot',
      line: 'chart-tooltip__indicator--variant-line'
    }
  }
});
const label = tv({
  base: 'chart-tooltip__label'
});
const value = tv({
  base: 'chart-tooltip__value'
});
export const chartTooltipClassNames = combineStyles({
  header,
  indicator,
  item,
  label,
  root,
  value
});
export default chartTooltipClassNames;
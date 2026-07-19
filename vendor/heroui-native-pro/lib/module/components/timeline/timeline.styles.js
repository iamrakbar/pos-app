"use strict";

import { tv } from 'tailwind-variants';
import { combineStyles } from "../../helpers/internal/utils/index.js";
const root = tv({
  base: 'flex-col'
});
const item = tv({
  base: 'flex-row gap-3',
  variants: {
    align: {
      start: 'items-start',
      center: 'items-center'
    },
    density: {
      comfortable: '',
      compact: ''
    },
    isLast: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [{
    density: 'comfortable',
    isLast: false,
    className: 'pb-5'
  }, {
    density: 'compact',
    isLast: false,
    className: 'pb-3'
  }],
  defaultVariants: {
    align: 'start',
    density: 'comfortable',
    isLast: false
  }
});
const leading = tv({
  base: 'w-10'
});
const rail = tv({
  base: 'items-center'
});
const marker = tv({
  base: 'items-center justify-center border bg-transparent',
  variants: {
    size: {
      sm: 'size-5.5 rounded-xl',
      md: 'size-7 rounded-2xl',
      lg: 'size-9 border-2 rounded-3xl'
    },
    status: {
      default: 'border-border',
      muted: 'border-border',
      current: 'border-accent bg-accent-soft',
      success: 'border-success bg-success-soft',
      warning: 'border-warning bg-warning-soft',
      danger: 'border-danger bg-danger-soft'
    }
  },
  defaultVariants: {
    size: 'md',
    status: 'default'
  }
});
const connector = tv({
  base: 'w-px bg-border'
});
const content = tv({
  base: 'min-w-0 flex-1 flex-col'
});
const title = tv({
  base: 'font-medium text-foreground',
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
const description = tv({
  base: 'text-muted',
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
export const timelineClassNames = combineStyles({
  root,
  item,
  leading,
  rail,
  marker,
  connector,
  content,
  title,
  description
});
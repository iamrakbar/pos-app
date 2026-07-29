"use strict";

import { StyleSheet } from 'react-native';
import { tv } from 'tailwind-variants';
import { combineStyles } from "../../helpers/internal/utils/index.js";
const root = tv({
  base: 'number-stepper__root',
  variants: {
    isDisabled: {
      true: 'number-stepper__root--is-disabled',
      false: ''
    }
  },
  defaultVariants: {
    isDisabled: false
  }
});

/**
 * To completely disable animated styles and apply your own via className or style prop,
 * set `isAnimatedStyleActive={false}` on `NumberStepper.DecrementButton` / `NumberStepper.IncrementButton`.
 */
const button = tv({
  base: 'number-stepper__button',
  variants: {
    isDisabled: {
      true: 'disabled:opacity-disabled',
      false: ''
    }
  },
  defaultVariants: {
    isDisabled: false
  }
});
const value = tv({
  base: 'number-stepper__value'
});
export const numberStepperClassNames = combineStyles({
  root,
  button,
  value
});
export const numberStepperStyleSheet = StyleSheet.create({
  button: {
    borderCurve: 'continuous'
  }
});
"use strict";

import { ThemeBackground, useHasDefaultThemeBackground } from 'heroui-native';
import { AnimationSettingsProvider } from 'heroui-native/contexts';
import { forwardRef, useCallback, useMemo } from 'react';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { HeroText } from "../../helpers/internal/components/index.js";
import * as NumberStepperPrimitives from "../../primitives/number-stepper/index.js";
import { useNumberStepperButtonAnimation, useNumberStepperRootAnimation, useNumberStepperValueAnimation } from "./number-stepper.animation.js";
import { DISPLAY_NAME } from "./number-stepper.constants.js";
import { MinusIcon, PlusIcon } from "./number-stepper.icons.js";
import { numberStepperClassNames, numberStepperStyleSheet } from "./number-stepper.styles.js";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const AnimatedText = Animated.createAnimatedComponent(HeroText);
const AnimatedDecrementButton = Animated.createAnimatedComponent(NumberStepperPrimitives.DecrementButton);
const AnimatedIncrementButton = Animated.createAnimatedComponent(NumberStepperPrimitives.IncrementButton);
const useNumberStepper = NumberStepperPrimitives.useRootContext;

// --------------------------------------------------

/**
 * Generic absolute-fill background container rendered behind the root
 * surface. With no `children`, the active library theme decides the default
 * content: `glass` renders a `GlassView` blur layer; other themes render
 * nothing. Pass `children` to host arbitrary content (gradients, images)
 * with the container's positioning and clipping applied. The root paints
 * the `--color-default` tint, so the Android / web fallback flattens the
 * `default` token to match.
 */
const NumberStepperRootBackground = /*#__PURE__*/forwardRef(({
  className,
  ...props
}, ref) => {
  const rootBackgroundClassName = numberStepperClassNames.rootBackground({
    className
  });
  return /*#__PURE__*/_jsx(ThemeBackground, {
    ref: ref,
    className: rootBackgroundClassName,
    fallbackColor: "default",
    ...props
  });
});

// --------------------------------------------------

const NumberStepperRoot = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    className,
    animation,
    isDisabled = false,
    background,
    children,
    ...restProps
  } = props;
  const hasDefaultThemeBackground = useHasDefaultThemeBackground();
  const rootClassName = numberStepperClassNames.root({
    isDisabled,
    className
  });
  const {
    isAllAnimationsDisabled
  } = useNumberStepperRootAnimation({
    animation
  });
  const animationSettingsContextValue = useMemo(() => ({
    isAllAnimationsDisabled
  }), [isAllAnimationsDisabled]);

  /**
   * Background layer rendered behind the root surface.
   * - `undefined`: theme-aware default when the active theme registers
   *   default background content
   * - custom node: replaces the default layer
   * - `null`: removes the layer
   */
  const backgroundElement = background !== undefined ? background : hasDefaultThemeBackground ? /*#__PURE__*/_jsx(NumberStepperRootBackground, {}) : null;
  return /*#__PURE__*/_jsx(AnimationSettingsProvider, {
    value: animationSettingsContextValue,
    children: /*#__PURE__*/_jsx(NumberStepperPrimitives.Root, {
      ref: ref,
      className: rootClassName,
      isDisabled: isDisabled,
      ...restProps,
      children: typeof children === 'function' ? renderProps => /*#__PURE__*/_jsxs(_Fragment, {
        children: [backgroundElement, children(renderProps)]
      }) : /*#__PURE__*/_jsxs(_Fragment, {
        children: [backgroundElement, children]
      })
    })
  });
});

// --------------------------------------------------

/**
 * Generic absolute-fill background container rendered behind a stepper
 * button's content. With no `children`, the active library theme decides
 * the default content: `glass` renders a `GlassView` blur layer; other
 * themes render nothing. Pass `children` to host arbitrary content
 * (gradients, images) with the container's positioning and clipping applied.
 * The buttons paint the translucent `--color-field` tint, so the Android /
 * web fallback flattens the `field` token to match.
 */
const NumberStepperButtonBackground = /*#__PURE__*/forwardRef(({
  className,
  ...props
}, ref) => {
  const buttonBackgroundClassName = numberStepperClassNames.buttonBackground({
    className
  });
  return /*#__PURE__*/_jsx(ThemeBackground, {
    ref: ref,
    className: buttonBackgroundClassName,
    fallbackColor: "field",
    ...props
  });
});

// --------------------------------------------------

const NumberStepperDecrementButton = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    style,
    iconProps,
    background,
    animation,
    isAnimatedStyleActive = true,
    keepActiveAtBoundary,
    onPressIn,
    onPressOut,
    ...restProps
  } = props;
  const {
    isDisabled: rootDisabled,
    isAtMin
  } = useNumberStepper();
  const hasDefaultThemeBackground = useHasDefaultThemeBackground();
  const {
    rButtonStyle,
    animationOnPressIn,
    animationOnPressOut
  } = useNumberStepperButtonAnimation({
    animation
  });
  const showDisabledStyle = !rootDisabled && !keepActiveAtBoundary && isAtMin;
  const buttonClassName = numberStepperClassNames.button({
    isDisabled: showDisabledStyle,
    className
  });
  const handlePressIn = useCallback(e => {
    animationOnPressIn();
    onPressIn?.(e);
  }, [animationOnPressIn, onPressIn]);
  const handlePressOut = useCallback(e => {
    animationOnPressOut();
    onPressOut?.(e);
  }, [animationOnPressOut, onPressOut]);
  const buttonStyle = isAnimatedStyleActive ? typeof style === 'function' ? style : [numberStepperStyleSheet.button, rButtonStyle, style] : typeof style === 'function' ? style : [numberStepperStyleSheet.button, style];

  /**
   * Background layer rendered behind the button content.
   * - `undefined`: theme-aware default when the active theme registers
   *   default background content
   * - custom node: replaces the default layer
   * - `null`: removes the layer
   */
  const backgroundElement = background !== undefined ? background : hasDefaultThemeBackground ? /*#__PURE__*/_jsx(NumberStepperButtonBackground, {}) : null;
  return /*#__PURE__*/_jsxs(AnimatedDecrementButton, {
    ref: ref,
    className: buttonClassName,
    style: buttonStyle,
    keepActiveAtBoundary: keepActiveAtBoundary,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    ...restProps,
    children: [backgroundElement, children ?? /*#__PURE__*/_jsx(MinusIcon, {
      ...iconProps
    })]
  });
});

// --------------------------------------------------

const NumberStepperValue = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    animation,
    ...restProps
  } = props;
  const {
    value,
    direction
  } = useNumberStepper();
  const {
    entering,
    exiting
  } = useNumberStepperValueAnimation({
    animation,
    direction
  });
  const valueClassName = numberStepperClassNames.value({
    className
  });
  const displayContent = children ?? String(value);
  return /*#__PURE__*/_jsx(LayoutAnimationConfig, {
    skipEntering: true,
    skipExiting: true,
    children: /*#__PURE__*/_jsx(AnimatedText, {
      ref: ref,
      entering: entering,
      exiting: exiting,
      className: valueClassName,
      ...restProps,
      children: displayContent
    }, String(value))
  });
});

// --------------------------------------------------

const NumberStepperIncrementButton = /*#__PURE__*/forwardRef((props, ref) => {
  const {
    children,
    className,
    style,
    iconProps,
    background,
    animation,
    isAnimatedStyleActive = true,
    keepActiveAtBoundary,
    onPressIn,
    onPressOut,
    ...restProps
  } = props;
  const {
    isDisabled: rootDisabled,
    isAtMax
  } = useNumberStepper();
  const hasDefaultThemeBackground = useHasDefaultThemeBackground();
  const {
    rButtonStyle,
    animationOnPressIn,
    animationOnPressOut
  } = useNumberStepperButtonAnimation({
    animation
  });
  const showDisabledStyle = !rootDisabled && !keepActiveAtBoundary && isAtMax;
  const buttonClassName = numberStepperClassNames.button({
    isDisabled: showDisabledStyle,
    className
  });
  const handlePressIn = useCallback(e => {
    animationOnPressIn();
    onPressIn?.(e);
  }, [animationOnPressIn, onPressIn]);
  const handlePressOut = useCallback(e => {
    animationOnPressOut();
    onPressOut?.(e);
  }, [animationOnPressOut, onPressOut]);
  const buttonStyle = isAnimatedStyleActive ? typeof style === 'function' ? style : [numberStepperStyleSheet.button, rButtonStyle, style] : typeof style === 'function' ? style : [numberStepperStyleSheet.button, style];

  /**
   * Background layer rendered behind the button content.
   * - `undefined`: theme-aware default when the active theme registers
   *   default background content
   * - custom node: replaces the default layer
   * - `null`: removes the layer
   */
  const backgroundElement = background !== undefined ? background : hasDefaultThemeBackground ? /*#__PURE__*/_jsx(NumberStepperButtonBackground, {}) : null;
  return /*#__PURE__*/_jsxs(AnimatedIncrementButton, {
    ref: ref,
    className: buttonClassName,
    style: buttonStyle,
    keepActiveAtBoundary: keepActiveAtBoundary,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    ...restProps,
    children: [backgroundElement, children ?? /*#__PURE__*/_jsx(PlusIcon, {
      ...iconProps
    })]
  });
});

// --------------------------------------------------

NumberStepperRoot.displayName = DISPLAY_NAME.ROOT;
NumberStepperRootBackground.displayName = DISPLAY_NAME.ROOT_BACKGROUND;
NumberStepperDecrementButton.displayName = DISPLAY_NAME.DECREMENT_BUTTON;
NumberStepperButtonBackground.displayName = DISPLAY_NAME.BUTTON_BACKGROUND;
NumberStepperValue.displayName = DISPLAY_NAME.VALUE;
NumberStepperIncrementButton.displayName = DISPLAY_NAME.INCREMENT_BUTTON;

/**
 * Compound NumberStepper component with sub-components
 *
 * @component NumberStepper - Root container managing numeric value state.
 * Provides disabled context to sub-components.
 * Supports both controlled and uncontrolled value state.
 *
 * @component NumberStepper.RootBackground - Absolute-fill background
 * container behind the root surface. With no children, the active library
 * theme decides the content (glass theme renders a blur layer with a
 * default-matched fallback). Replaceable via the `background` prop on
 * NumberStepper.
 *
 * @component NumberStepper.DecrementButton - Pressable button that decreases
 * the value by one step. Auto-disabled at minValue. Renders a minus icon
 * by default; accepts custom children for full customization.
 *
 * @component NumberStepper.ButtonBackground - Absolute-fill background
 * container behind a stepper button's content. With no children, the active
 * library theme decides the content (glass theme renders a blur layer).
 * Replaceable via the `background` prop on the buttons.
 *
 * @component NumberStepper.Value - Displays the current numeric value with
 * flip animations on change (matching InputOTP pattern). Remounts on
 * value change to trigger entering/exiting layout animations.
 *
 * @component NumberStepper.IncrementButton - Pressable button that increases
 * the value by one step. Auto-disabled at maxValue. Renders a plus icon
 * by default; accepts custom children for full customization.
 *
 * Props flow from NumberStepper to sub-components via context (value,
 * isDisabled, isAtMin, isAtMax, increment, decrement).
 *
 */
const NumberStepper = Object.assign(NumberStepperRoot, {
  /** @optional Theme-aware background container behind the root surface */
  RootBackground: NumberStepperRootBackground,
  /** @optional Pressable button to decrease value by one step */
  DecrementButton: NumberStepperDecrementButton,
  /** @optional Theme-aware background container behind a stepper button */
  ButtonBackground: NumberStepperButtonBackground,
  /** @optional Display for the current numeric value with animations */
  Value: NumberStepperValue,
  /** @optional Pressable button to increase value by one step */
  IncrementButton: NumberStepperIncrementButton
});
export default NumberStepper;
export { useNumberStepper };
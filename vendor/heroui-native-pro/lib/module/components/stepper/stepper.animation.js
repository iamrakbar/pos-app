"use strict";

import { useAnimationSettings } from 'heroui-native/contexts';
import { useCombinedAnimationDisabledState, useIsRTL } from 'heroui-native/hooks';
import { useEffect, useMemo, useRef } from 'react';
import { cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { createContext, getAnimationState, getAnimationValueMergedConfig, getIsAnimationDisabledValue, getRootAnimationState } from "../../helpers/internal/utils/index.js";
const [StepperAnimationProvider, useStepperAnimation] = createContext({
  name: 'StepperAnimationContext'
});
export { StepperAnimationProvider, useStepperAnimation };

// --------------------------------------------------

export function useStepperRootAnimation(options) {
  const {
    animation,
    currentStep
  } = options;
  const isAllAnimationsDisabled = useCombinedAnimationDisabledState(animation);
  const {
    animationConfig,
    isAnimationDisabled
  } = getRootAnimationState(animation);
  const isAnimationDisabledValue = getIsAnimationDisabledValue({
    isAnimationDisabled,
    isAllAnimationsDisabled
  });
  const progressTimingConfig = useMemo(() => getAnimationValueMergedConfig({
    animationValue: animationConfig?.progress,
    property: 'timingConfig',
    defaultValue: {
      duration: 200,
      easing: Easing.out(Easing.ease)
    }
  }), [animationConfig]);
  const progress = useSharedValue(currentStep);

  /**
   * Tracks the last applied step so Strict Mode double-invocation does not
   * run a spurious timing animation on mount, and so we only animate when the
   * step actually changes after the initial sync.
   */
  const prevStepRef = useRef(null);
  useEffect(() => {
    if (prevStepRef.current === null) {
      progress.set(currentStep);
      prevStepRef.current = currentStep;
      return;
    }
    if (prevStepRef.current === currentStep) {
      return;
    }
    prevStepRef.current = currentStep;
    if (isAnimationDisabledValue) {
      cancelAnimation(progress);
      progress.set(currentStep);
      return;
    }
    cancelAnimation(progress);
    progress.set(withTiming(currentStep, progressTimingConfig));
  }, [currentStep, isAnimationDisabledValue, progress, progressTimingConfig]);
  return {
    progress,
    isAllAnimationsDisabled
  };
}

// --------------------------------------------------

/** Top-center origin — scaleY fills downward from the top */
const TRANSFORM_ORIGIN_VERTICAL = 'top center';
/** Left-center origin — scaleX fills rightward from the left (LTR) */
const TRANSFORM_ORIGIN_HORIZONTAL = 'left center';
/** Right-center origin — scaleX fills leftward from the right (RTL) */
const TRANSFORM_ORIGIN_HORIZONTAL_RTL = 'right center';

/**
 * Animated scale for `Stepper.SeparatorFill` from root `progress` and step `index`.
 * Output maps `[index - 1, index]` to scale `[0, 1]`; vertical: `scaleY`; horizontal: `scaleX`.
 * When fill animation is disabled, scale snaps to `0` or `1` (no interpolation vs `progress`).
 */
export function useStepperSeparatorFillAnimation(options) {
  const {
    animation,
    index,
    orientation,
    progress
  } = options;
  const {
    isAllAnimationsDisabled
  } = useAnimationSettings();
  const isRTL = useIsRTL();
  const {
    isAnimationDisabled
  } = getAnimationState(animation);
  const isAnimationDisabledValue = getIsAnimationDisabledValue({
    isAnimationDisabled,
    isAllAnimationsDisabled
  });

  // Steps flow right-to-left in RTL, so the horizontal fill grows from the
  // physical right edge (the previous step's side) instead of the left.
  const horizontalOrigin = isRTL ? TRANSFORM_ORIGIN_HORIZONTAL_RTL : TRANSFORM_ORIGIN_HORIZONTAL;
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    if (isAnimationDisabledValue) {
      const t = p >= index - 0.5 ? 1 : 0;
      if (orientation === 'vertical') {
        return {
          transform: [{
            scaleY: t
          }],
          transformOrigin: TRANSFORM_ORIGIN_VERTICAL
        };
      }
      return {
        transform: [{
          scaleX: t
        }],
        transformOrigin: horizontalOrigin
      };
    }
    const t = interpolate(p, [index - 1, index], [0, 1], Extrapolation.CLAMP);
    if (orientation === 'vertical') {
      return {
        transform: [{
          scaleY: t
        }],
        transformOrigin: TRANSFORM_ORIGIN_VERTICAL
      };
    }
    return {
      transform: [{
        scaleX: t
      }],
      transformOrigin: horizontalOrigin
    };
  }, [index, isAnimationDisabledValue, orientation, progress]);
  return {
    animatedStyle
  };
}
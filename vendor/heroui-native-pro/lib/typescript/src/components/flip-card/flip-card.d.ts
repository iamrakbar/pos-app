import { useFlipCardAnimation } from './flip-card.animation';
import type { FlipCardBackProps, FlipCardContextValue, FlipCardFrontProps, FlipCardRootProps } from './flip-card.types';
declare const useFlipCard: () => FlipCardContextValue;
/**
 * Compound FlipCard component with sub-components.
 *
 * @component FlipCard - Pressable root container that flips between a
 * front and a back face with a spring-driven 3D rotation. Supports
 * controlled (`isFlipped` + `onFlipChange`) and uncontrolled
 * (`defaultFlipped`) usage; tapping toggles the flip unless
 * `isPressDisabled` is set. Flip axis follows `direction`
 * (`"horizontal"` = rotateY, `"vertical"` = rotateX) and the spin
 * direction follows `rotation` (`"normal"` or `"reverse"`).
 *
 * @component FlipCard.Front - Face visible at rest. Rotates from 0deg to
 * 180deg as the card flips; hides mid-flip via `backfaceVisibility`.
 * Stops receiving touches while the card is flipped.
 *
 * @component FlipCard.Back - Face revealed when flipped. Positioned
 * absolutely over the front and rotates from 180deg to 360deg. Only
 * receives touches while the card is flipped, so hidden interactive
 * content cannot intercept presses meant for the front face.
 *
 * Props flow from FlipCard to sub-components via context
 * (isFlipped, direction, toggle, and the shared flip progress).
 *
 */
declare const FlipCard: import("react").ForwardRefExoticComponent<FlipCardRootProps & import("react").RefAttributes<import("react-native").View>> & {
    /** @optional Face visible at rest (progress 0). */
    Front: import("react").ForwardRefExoticComponent<FlipCardFrontProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional Face revealed when the card is flipped (progress 1). */
    Back: import("react").ForwardRefExoticComponent<FlipCardBackProps & import("react").RefAttributes<import("react-native").View>>;
};
export default FlipCard;
export { useFlipCard, useFlipCardAnimation };
//# sourceMappingURL=flip-card.d.ts.map
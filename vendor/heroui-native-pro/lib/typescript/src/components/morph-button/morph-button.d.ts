import type { MorphButtonCollapsedContentProps, MorphButtonContextValue, MorphButtonExpandedContentProps, MorphButtonRootProps } from './morph-button.types';
declare const useMorphButton: () => MorphButtonContextValue;
/**
 * Compound MorphButton component with sub-components
 *
 * @component MorphButton - Root container managing the open state. A
 * pressable, consumer-positioned anchor whose layout footprint always equals
 * the collapsed content; the morphing surface is absolutely anchored inside
 * it and springs between the measured collapsed and expanded content sizes,
 * growing toward `direction` while the opposite corner/edge stays pinned.
 * Both content parts stay mounted, so the expanded size is measured in
 * advance and opening never starts from an unknown size.
 *
 * @component MorphButton.CollapsedContent - In-flow content shown while
 * collapsed. Its natural size defines the root footprint and the collapsed
 * morph target. Fades/scales out while open.
 *
 * @component MorphButton.ExpandedContent - Always-mounted panel content
 * measured at its natural size while hidden (window-sized wrapping
 * constraint, so it never reflows mid-morph). Fades/scales in while open.
 * Set an explicit width via `className` (e.g. `w-72`) for panel layouts.
 *
 * Props flow from MorphButton to sub-components via context
 * (isOpen, isOpenValue, direction, variant, measured sizes, animated
 * surface size, open/close/toggle).
 *
 * @note RTL: fully logical. The surface and the expanded host anchor via
 * `start` offsets and logical flex alignment (`align-items` cross-axis start
 * = inline start), and the `start` / `end` direction values are logical by
 * definition, so all eight growth directions mirror in RTL without any JS
 * direction checks.
 */
declare const MorphButton: import("react").ForwardRefExoticComponent<MorphButtonRootProps & import("react").RefAttributes<import("react-native").View>> & {
    /** @optional In-flow collapsed content defining the root footprint */
    CollapsedContent: import("react").ForwardRefExoticComponent<MorphButtonCollapsedContentProps & import("react").RefAttributes<import("react-native").View>>;
    /** @optional Always-mounted expanded panel content, pre-measured while hidden */
    ExpandedContent: import("react").ForwardRefExoticComponent<MorphButtonExpandedContentProps & import("react").RefAttributes<import("react-native").View>>;
};
export default MorphButton;
export { useMorphButton };
//# sourceMappingURL=morph-button.d.ts.map
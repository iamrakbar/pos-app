import { View } from 'react-native';
import type { BadgeAnchorProps, BadgeBackgroundProps, BadgeContextValue, BadgeLabelProps, BadgeRootProps } from './badge.types';
declare const useBadge: () => BadgeContextValue;
/**
 * Compound Badge component with sub-components
 *
 * @component Badge - The badge indicator itself. Renders as a dot when
 * no children are provided, or as a pill with content. Supports color,
 * variant, size, and placement props. When used inside Badge.Anchor,
 * it is absolutely positioned at the specified corner.
 *
 * @component Badge.Anchor - Relative wrapper that positions the Badge
 * over another element (e.g. Avatar, Icon).
 *
 * @component Badge.Background - Absolute-fill background container behind
 * the badge surface. With no children, the active library theme decides the
 * default content (e.g. a glass blur layer); pass children to host custom
 * content with the same positioning and clipping.
 *
 * @component Badge.Label - Text content inside the badge. Automatically
 * used when string/number children are passed to Badge.
 *
 * Props flow from Badge to sub-components via context
 * (size, color, variant, isDot).
 *
 */
declare const Badge: import("react").ForwardRefExoticComponent<BadgeRootProps & import("react").RefAttributes<View>> & {
    /** Relative wrapper for positioning the badge over another element */
    Anchor: import("react").ForwardRefExoticComponent<BadgeAnchorProps & import("react").RefAttributes<View>>;
    /** Theme-aware background container behind the badge surface */
    Background: import("react").ForwardRefExoticComponent<BadgeBackgroundProps & import("react").RefAttributes<View>>;
    /** Text content inside the badge */
    Label: import("react").ForwardRefExoticComponent<BadgeLabelProps & import("react").RefAttributes<import("react-native").Text>>;
};
export default Badge;
export { useBadge };
//# sourceMappingURL=badge.d.ts.map
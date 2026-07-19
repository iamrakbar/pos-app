import { View } from 'react-native';
import * as FABPrimitives from '../../primitives/fab';
import { useFABAnimation } from './fab.context';
import type { FABContentProps, FABItemLabelProps, FABItemProps, FABOverlayProps, FABPortalProps, FABRootProps, FABTriggerProps } from './fab.types';
declare const useFAB: () => FABPrimitives.IRootContext;
/**
 * Compound FAB (floating action button) component with sub-components.
 *
 * @component FAB - Root container that owns the open state (controlled via
 * `isOpen` + `onOpenChange` or uncontrolled via `isDefaultOpen`), resolves
 * the content placement/alignment — automatically from the trigger position
 * on screen by default (`placement="auto"`, `align="auto"`) — and drives the
 * shared open/close progress (0 = idle, 1 = open, 2 = close) that
 * orchestrates the overlay, items, and trigger rotation.
 *
 * @component FAB.Trigger - The floating button itself. Toggles the open
 * state on press, measures its own position for auto placement, and rotates
 * its content with the shared progress.
 *
 * @component FAB.Portal - Renders the overlay and content in a portal layer
 * above other content. Stays mounted while the close animation plays and
 * re-provides the FAB contexts to portaled descendants.
 *
 * @component FAB.Overlay - Optional backdrop behind the content. Fades with
 * the shared progress and closes the FAB when pressed. Replace it with a
 * custom component (e.g. a blur backdrop built on `useFABAnimation`) for
 * custom backdrops.
 *
 * @component FAB.Content - Positioned column of items. Placement/alignment
 * follow the root resolution; provides each child its index so items can
 * stagger.
 *
 * @component FAB.Item - Single action row. Appears with the shared progress
 * (staggered by default, nearest to the trigger first) and closes the FAB on
 * press. String children are wrapped in `FAB.ItemLabel` automatically.
 *
 * @component FAB.ItemLabel - Optional text label inside an item.
 *
 * Props flow from FAB to sub-components via context (resolved placement and
 * alignment, items appearance, and the shared open/close progress).
 *
 */
declare const FAB: import("react").ForwardRefExoticComponent<FABRootProps & import("react").RefAttributes<View>> & {
    /** The floating button. Toggles the open state and measures itself for auto placement. */
    Trigger: import("react").ForwardRefExoticComponent<FABTriggerProps & import("react").RefAttributes<FABPrimitives.TriggerRef>>;
    /** Portals the overlay and content above other content; keeps them mounted during the close animation. */
    Portal: {
        (props: FABPortalProps): import("react/jsx-runtime").JSX.Element | null;
        displayName: "HeroUINative.FAB.Portal";
    };
    /** @optional Backdrop behind the content, faded by the shared progress. */
    Overlay: import("react").ForwardRefExoticComponent<FABOverlayProps & import("react").RefAttributes<View>>;
    /** Positioned column of items with automatic placement and stagger indices. */
    Content: import("react").ForwardRefExoticComponent<FABContentProps & import("react").RefAttributes<View>>;
    /** @optional Single action row; staggered by default and closes the FAB on press. */
    Item: import("react").ForwardRefExoticComponent<FABItemProps & import("react").RefAttributes<View>>;
    /** @optional Text label inside an item; applied automatically for string children. */
    ItemLabel: import("react").ForwardRefExoticComponent<FABItemLabelProps & import("react").RefAttributes<import("react-native").Text>>;
};
export default FAB;
export { useFAB, useFABAnimation };
//# sourceMappingURL=fab.d.ts.map
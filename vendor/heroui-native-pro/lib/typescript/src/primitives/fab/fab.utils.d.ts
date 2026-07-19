import type { ScaledSize } from 'react-native';
import type { LayoutPosition } from '../../helpers/internal/hooks';
import type { Align, AutoAlign, AutoPlacement, Placement } from './fab.types';
/**
 * Resolves the content placement from the trigger position on screen.
 *
 * Explicit placements pass through unchanged. `"auto"` compares the trigger's
 * vertical center against the screen midpoint: a trigger in the bottom half
 * opens upwards (`"top"`), a trigger in the top half opens downwards
 * (`"bottom"`). Falls back to `"top"` when the trigger is not measured yet.
 *
 * @param placement - Placement prop value from the root
 * @param triggerPosition - Measured trigger position, or null before measure
 * @param dimensions - Screen dimensions used for the midpoint comparison
 * @returns The resolved placement
 */
export declare function resolvePlacement(placement: AutoPlacement, triggerPosition: LayoutPosition | null, dimensions: ScaledSize): Placement;
/**
 * Resolves the content alignment from the trigger position on screen.
 *
 * Explicit alignments pass through unchanged. `"auto"` splits the axis
 * perpendicular to the resolved placement into thirds: the first third
 * resolves to `"start"`, the last third to `"end"`, and the middle third to
 * `"center"`. For `"top"` / `"bottom"` placements the horizontal position is
 * used; for `"left"` / `"right"` placements the vertical position is used.
 * Falls back to `"end"` when the trigger is not measured yet.
 *
 * @param align - Align prop value from the root
 * @param placement - Resolved placement (defines the alignment axis)
 * @param triggerPosition - Measured trigger position, or null before measure
 * @param dimensions - Screen dimensions used for the thirds comparison
 * @returns The resolved alignment
 */
export declare function resolveAlign(align: AutoAlign, placement: Placement, triggerPosition: LayoutPosition | null, dimensions: ScaledSize): Align;
//# sourceMappingURL=fab.utils.d.ts.map
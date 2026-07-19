import type { FABAnimationContextValue, FABContextValue, FABItemIndexContextValue } from './fab.types';
/**
 * All FAB contexts live in this dedicated module (rather than in `fab.tsx`
 * or `fab.animation.ts`) so Fast Refresh edits to the component or
 * animation files do not recreate the context objects. FAB content renders
 * through the portal store, which keeps previously captured provider
 * elements alive for a frame after a hot reload; if the contexts were
 * recreated, patched consumers (e.g. `FAB.Item`) would read a different
 * context instance than those stored providers and crash with a
 * "wrap component within the Provider" error.
 */
declare const FABProvider: import("react").Provider<FABContextValue>, useFABContext: () => FABContextValue;
declare const FABAnimationProvider: import("react").Provider<FABAnimationContextValue>, useFABAnimation: () => FABAnimationContextValue;
declare const FABItemIndexProvider: import("react").Provider<FABItemIndexContextValue>, useFABItemIndex: () => FABItemIndexContextValue;
export { FABAnimationProvider, FABItemIndexProvider, FABProvider, useFABAnimation, useFABContext, useFABItemIndex, };
//# sourceMappingURL=fab.context.d.ts.map
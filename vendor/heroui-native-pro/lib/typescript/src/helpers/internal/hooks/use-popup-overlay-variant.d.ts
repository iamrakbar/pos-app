import type { PopupOverlayVariant } from '../types';
/**
 * Resolves the effective overlay variant for components whose overlay paints
 * a solid backdrop (e.g. FAB).
 *
 * When `variant` is omitted, the `glass` library theme defaults to `blur`;
 * every other theme defaults to `default`. A requested `blur` variant is
 * downgraded to `default` when blur is unsupported (non-iOS or expo-blur
 * missing).
 *
 * @param variant - Requested overlay variant, or `undefined` to derive it
 * from the active library theme.
 * @returns The resolved variant and a convenience `isBlurVariant` flag.
 */
export declare function usePopupOverlayVariant(variant?: PopupOverlayVariant): {
    resolvedVariant: PopupOverlayVariant;
    isBlurVariant: boolean;
};
//# sourceMappingURL=use-popup-overlay-variant.d.ts.map
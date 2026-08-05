import type { FC } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { PopupOverlayBlurViewProps } from '../types';
export interface PopupOverlayBlurProps {
    /**
     * Popup animation progress shared value (0=idle, 1=open, 2=close).
     */
    progress: SharedValue<number>;
    /**
     * Props forwarded to the underlying BlurView. `intensity` is treated as the
     * maximum (animated) intensity; `tint` and `style` override the defaults.
     */
    blurViewProps?: PopupOverlayBlurViewProps;
}
/**
 * Blur backdrop layer rendered behind a popup overlay when the overlay
 * `variant` resolves to `blur`.
 *
 * Blur intensity mirrors the overlay's progress-driven opacity animation:
 * it interpolates [0, 1, 2] -> [0, max, 0]. Renders nothing when expo-blur is
 * not installed.
 *
 * @note The layer is never hit-testable: the overlay pressable is rendered
 * above it and owns press handling, including its own `pointerEvents` gating.
 * A hit-testable full-screen blur layer would block the UI behind it.
 */
export declare const PopupOverlayBlurView: FC<PopupOverlayBlurProps>;
//# sourceMappingURL=popup-overlay-blur-view.d.ts.map
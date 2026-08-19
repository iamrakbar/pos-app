import type { AnimationRootDisableAll } from '../../helpers/internal/types';
/**
 * Root animation: respects `animation="disable-all"` like `Autocomplete` /
 * `DateField`. The returned flag is cascaded to descendants via
 * `AnimationSettingsProvider` in the `ComboBox` root.
 */
export declare function useComboBoxRootAnimation(options: {
    animation: AnimationRootDisableAll | undefined;
}): {
    isAllAnimationsDisabled: boolean;
};
//# sourceMappingURL=combo-box.animation.d.ts.map
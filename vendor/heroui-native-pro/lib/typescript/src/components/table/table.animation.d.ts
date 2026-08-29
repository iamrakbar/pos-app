import type { TableSortDirection } from '../../primitives/table/table.types';
import type { TableColumnAnimation, TableRootAnimation } from './table.types';
/**
 * Animation hook for the {@link Table} root component.
 *
 * The table root owns no animated styles of its own; the hook only combines
 * the global, parent, and own animation-disabled states so the root can
 * cascade `isAllAnimationsDisabled` to descendants (the sort indicator,
 * checkboxes, custom cell content) via `AnimationSettingsProvider`.
 * Priority: Global > Parent > Own.
 */
export declare function useTableRootAnimation(options: {
    /** Root animation prop (disable-all cascade only). */
    animation: TableRootAnimation | undefined;
}): {
    isAllAnimationsDisabled: boolean;
};
/**
 * Animation hook for a {@link Table.Column}'s sort indicator.
 *
 * Fades the indicator in only on the column driving the active sort and
 * rotates the chevron between the ascending (0°) and descending (180°)
 * positions. When animations are disabled (locally or via cascade), both
 * properties snap to their targets.
 *
 * @note RTL: the flip is a rotation between an up- and a down-pointing
 * chevron — direction-neutral glyphs — so no mirroring is required.
 */
export declare function useTableSortIndicatorAnimation(options: {
    /** Column animation prop (rotation / opacity of the indicator). */
    animation: TableColumnAnimation | undefined;
    /** Whether this column drives the active sort. */
    isSorted: boolean;
    /** Direction of the active sort when `isSorted` is true. */
    sortDirection: TableSortDirection | undefined;
}): {
    rIndicatorStyle: import("react-native-reanimated/lib/typescript/hook/commonTypes").AnimatedStyleHandle<{
        opacity: number;
        transform: {
            rotate: string;
        }[];
    }>;
};
//# sourceMappingURL=table.animation.d.ts.map
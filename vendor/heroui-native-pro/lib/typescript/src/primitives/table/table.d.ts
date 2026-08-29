import { View, type ViewStyle } from 'react-native';
import type { CellInjectedProps, ColumnInjectedProps, RowInjectedProps, TableColumnContextValue, TableKey, TableRootContextValue, TableRowContextValue, TableSortDescriptor } from './table.types';
/**
 * Provider used by parent layers to seed {@link TableRowLayoutContext} with
 * a computed row width (see the context JSDoc above).
 */
declare const RowLayoutProvider: import("react").Provider<number | undefined>;
declare function useRootContext(): TableRootContextValue;
declare function useColumnContext(): TableColumnContextValue;
declare function useRowContext(): TableRowContextValue;
declare const Root: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
    selectionMode?: import("./table.types").TableSelectionMode;
    selectedKeys?: Iterable<TableKey>;
    defaultSelectedKeys?: Iterable<TableKey>;
    onSelectionChange?: (keys: Set<TableKey>) => void;
    disabledKeys?: Iterable<TableKey>;
    disallowEmptySelection?: boolean;
    sortDescriptor?: TableSortDescriptor;
    defaultSortDescriptor?: TableSortDescriptor;
    onSortChange?: (descriptor: TableSortDescriptor) => void;
} & import("react").RefAttributes<View>>;
declare const Header: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
    skipInjectColumnIndices?: boolean;
} & import("react").RefAttributes<View>>;
declare const Column: import("react").ForwardRefExoticComponent<Omit<import("../../helpers/internal/types").SlottablePressableProps, "style"> & {
    children?: React.ReactNode;
    style?: import("react-native").StyleProp<ViewStyle>;
    id?: TableKey;
    width?: number;
    minWidth?: number;
    flex?: number;
    allowsSorting?: boolean;
} & Partial<ColumnInjectedProps> & import("react").RefAttributes<View>>;
declare const Row: import("react").ForwardRefExoticComponent<Omit<import("react-native").PressableProps & import("react").RefAttributes<View>, "ref"> & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
    id?: TableKey;
    isDisabled?: boolean;
    skipInjectCellIndices?: boolean;
} & Partial<RowInjectedProps> & import("react").RefAttributes<View>>;
declare const Cell: import("react").ForwardRefExoticComponent<import("react-native").ViewProps & {
    asChild?: boolean;
} & {
    children?: React.ReactNode;
} & Partial<CellInjectedProps> & import("react").RefAttributes<View>>;
export { Cell, Column, Header, Root, Row, RowLayoutProvider, useColumnContext, useRootContext, useRowContext, };
//# sourceMappingURL=table.d.ts.map